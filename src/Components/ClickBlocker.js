// ClickBlocker.js
import React from 'react'
import './ClickBlocker.css';
import { RingLoader, SquareLoader } from 'react-spinners';

function ClickBlocker(props) {
	if (props.block) 
		if (props.loading) return ( <div className="blocker loading"> <RingLoader color='#ffffff' /> </div> );
		// this obviously will not remain 'SquareLoader' and will be replaced with a lock icon.
		// this will be used simply for areas that are disabled for some reason (like days outside of the pay period)
		else if (props.locked) return (  <div className="blocker"> <SquareLoader color='#000000'/> </div> );
		else if (props.custom) {
			return ( <div className='blocker fast'>
						<div className='childContainer'>
							{ props.children }
						</div> 
					</div>);
		}
		else if (props.confirm) {
			return (
				<div className='blocker fast'>
					<ConfirmDialog {...props} />
				</div>
			)
		}
		else return ( <div className="blocker"></div> );
	else return <></>
}

function ConfirmDialog(props) {
	return (
		<div className='childContainer'>
			<div className='confirm-container'>
				<p className='confirm-message'>{props.message}</p>
				{props.messageEmphasized ? <p className='confirm-message-emphasized'>{props.messageEmphasized}</p> : <></> }
				<div className='button-container'>
					<button onClick={props.onConfirm} className='confirm'>Confirm</button>
					<button onClick={props.onCancel} className='cancel'>Cancel</button>
				</div>
			</div>
		</div>
	);
}

export default ClickBlocker;
