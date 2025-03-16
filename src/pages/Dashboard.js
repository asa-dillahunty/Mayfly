// Dashboard.js
import React, { useEffect, useState } from "react";
import {
  auth,
  performLogout,
  setMyCompany,
  getClaimCodeInfo,
  createCompanyEmployee,
  deleteUnclaimedEmployee,
  getCompanyEmployee,
} from "../utils/firebase";
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";
import "./Dashboard.css";
import HourAdder from "../components/HourAdder";
import ClickBlocker from "../components/ClickBlocker";
import { useQuery } from "@tanstack/react-query";
import { getAdminDataQuery } from "../utils/firebaseQueries.ts";

const claimedStateEnum = {
  loading: 1,
  claimed: 2,
  unclaimed: 3,
};

function Dashboard(props) {
  const [blocked, setBlocked] = useState(false);

  const adminDataQuery = useQuery(getAdminDataQuery(auth.currentUser.uid));
  const getClaimStatus = () => {
    if (adminDataQuery.isLoading) return claimedStateEnum.loading;
    if (adminDataQuery.data?.company) return claimedStateEnum.claimed;
    return claimedStateEnum.unclaimed;
  };

  const handleLogout = () => {
    setBlocked(true);
    performLogout(props.setCurrPage)
      .then(() => {
        setBlocked(false);
      })
      .catch((e) => {
        console.error("Error code 7034: " + e.message);
      });
  };

  // if loading -> return a skeleton dashboard
  // if claimed -> return the normal dashboard
  // if unclaimed -> show them the the "enter code" screen
  if (getClaimStatus() === claimedStateEnum.claimed) {
    return (
      <div className="dashboard-container">
        <ClickBlocker block={blocked} />
        <div className="dashboard-header">
          <h1>Mayfly</h1>
          <button
            className="dashboard-logout"
            onClick={handleLogout}
            disabled={blocked}
          >
            Log Out
          </button>
        </div>
        <HourAdder
          showNotes
          uid={auth.currentUser.uid}
          blocked={blocked}
          setBlocked={setBlocked}
        />
      </div>
    );
  } else if (getClaimStatus() === claimedStateEnum.unclaimed) {
    <UnclaimedDashboard />;
  }
}

export default Dashboard;

function UnclaimedDashboard(props) {
  const [infoModal, setInfoModal] = useState(false);
  // TODO: fix me
  const handleLogout = () => {
    alert("cant do that right now");
    // setBlocked(true);
    // performLogout(props.setCurrPage)
    //   .then(() => {
    //     setBlocked(false);
    //   })
    //   .catch((e) => {
    //     console.error("Error code 7034: " + e.message);
    //   });
  };

  const executeClaim = () => {
    // TODO: investigate if this should be reimplemented,
    //        and decide how to handle 'unclaimed' users
    alert("not being implemented");
  };
  // const executeClaim = () => {
  //   let claimCode = "";
  //   const inputs = document.querySelectorAll("#claimCode input");
  //   for (let i = 0; i < 6; i++) {
  //     claimCode = claimCode + inputs[i].value;
  //   }

  //   getClaimCodeInfo(claimCode).then((data) => {
  //     // TODO:
  //     //		Execute these in a "transaction" or a batch write
  //     // https://firebase.google.com/docs/firestore/manage-data/transactions
  //     const companyID = data.companyID;
  //     setMyCompany(auth.currentUser.uid, companyID).then(() => {
  //       getCompanyEmployee(companyID, claimCode).then((empData) => {
  //         delete empData.unclaimed;
  //         createCompanyEmployee(empData, auth.currentUser.uid, companyID).then(
  //           () => {
  //             deleteUnclaimedEmployee(claimCode, companyID).then(() => {
  //               setClaimedState(claimedStateEnum.claimed);
  //             });
  //           }
  //         );
  //       });
  //     });
  //   });
  // };

  const pasteCode = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain");
    if (pasted.length !== 6) return; // not a code
    if (/[^a-zA-Z]/.test(pasted)) return;

    const inputs = document.querySelectorAll("#claimCode input");
    for (let i = 0; i < 6; i++) {
      inputs[i].value = pasted[i].toUpperCase();
    }
    inputs[5].focus();
  };

  const claimInputBackspace = (e) => {
    if (e.key === "Backspace") {
      if (e.target.value === "") {
        const index = parseInt(e.target.id[e.target.id.length - 1]); // gets the last character. won't work for > 9 (obviously)
        if (index > 0) {
          const inputs = document.querySelectorAll("#claimCode input");
          inputs[index - 1].focus();
          inputs[index - 1].select();
        }
      }
    }
  };

  const claimInputChange = (e) => {
    const val = e.target.value;
    const index = parseInt(e.target.id[e.target.id.length - 1]); // gets the last character. won't work for > 9 (obviously)
    const inputs = document.querySelectorAll("#claimCode input");

    if (!/^[a-zA-Z]*$/.test(val)) {
      e.target.value = ""; // Clear the input value if it's not a letter
    } else {
      // force uppercase
      if (e.target.value === e.target.value.toLowerCase())
        e.target.value = e.target.value.toUpperCase();

      if (index === inputs.length - 1) {
        // last input
        return;
      }
      if (val && inputs[index + 1]) {
        inputs[index + 1].focus();
        inputs[index + 1].select();
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* <ClickBlocker block={blocked} /> */}
      <ClickBlocker block={infoModal} custom={true}>
        <div className="info-modal-container">
          <p>
            Your administrator is responsible for sending you a code. Contact
            your employer to request a code.
          </p>
          <p>
            If you are an administrator or don't have an employer that sent you
            to this website to make an account, email me at
            asadillahunty@gmail.com
          </p>
          <button
            onClick={() => {
              setInfoModal(false);
            }}
          >
            Close
          </button>
        </div>
      </ClickBlocker>
      <div className="dashboard-header">
        <h1>Mayfly</h1>
        <button
          className="dashboard-logout"
          onClick={handleLogout}
          // disabled={blocked}
        >
          Log Out
        </button>
      </div>
      <h2>
        Welcome to <span className="title">Mayfly</span>
      </h2>
      <p className="tagline">Your new timekeeping app</p>
      <label>Input your code</label>
      <div id="claimCode">
        <input
          className="claim-code"
          id={`claim-code-0`}
          name={`claim-code-0`}
          maxLength={1}
          type="text"
          onChange={claimInputChange}
          onKeyDown={claimInputBackspace}
          autoComplete="off"
          onPaste={pasteCode}
        ></input>
        <input
          className="claim-code"
          id={`claim-code-1`}
          name={`claim-code-1`}
          maxLength={1}
          type="text"
          onChange={claimInputChange}
          onKeyDown={claimInputBackspace}
          autoComplete="off"
        ></input>
        <input
          className="claim-code"
          id={`claim-code-2`}
          name={`claim-code-2`}
          maxLength={1}
          type="text"
          onChange={claimInputChange}
          onKeyDown={claimInputBackspace}
          autoComplete="off"
        ></input>
        <input
          className="claim-code"
          id={`claim-code-3`}
          name={`claim-code-3`}
          maxLength={1}
          type="text"
          onChange={claimInputChange}
          onKeyDown={claimInputBackspace}
          autoComplete="off"
        ></input>
        <input
          className="claim-code"
          id={`claim-code-4`}
          name={`claim-code-4`}
          maxLength={1}
          type="text"
          onChange={claimInputChange}
          onKeyDown={claimInputBackspace}
          autoComplete="off"
        ></input>
        <input
          className="claim-code"
          id={`claim-code-5`}
          name={`claim-code-5`}
          maxLength={1}
          type="text"
          onChange={claimInputChange}
          onKeyDown={claimInputBackspace}
          autoComplete="off"
        ></input>
      </div>
      {/* <input id="claimCode" type='text' autoComplete='off' maxLength={6}></input> */}
      <p className="claim-code-info-p">
        <span
          onClick={() => {
            setInfoModal(true);
          }}
        >
          Don't have a code?
        </span>
      </p>
      <button className="claim-submit-button" onClick={executeClaim}>
        Submit
      </button>
    </div>
  );
}
