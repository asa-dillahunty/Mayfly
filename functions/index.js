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

admin.initializeApp();

exports.createAdminUser = functions.https.onCall(async (data, context) => {
	try {
		// Check if the request is made by an admin
		if (!context.auth || context.auth.token.omniAdmin) {
			throw new functions.https.HttpsError('permission-denied', 'Only Asa can create admin users');
		}
		// Extract data from request
		const { email, phoneNumber } = data;

		// Create user
		let userRecord;
		if (email) {
			userRecord = await admin.auth().createUser({ email });
		} else if (phoneNumber) {
			userRecord = await admin.auth().createUser({ phoneNumber });
		} else {
			throw new functions.https.HttpsError('invalid-argument', 'Email or phone number is required');
		}
		await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

		await admin.firestore().collection(userRecord.uid).doc("Administrative_Data").set({
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
		if (!context.auth || !context.auth.token.admin) {
			throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
		}
		const { email, phoneNumber, companyID } = data;
		
		let userRecord;
		if (email) {
			userRecord = await admin.auth().createUser({ email });
		} else if (phoneNumber) {
			userRecord = await admin.auth().createUser({ phoneNumber });
		} else {
			throw new functions.https.HttpsError('invalid-argument', 'Email or phone number is required');
		}

		await admin.firestore().collection(userRecord.uid).doc("Administrative_Data").set({
			"isAdmin":false,
			"omniAdmin":false,
			"company":companyID
		});

		return { success: true, empID: userRecord.uid };
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error creating user', error);
	}
});