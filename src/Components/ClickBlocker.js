// ClickBlocker.js
import React from 'react'
import './ClickBlocker.css';
import { RingLoader, SquareLoader } from 'react-spinners';

function ClickBlocker(props) {
	if (props.block) 
		if (props.loading) return ( <div className="blocker"> <RingLoader color='#ffffff' /> </div> );
		// this obviously will not remain 'SquareLoader' and will be replaced with a lock icon.
		// this will be used simply for areas that are disabled for some reason (like days outside of the pay period)
		else if (props.locked) return (  <div className="blocker"> <SquareLoader color='#000000'/> </div> );
		else if (props.custom) return ( <div className='blocker'> { props.customContent } </div>);
		else return ( <div className="blocker"></div> );
	else return <></>
}

export default ClickBlocker;
