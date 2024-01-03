// ClickBlocker.js
import React from 'react'
import './ClickBlocker.css';

// Todo:
// 	- add support for showing some kind of loading icon as well.
function ClickBlocker(props) {
	if (props.block) return ( <div className="blocker"></div> );
	else return <></>
}

export default ClickBlocker;
