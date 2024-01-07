// ClickBlocker.js
import React from 'react'
import './ClickBlocker.css';
import { RingLoader } from 'react-spinners';

function ClickBlocker(props) {
	if (props.block) 
		if (props.loading) 
			return ( <div className="blocker"> <RingLoader color='#ffffff' /> </div> );
			else return ( <div className="blocker"></div> );
	else return <></>
}

export default ClickBlocker;
