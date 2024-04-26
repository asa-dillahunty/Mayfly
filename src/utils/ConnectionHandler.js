import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { auth, decrementDate, deleteCompanyCache, getCompany, getCompanyFromCache, getEmpData, getHours, getLastChangeCached, getMyCompanyID, pullLastChange, selectedDate } from "./firebase";

export const dataStatusEnum = {
	loading:"loading",
	loaded:"loaded",
	error:"error",
	unclaimed:"unclaimed",
}

function ConnectionHandler (props) {
	const [dataObject, setDataObject] = useState({ status: dataStatusEnum.loading });
	const [blocked, setBlocked] = useState(false);

	const onVisibilityChange = useCallback(() => {
		if (document.visibilityState === 'visible') {
			// console.log("visibility change: visible");
			// connect to the RTDB

			// if company
			// 		grab company last update
			if (props.company) {
				getMyCompanyID(auth.currentUser.uid).then((companyID) => {
					const cachedChange = getLastChangeCached(companyID);
					pullLastChange(companyID).then((changeData) => {
						if (changeData.time.seconds > cachedChange.time.seconds) {
							deleteCompanyCache(companyID);
							deepRefresh();
						}
						else if (changeData.time.seconds === cachedChange.time.seconds) {
							if (changeData.time.nanoseconds > cachedChange.time.nanoseconds) {
								deleteCompanyCache(companyID);
								deepRefresh();
							}
						}
					});
				});
			}
			// if employee
			// 		grab employee last update
			
		} else {
			// the window was closed 
			// console.log("visibility change: hidden");

			// remove the RTDB listener
		}
	},[props]);

	useLayoutEffect(() => {
		document.addEventListener('visibilitychange',onVisibilityChange);
		return () => document.removeEventListener("visibilitychange",onVisibilityChange);
	}, [onVisibilityChange]);

	useEffect(() => {
		if (props.company) {
			// 4 is start of pay period. This is done because if it's the start of the pay period
			// you probably wanted to see last week's data
			if (selectedDate.value.getDay() === 4) decrementDate(selectedDate.value);
			fetchCompanyData().then(() => {
				// setInitialLoad(false);
			});
		}
		else if (props.emp) {
			fetchEmpData().then(() => {
			}).catch((e)=> {
				console.log("failure! "+e.message);
			})

		}
	}, [props]);

	const changeStatus = (status) => {
		const temp = { ...dataObject, status:status };
		console.log("here1", dataObject);
		console.log("here1.5", { ...dataObject, status:status } );
		setDataObject(temp);
		console.log("here2", dataObject);
	}

	// const parseRTDBMessage = () => {

	// }
	
	// const sendRTDBMessage = () => {

	// }
	
	// const connectToRTDB = (e) => {

	// }

	const dataRefresh = async () => {
		if (props.company) {
			await fetchCompanyData();
		}
		else if (props.emp) {

		}
	}

	const deepDataRefresh = async () => {
		if (props.company) {
			await deepRefresh();
		}
		else if (props.emp) {

		}
	}

	const fetchEmpData = async () => {
		const empObj = await getEmpData(props.empID);
		// TODO: check if unclaimed
		setDataObject({ ...empObj, id:props.empID, status:dataStatusEnum.loaded });
	};

	const requestData = ({type, params}) => {
		if (type === "hours") {
			console.log("Made it in");
			changeStatus(dataStatusEnum.loading);
			console.log("Changing Status");
			if (props.emp) {
				getHours(props.empID, params.date, params.docName).then(async () => {
					console.log("Fetched Hours");
					await fetchEmpData(); // should be instant
					// should auto-set status to loaded
				});
			} 
			else if (props.company) {
				getHours(params.empID, params.date, params.docName).then(async () => {
					await fetchEmpData(); // should be instant
					// should auto-set status to loaded
				});
			}
		}
	}

	const fetchCompanyData = async () => {
		// this needs to somehow wait for selected date to update first
		// update state! must somehow trigger an update in signals state
		setBlocked(true);

		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompanyFromCache(companyID);
		companyObj.id = companyID;
		companyObj.status = dataStatusEnum.loaded;
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
						dataObject: dataObject,
						dataRefresh: dataRefresh,
						deepDataRefresh: deepDataRefresh,
						requestData: requestData,
						blocked:blocked,
					}
				)
			}
		</>
	);
}

export default ConnectionHandler;