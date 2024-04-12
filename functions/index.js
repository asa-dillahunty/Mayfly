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

exports.createAdminUser = functions.https.onCall(async (data, context) => {
	try {
		// Check if the request is made by an admin
		if (!context.auth) {
			throw new functions.https.HttpsError('permission-denied', 'Only Asa can create admin users');
		}
		const adminDataDocRef = admin.firestore().collection(context.auth.uid).doc(ADMIN_DOC_NAME);
		const adminDataDocSnapshot = await adminDataDocRef.get();
		const adminIsOmniAdmin = adminDataDocSnapshot.data().omniAdmin;

		if (!adminIsOmniAdmin) {
			throw new functions.https.HttpsError('permission-denied', 'Only Asa can create admin users');
		}
		// Extract data from request
		const { email, phoneNumber, companyID } = data;

		// Create user
		let userRecord;
		if (email) {
			userRecord = await admin.auth().createUser({ email });
		} else if (phoneNumber) {
			userRecord = await admin.auth().createUser({ phoneNumber });
		} else {
			throw new functions.https.HttpsError('invalid-argument', 'Email or phone number is required');
		}

		await admin.firestore().collection(userRecord.uid).doc(ADMIN_DOC_NAME).set({
			"isAdmin":true,
			"omniAdmin":false,
			"company":companyID
		});

		return { success: true, empID: userRecord.uid };
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error creating user', error);
	}
});

exports.createEmployee = functions.https.onCall(async (data, context) => {
	try {
		// Check if the request is made by an admin
		if (!context.auth) {
			throw new functions.https.HttpsError('permission-denied', 'not authenticated');
		}
		const userDataDocRef = admin.firestore().collection(context.auth.uid).doc(ADMIN_DOC_NAME);
		const userDataDocSnapshot = await userDataDocRef.get();
		const userIsAdmin = userDataDocSnapshot.data().isAdmin;
		const userIsOmniAdmin = userDataDocSnapshot.data().omniAdmin;

		if (!context.auth || !(userIsAdmin || userIsOmniAdmin)) {
			throw new functions.https.HttpsError('permission-denied', 'Only Admins can create users');
		}

		const { email, companyID } = data;
		const actionCodeSettings = {
			url: 'https://mayfly.asadillahunty.com/',
			handleCodeInApp: true
		};
		// this should send the user an email with link to set up their password
		// it should look something like this:
		// 		https://mayfly.asadillahunty.com/?token={TOKEN_STRING}
		await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

		await admin.firestore().collection(userRecord.uid).doc(ADMIN_DOC_NAME).set({
			"isAdmin":false,
			"omniAdmin":false,
			"company":companyID
		});

		return { success: true, empID: userRecord.uid };
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error creating user', error);
	}
});

exports.removeEmployeeCompany = functions.https.onCall(async (data,context) => {
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