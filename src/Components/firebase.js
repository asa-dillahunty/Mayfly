import firebase from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc} from "firebase/firestore";
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

const justDate = (datetime) => {
    var day = datetime.getDate(); //Date of the month: 2 in our example
    var month = datetime.getMonth(); //Month of the Year: 0-based index, so 1 in our example
    var year = datetime.getFullYear() //Year: 2013
    return year+"-"+month+"-"+day;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
  
  
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function setHours(userID,date,hours) {
    // let today=
    // var A = new Date(date.getFullYear(),0,1);
    // var days = Math.floor((date - A) / (24 * 60 * 60 * 1000));
 
    // var weekNumber = Math.ceil(days / 7);
    // console.log(A,weekNumber,days);

    // setDoc(doc(db, userID, date), {
    //   hours: hours
    // });
}
export async function getHours(userID,date) {
    return 8;
}

export default app;