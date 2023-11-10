import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
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

/**
 * This function does a lot of math. Is this something I want to cache?
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);  
  
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

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
        date:date,
        hours:hours
    };
    setDoc(doc(db, userID, docName), savedData);
}

export async function getHours(userID,date) {
    const docName = buildDocName(date);
    console.log(docName);
    
    if (!userID) return;

    if (firebaseCache[userID] && firebaseCache[userID][docName]) return firebaseCache[userID][docName][date.getDay()].hours;
    console.log("pulling data from Firebase");
    const docRef = doc(db, userID, docName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        if (!firebaseCache[userID]) firebaseCache[userID]={};
        firebaseCache[userID][docName] = docSnap.data();
        return firebaseCache[userID][docName][date.getDay()].hours;
    } else {
        // docSnap.data() will be undefined in this case
        if (!firebaseCache[userID]) firebaseCache[userID]={};
        firebaseCache[userID][docName] = fillWeekCache();
        console.log("No such document!");
        // console.log(firebaseCache);
    }
    return 0;
}

export function buildDocName(date) {
    // console.log("here is the date",date);
    // if (date === undefined) return "";
    const weekNum = getWeek(date);
    console.log("weekNum: ",weekNum);

    /*
    if the start of the last year was wednesday or it was a (tuesday and a leap year)
    then there are actually 53 weeks instead of 52
    */
    if (weekNum === -1) return (date.getFullYear()-1) + "-52"; // cusp edge case
    else return date.getFullYear() + "-" + weekNum;
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