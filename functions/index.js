/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ADMIN_DOC_NAME = "Administrative_Data";

admin.initializeApp();

exports.createEmployee = functions.https.onCall(async (data, context) => {
	try {
		const { email, companyID, isAdmin } = data;
		if (!context.auth) {
			throw new functions.https.HttpsError('permission-denied', 'not authenticated');
		}
		const userDataDocRef = admin.firestore().collection(context.auth.uid).doc(ADMIN_DOC_NAME);
		const userDataDocSnapshot = await userDataDocRef.get();
		const userIsAdmin = userDataDocSnapshot.data().isAdmin;
		const userIsOmniAdmin = userDataDocSnapshot.data().omniAdmin;

		if (isAdmin && !userIsOmniAdmin) {
			throw new functions.https.HttpsError('permission-denied', 'Only Asa can create admin users');
		}
		else if (!(userIsAdmin || userIsOmniAdmin)) {
			throw new functions.https.HttpsError('permission-denied', 'Only Admins can create users');
		}

		
		const userRecord = await admin.auth().createUser({ email });

		// this should send the user an email with link to set up their password
		// it should look something like this:
		// 		https://mayfly.asadillahunty.com/?token={TOKEN_STRING}

		await admin.firestore().collection(userRecord.uid).doc(ADMIN_DOC_NAME).set({
			"isAdmin": isAdmin === true,
			"omniAdmin": false,
			"company": companyID
		});

		return { success: true, empID: userRecord.uid };
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error creating user: ' + error.message, error);
	}
});

exports.removeEmployeeCompany = functions.https.onCall(async (data, context) => {
	try {
		if (!context.auth) {
			throw new functions.https.HttpsError('permission-denied', 'not authenticated');
		}
		const requesterDataDocRef = admin.firestore().collection(context.auth.uid).doc(ADMIN_DOC_NAME);
		const requesterDataDocSnapshot = await requesterDataDocRef.get();
		const requesterIsAdmin = requesterDataDocSnapshot.data().isAdmin;
		const requesterIsOmniAdmin = requesterDataDocSnapshot.data().omniAdmin;
		const requesterCompanyID =  requesterDataDocSnapshot.data().company;

		const userDataDocRef = admin.firestore().collection(context.auth.uid).doc(ADMIN_DOC_NAME);
		const userDataDocSnapshot = await userDataDocRef.get();
		const userCompanyID = userDataDocSnapshot.data().company;

		if (!context.auth || !(requesterIsAdmin || requesterIsOmniAdmin)) {
			throw new functions.https.HttpsError('permission-denied', 'Only Admins can create users');
		}

		if (userCompanyID !== requesterCompanyID) {
			throw new functions.https.HttpsError("permission-denied","Admin of different company");
		}

		await admin.firestore().collection(data.uid).doc(ADMIN_DOC_NAME).update({
			"company":""
		});
		return { success: true };
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error removing user information', error);
	}
});

exports.transferEmployeeData = functions.https.onCall(async (data, context) => {
	try {
		if (!context.auth) {
			throw new functions.https.HttpsError('permission-denied', 'not authenticated');
		}

		const userDataDocRef = admin.firestore().collection(context.auth.uid).doc(ADMIN_DOC_NAME);
		const userDataDocSnapshot = await userDataDocRef.get();
		const userIsOmniAdmin = userDataDocSnapshot.data().omniAdmin;
		if (!userIsOmniAdmin) {
			throw new functions.https.HttpsError('permission-denied', 'Only Asa can create admin users');
		}

		const { oldCollectionPath, newCollectionPath } = data;
		const firestore = admin.firestore();
		const oldCollectionRef = firestore.collection(oldCollectionPath);
		const newCollectionRef = firestore.collection(newCollectionPath);

		const snapshot = await oldCollectionRef.get();

		if (snapshot.empty) {
			console.log('No matching documents found.');
			return { 
				success: true,
				message: "No matching documents found"
			};
		}

		const batch = firestore.batch();

		snapshot.forEach((doc) => {
			const newDocRef = newCollectionRef.doc(doc.id);
			batch.set(newDocRef, doc.data());
		});

		await batch.commit();
		return { 
			success: true,
			message: "Data transferred successfully."
		};
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error transferring user information', error);
	}
});