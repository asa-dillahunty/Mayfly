// Login.js
import React, { useState } from 'react';

import { pageListEnum } from '../App';
import ClickBlocker from './ClickBlocker';
import { AddEmployeeForm } from './Admin';

function Test(props) {
	const [blocked,setBlocked] = useState(false);

	return (
		<div>
			<p>Test page</p>
			<button onClick={()=>props.setCurrPage(pageListEnum.Login)}>Go Back</button>

			<button onClick={() => setBlocked(true)}>Test</button>
			
			<ClickBlocker custom={true} block={blocked}>
				<AddEmployeeForm  setBlocked={setBlocked}/>
			</ClickBlocker>
		</div>
	);
}

export default Test;
