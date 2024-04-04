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

exports.createEmployee = functions.https.onCall(async (data, context) => {
	try {
		// Check if the request is made by an admin
		// if (!context.auth) {
		// 	throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
		// }
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

		// Optionally, assign custom claims for admin users
		// For example:
		// await admin.auth().setCustomUserClaims(userRecord.uid, { admin: false });

		// // Save user data to Firestore
		// await admin.firestore().collection('employees').doc(userRecord.uid).set({
		// 	// Add any additional user data here
		// 	email: userRecord.email,
		// 	phoneNumber: userRecord.phoneNumber,
		// });

		return { success: true, empID: userRecord.uid };
	} catch (error) {
		throw new functions.https.HttpsError('internal', 'Error creating user', error);
	}
});