import React, { useEffect, useLayoutEffect, useState } from "react";
import { auth, decrementDate, getCompany, getCompanyFromCache, getMyCompanyID, selectedDate } from "../lib/firebase";

function ConnectionHandler (props) {
	const [dataObject, setDataObject] = useState({});
	const [blocked, setBlocked] = useState(false);

	const onVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			console.log("visibility change: visible");
			// connect to the RTDB

			// if company
			// 		grab company last update
			// if employee
			// 		grab employee last update
			
		} else {
			// the window was closed 
			console.log("visibility change: hidden");

			// remove the RTDB listener
		}
	}

	useLayoutEffect(() => {
		document.addEventListener('visibilitychange',onVisibilityChange);
		return () => document.removeEventListener("visibilitychange",onVisibilityChange);
	}, []);

	useEffect(() => {
		if (props.company) {
			console.log("Fetching Company Data");
			// 4 is start of pay period. This is done because if it's the start of the pay period
			// you probably wanted to see last week's data
			if (selectedDate.value.getDay() === 4) decrementDate(selectedDate.value);
			fetchCompanyData().then(() => {
				// setInitialLoad(false);
			});
		}
	}, [props]);

	const parseRTDBMessage = () => {

	}
	
	const sendRTDBMessage = () => {

	}
	
	const connectToRTDB = (e) => {

	}

	const fetchCompanyData = async () => {
		// this needs to somehow wait for selected date to update first
		// update state! must somehow trigger an update in signals state
		setBlocked(true);

		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompanyFromCache(companyID);
		companyObj.id = companyID;
		setDataObject(companyObj);

		setBlocked(false);
	};

	const deepRefresh = async() => {
		setBlocked(true);
		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompany(companyID);
		companyObj.id = companyID;
		setDataObject(companyObj);
		setBlocked(false);
	};

	return (
		<>
			{
				React.cloneElement(
					props.children, {
						dataObject:dataObject,
						dataRefresh:fetchCompanyData,
						deepDataRefresh:deepRefresh,
						blocked:blocked,
					}
				)
			}
		</>
	);
}

export default ConnectionHandler;