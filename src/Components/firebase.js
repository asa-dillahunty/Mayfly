import firebase from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import 'firebase/auth';

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

const firebaseCache = {};

export function deleteCache() {
    deleteObjMembers(firebaseCache);
}

function deleteObjMembers(obj) {
    if (!obj) return;
    for (var member in obj) {
        deleteObjMembers(obj[member]);
        delete obj[member];
    }
}

const startOfPayPeriod = 4; // Thursday
function getWeek(todaysDatetime) {
    // get the first day of the year of the pay period (Thursday)
    const firstDayOfYear = new Date(todaysDatetime.getFullYear(), 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();
    const firstThursday = new Date(firstDayOfYear.getFullYear(), 0, 1 + (dayOfWeek + startOfPayPeriod - 2)%7);

    const days = Math.floor((todaysDatetime - firstThursday) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    // add a check here for the cusp of the year. If week is zero, go back to last year
    return weekNumber;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);  
  
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function setHours(userID,date,hours) {
    /******** data schema: ********
        collection -> document           -> fields { hours:hours, date:datetime}
        userID     -> week number - year -> 
    */
    if (!firebaseCache[userID]) firebaseCache[userID]={};
    var savedData = firebaseCache[userID][buildDocName(date)];
    fillWeekCache(savedData);
    savedData[date.getDay()] = {
        date:date,
        hours:hours
    };
    setDoc(doc(db, userID, buildDocName(date)), savedData);
}

export async function getHours(userID,date) {
    
    if (!userID) return;

    if (firebaseCache[userID] && firebaseCache[userID][buildDocName(date)]) return firebaseCache[userID][buildDocName(date)][date.getDay()].hours;
    console.log("pulling data from Firebase");
    const docRef = doc(db, userID, buildDocName(date));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        if (!firebaseCache[userID]) firebaseCache[userID]={};
        firebaseCache[userID][buildDocName(date)] = docSnap.data();
        return firebaseCache[userID][buildDocName(date)][date.getDay()].hours;
    } else {
        // docSnap.data() will be undefined in this case
        if (!firebaseCache[userID]) firebaseCache[userID]={};
        firebaseCache[userID][buildDocName(date)] = fillWeekCache();
        console.log("No such document!");
        console.log(firebaseCache);
    }
    return 0;
}

export function buildDocName(date) {
    // console.log("here is the date",date);
    // if (date === undefined) return "";
    return getWeek(date) + "-" + date.getFullYear();
}

function fillWeekCache(week) {
    if (!week) week = {};
    for (var i=0;i<7;i++) {
        if (week[i]) continue;
        else week[i]={hours:0};
    }
    return week;
}

export default app;