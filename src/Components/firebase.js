import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, collection, deleteDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { signal } from '@preact/signals-react';
import 'firebase/auth';
import 'firebase/functions';
import { getFunctions, httpsCallable } from "firebase/functions";
import { pageListEnum } from "../App";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDi4JBfJPfBUXutm38DqUrjg2s8Q8xi3ls",
	authDomain: "primer-53a41.firebaseapp.com",
	projectId: "primer-53a41",
	storageBucket: "primer-53a41.appspot.com",
	messagingSenderId: "785639513587",
	appId: "1:785639513587:web:8d6c676586571a19228686",
	measurementId: "G-J8SZNH25ZJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const createEmp = httpsCallable(functions, 'createEmployee');

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

const COMPANY_LIST_COLLECTION_NAME = "CompanyList";
const UNCLAIMED_LIST_COLLECTION_NAME = "UnclaimedList"
const ADMIN_DOC_NAME = "Administrative_Data";
const COMPANY_EMPLOYEE_COLLECTION = "Employees";
const daysInChunk = 7;
export const FAKE_EMAIL_EXTENSION = "@dillahuntyfarms.com";

export const selectedDate = signal(new Date(new Date().toDateString()));
export const setSelectedDate = (date) => {
	selectedDate.value = date;
}
export const currentDate = signal(new Date(new Date().toDateString()));
export const refreshCurrentDate = () => {
	currentDate.value = new Date(new Date().toDateString());
}

export const performLogout = async (navigate) => {
	try {
		deleteCache();
		await auth.signOut();
		navigate(pageListEnum.Login);
	} catch (error) {
		console.error('Error signing out:', error.message);
	}
};

const firebaseCache = {};
const firebaseSignalCache = {};
export function deleteCache() {
	// deleteObjMembers(firebaseCache);
	// deleteObjMembers(firebaseSignalCache);
}

function deleteObjMembers(obj) {
	if (!obj) return;
	for (var member in obj) {
		deleteObjMembers(obj[member]);
		delete obj[member];
	}
}

/**
 * This function does a lot of math. Is this something I want to cache? #dynamicProgramming
 */
const startOfPayPeriod = 4; // Thursday
function getWeek(selectedDatetime) {
	// get the first day of the year of the pay period (Thursday)
	const selectedDateUTC = Date.UTC(selectedDatetime.getFullYear(),selectedDatetime.getMonth(),selectedDatetime.getDate());

	const dayOfWeekOfDayOne = new Date(selectedDatetime.getFullYear(),0,1).getDay();
	// this actually gets the first wednesday
	// we do +6 instead of -1 to avoid negative output from the mod
	const firstThursday = Date.UTC(selectedDatetime.getFullYear(), 0, 1 + (startOfPayPeriod - dayOfWeekOfDayOne + 6)%7);
	// add a check here for the cusp of the year. Go back to last year. (or maybe return -1)
	if (firstThursday >= selectedDateUTC) {
		return -1;// console.log("this is a 'cusp' week");
	}
	
	const days = Math.floor((selectedDateUTC - firstThursday) / 86400000); //  24 * 60 * 60 * 1000
	const weekNumber = Math.ceil(days / 7);
	// console.log(weekNumber, selectedDateUTC, firstThursday,firstDayOfYear);
	return weekNumber;
}

function getStartOfPayPeriod(date) {
	let firstDay = new Date(date.getTime());
	while (firstDay.getDay() !== startOfPayPeriod) {
		firstDay.setDate(firstDay.getDate() - 1);
	}
	return firstDay;
}

function getEndOfPayPeriod(date) {
	let finalDay = new Date(date.getTime());
	finalDay.setDate(finalDay.getDate() + 1);
	while (finalDay.getDay() !== startOfPayPeriod) {
		finalDay.setDate(finalDay.getDate() + 1);
	}
	return finalDay;
}

export function getWeekSpanString(selectedDate) {
	// we move ahead one day just in case it is the day of the pay period
	let finalDay = getEndOfPayPeriod(selectedDate);
	let firstDay = getStartOfPayPeriod(selectedDate);
	// why + 1 ? date.getMonth() starts at 0 for January
	return (firstDay.getMonth()+1) + "/" + firstDay.getDate() + " - " + (finalDay.getMonth()+1) + "/" + finalDay.getDate();
}

export function getEndOfWeekString(selectedDate) {
	let finalDay = new Date(selectedDate.getTime());
	while (finalDay.getDay() !== startOfPayPeriod) {
		finalDay.setDate(finalDay.getDate() + 1)
	}
	// why + 1 ? date.getMonth() starts at 0 for January
	// why % 100 ? grabs last two digits of the year
	return (finalDay.getMonth()+1) + "/" + finalDay.getDate() + "/" + (finalDay.getFullYear() % 100);
}

export async function setHours(userID,date,hours) {
	const docName = buildDocName(date);
	/******** data schema: ********
		collection -> document           -> fields { hours:hours, date:datetime}
		userID     -> week number - year -> 
	*/
	if (!firebaseCache[userID]) firebaseCache[userID]={};
	var savedData = firebaseCache[userID][docName];
	fillWeekCache(savedData);
	savedData[date.getDay()] = {
		hours:hours
	};
	setDoc(doc(db, userID, docName), savedData).then((_value) => {
		// Todo:
		//	- if fail do something

		// update the firebase signal cache thing
		getHoursSignal(userID,date,docName).value = hours;
	});
}

export function getHoursEarlyReturn(userID,date,docName) {
	if (arguments.length === 2) docName = buildDocName(date);

	if (firebaseCache[userID] && firebaseCache[userID][docName] && !firebaseCache[userID][docName]["awaiting"]) 
		return firebaseCache[userID][docName][date.getDay()].hours;
	if (firebaseCache[userID] && firebaseCache[userID][docName] && firebaseCache[userID][docName]["awaiting"]) {
		return -1;
	}
	// set waiting true
	if (!firebaseCache[userID]) firebaseCache[userID]={};
	if (!firebaseCache[userID][docName]) firebaseCache[userID][docName] = {"awaiting" : true};
	// start the search
	getHours(userID,date,docName);
	return -1;
}

export async function getHours(userID,date,docName) {
	// console.log("getting hours");
	if (arguments.length === 2) docName = buildDocName(date);
	
	if (!userID) return;

	if (firebaseCache[userID] && firebaseCache[userID][docName] && !firebaseCache[userID][docName]["awaiting"]) 
		return firebaseCache[userID][docName][date.getDay()].hours;
	console.log("pulling data from Firebase");

	const docRef = doc(db, userID, docName);
	const docSnap = await getDoc(docRef);

	if (!firebaseCache[userID]) firebaseCache[userID]={};

	if (docSnap.exists()) {
		firebaseCache[userID][docName] = docSnap.data();
		// this for loop is probably horrible performance-wise (mostly because of buildDocName)
		// fixed that ^. 
		// Todo: 
		//	- to reinvestigate performance here
		
		// call get signals to set up the signals
		getHoursSignal(userID,date,docName);
		// update the signals
		for (let i=0;i<daysInChunk;i++) {
			// since we know this will only ever hold hours signals, it doesn't need to be an object at index i
			firebaseSignalCache[userID][docName][i].value = firebaseCache[userID][docName][i].hours;
		}
		return firebaseCache[userID][docName][date.getDay()].hours;
	} else {
		// docSnap.data() will be undefined in this case
		// signals default to zero and do no need to be updated
		if (!firebaseCache[userID]) firebaseCache[userID]={};
		firebaseCache[userID][docName] = fillWeekCache();
		console.log("No such document!");
		// console.log(firebaseCache);
	}
	return 0;
}

export function getHoursSignal(userID,date,docName) {
	if (arguments.length === 2) docName = buildDocName(date);
	
	if (!userID) return;
	// if it exists, great
	if (firebaseSignalCache[userID] && firebaseSignalCache[userID][docName]) return firebaseSignalCache[userID][docName][date.getDay()];

	if (!firebaseSignalCache[userID]) firebaseSignalCache[userID]={};
	if (!firebaseSignalCache[userID][docName]) firebaseSignalCache[userID][docName] = {};
	for (let i=0;i<daysInChunk;i++) {
		// since we know this will only ever hold hours signals, it doesn't need to be an object at index i
		if (firebaseCache[userID] && firebaseCache[userID][docName] && !firebaseCache[userID][docName]["awaiting"]) {
			firebaseSignalCache[userID][docName][i] = new signal(firebaseCache[userID][docName][i].hours);
		}
		else firebaseSignalCache[userID][docName][i] = new signal(0);
	}
	// we assume that all our data has been cached

	// if the signal doesn't exist, call get hours to set it up
	getHoursEarlyReturn(userID,date,docName);

	return firebaseSignalCache[userID][docName][date.getDay()];
}

export async function getHoursThisWeek(userID,date,docName) {
	if (arguments.length === 2) docName = buildDocName(date);
	if (!userID) return 0;

	let totalHours = 0;
	let currDay = getStartOfPayPeriod(date);
	
	do {
		currDay.setDate(currDay.getDate() + 1);
		totalHours += await getHours(userID,currDay,docName);
	} while (currDay.getDay() !== startOfPayPeriod)
	return totalHours;
}

export function buildDocName(date) {
	// console.log("here is the date",date);
	// if (date === undefined) return "";
	const weekNum = getWeek(date);

	/*
	if the start of the last year was wednesday or it was a (tuesday and a leap year)
	then there are actually 53 weeks instead of 52
	*/
	if (weekNum === -1) return (date.getFullYear()-1) + "-52"; // cusp edge case
	else return date.getFullYear() + "-" + weekNum;
}

function fillWeekCache(week) {
	if (!week) week = {};
	for (var i=0;i<daysInChunk;i++) {
		if (week[i]) continue;
		else week[i]={hours:0};
	}
	return week;
}

// uid - userID
// cid - company ID
export async function makeAdmin(uid,cid) {
	const docRef = doc(db, uid, ADMIN_DOC_NAME);
	// const docSnap = await getDoc(docRef);

	setDoc(docRef, {"isAdmin":true,"company":cid}).then((_value) => {
		// Todo:
		//	- if fail do something

		alert("succeeded (probably)");
	});
}

export async function getIsAdmin(uid) {
	const adminData = await getAdminData(uid);
	if (adminData) return adminData.isAdmin === true;
	else return false;
}

// uid - userID
// cid - company ID
export async function setMyCompany(uid,cid) {
	const docRef = doc(db, uid, ADMIN_DOC_NAME);
	// const docSnap = await getDoc(docRef);

	setDoc(docRef, {"company":cid}).then((_value) => {
		// Todo:
		//	- if fail do something
		// update cache
	});
}

export async function getMyCompanyID(userID) {
	console.log("userID",userID);
	const adminData = await getAdminData(userID);
	console.log(adminData);
	if (adminData) return adminData.company;
	else return undefined;
}

export async function getAdminData(uid) {
	if (!uid || uid === '') return {};
	if (!firebaseCache[uid] || !firebaseCache[uid][ADMIN_DOC_NAME]) {
		const docRef = doc(db, uid, ADMIN_DOC_NAME);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			if (!firebaseCache[uid]) firebaseCache[uid] = {};
			firebaseCache[uid][ADMIN_DOC_NAME] = docSnap.data();
		}
		else return {};
	}
	return firebaseCache[uid][ADMIN_DOC_NAME];
}

export async function getCompanyEmployee(company_ID, empID) {
	const docRef = doc(db, COMPANY_LIST_COLLECTION_NAME +'/'+ company_ID +"/"+COMPANY_EMPLOYEE_COLLECTION,empID);	
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		return docSnap.data();
	}
	else {
		// TODO:
			// throw an error
	}
}

export async function getCompany(company_ID) {
	if (company_ID === "") return { name:"Major Error Occurred"};
	const docRef = doc(db, COMPANY_LIST_COLLECTION_NAME, company_ID);
	const docSnap = await getDoc(docRef);

	const employeeCollection = collection(db, COMPANY_LIST_COLLECTION_NAME + '/' + company_ID + '/' + COMPANY_EMPLOYEE_COLLECTION);
	const docListSnapshot = await getDocs(employeeCollection);
	const docList = docListSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // this gives an array of employee objects with ID as a field
	const docName = buildDocName(currentDate.value);
	for (let i=0;i<docList.length;i++) {
		docList[i].hoursThisWeek = await getHoursThisWeek(docList[i].id, currentDate.value, docName);
	}
	const companyData = docSnap.data();
	companyData.employees = docList;
	return companyData;
}

export async function getCompanies() {
	const companyList = collection(db, COMPANY_LIST_COLLECTION_NAME);
	return await getDocs(companyList); // Fetch documents from the "Companies" collection
}

export function createCompany(companyName) {
	const companyList = collection(db, COMPANY_LIST_COLLECTION_NAME);
	addDoc(companyList, {
		name: companyName
	})
	.then((docRef) => {
		console.log("Added Company with ID: ", docRef.id);
		// update displayed company list
	})
	.catch((error) => {
		// do something to alert the user
		console.log(error);
	})
}

export async function createCompanyEmployee(empData, empID, companyID) {
	await setDoc(doc(db, COMPANY_LIST_COLLECTION_NAME + '/' + companyID + '/' + COMPANY_EMPLOYEE_COLLECTION, empID), {
		...empData
	});
}

export async function deleteCompanyEmployee(empID, companyID) {
	const docRef = doc(db, COMPANY_LIST_COLLECTION_NAME + '/' + companyID + '/' + COMPANY_EMPLOYEE_COLLECTION, empID)
	await deleteDoc(docRef);

	// grab the employee's collection -> delete their administrative_data
	const empDocRef = doc(db, empID, ADMIN_DOC_NAME);
	await deleteDoc(empDocRef);

}

export async function createUnclaimedEmployee(employeeData, companyID) {
	// grab unclaimed collection
	const unclaimedCollection = collection(db, UNCLAIMED_LIST_COLLECTION_NAME);
	const unclaimedSnapshot = await getDocs(unclaimedCollection); // Fetch documents from the "Companies" collection
	const unclaimedList = unclaimedSnapshot.docs.map(doc => (doc.id));
	// makes a list of unclaimed ids
	
	let claimCode = "";
	do {
		claimCode = randomString(6);
	} while (unclaimedList.includes(claimCode));
	
	// add claimCode to the unclaimed collection
	await setDoc(doc(db, UNCLAIMED_LIST_COLLECTION_NAME, claimCode), {
		"unclaimed":true,
		"companyID":companyID
	});
	
	// create a new employee in the collection
	// add it to the company's employees collection
	employeeData.unclaimed = true;
	await createCompanyEmployee(employeeData, claimCode, companyID);

	// add other fields for their name and things :)
	// add it to the new "unclaimed" collection, along with the company ID to trace it back to the company
}

export async function deleteUnclaimedEmployee(claimCode, companyID) {
	const docRef = doc(db, UNCLAIMED_LIST_COLLECTION_NAME, claimCode);
	await deleteDoc(docRef);
	await deleteCompanyEmployee(claimCode, companyID);
}

export async function createEmployeeAuth(empData, companyID) {
	const email = empData.email
	const result = await createEmp({email});
	console.log(result.data);
	if (!result.data.success) alert("That defo failed");

	// need to return the employee's ID as well
	createCompanyEmployee(empData, result.data.empID, companyID);
	setMyCompany(result.data.empID, companyID)
}

export async function resetPassword(email) {
	const result = sendPasswordResetEmail(auth, email);
	return result;
}

export async function getClaimCodeInfo(claimCode) {
	const docRef = doc(db, UNCLAIMED_LIST_COLLECTION_NAME, claimCode);
	const docSnap = await getDoc(docRef);

	if (!docSnap.exists()) return undefined;
	return docSnap.data();
}

export async function createUser(userData) {
	const email = userData.username + FAKE_EMAIL_EXTENSION;
	const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
	const user = userCredential.user;

	return user;
}

export function randomString(length) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

export default app;