import { useEffect, useRef, useState } from "react";
import "./CustomPicker.css";


const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const minutes = [0,.5]
let scrollTimeoutID;
export default function Picker ({value, onChange}) {
	const [selectedHour, setSelectedHour] = useState(value.hours);
	const [selectedMinutes, setSelectedMinutes] = useState(value.minutes);

	useEffect(() => {
		if (selectedHour === value.hours && selectedMinutes === value.minutes) return;
		onChange({
			hours:selectedHour,
			minutes:selectedMinutes,
		});
		console.log("change");

	}, [selectedHour,selectedMinutes]);

	return (
		<div className="picker-container">
			<PickerWheel values={hours} value={selectedHour} onChange={setSelectedHour} />
			<PickerWheel values={minutes} value={selectedMinutes} onChange={setSelectedMinutes} />
			<div className="select-bar"></div>
		</div>
	);
}

function PickerWheel ({value, values, onChange}) {
	const [selectedValue, setSelectedValue] = useState(value);
	const selectContainerRef = useRef(null);

	useEffect(() => {
		// debugger;
		centerOnValue(selectedValue);
	  }, [selectedValue]);

	const handleScroll = (_event) => {
		clearTimeout(scrollTimeoutID);
		scrollTimeoutID = setTimeout(() => {
			const container = selectContainerRef.current;
			const selectedIndex = getSelectedIndex();
			const newValue = values[selectedIndex];
			const newPosition = getScrollPosition(newValue);

			// do the snap
			if (container.scrollTop !== newPosition) container.scrollTop = newPosition;
			if (newValue === selectedValue) return;
			setSelectedValue(newValue);
			handleChange(newValue);
		}, 250);
	};

	const getSelectedIndex = () => {
		const container = selectContainerRef.current;
		const scrollTop = container.scrollTop;
		const itemHeight = container.firstChild.firstChild.clientHeight;
		const si = (( scrollTop + (container.clientHeight / 2) - 100 ) / itemHeight) -  .5;
		let selectedIndex = Math.round(si);

		if (selectedIndex > values.length - 1) {
			selectedIndex = values.length - 1;
		}
		else if (selectedIndex < 0) {
			selectedIndex = 0;
		}

		return selectedIndex;
	}

	const getScrollPosition = (value) => {
		const container = selectContainerRef.current;
		const itemHeight = container.firstChild.firstChild.clientHeight;
		const selectedIndex = values.indexOf(value);
		const scrollPosition = (selectedIndex + 0.5) * itemHeight - container.clientHeight / 2 + 100;
		return scrollPosition;
	}

	const centerOnValue = (value) => {
		const container = selectContainerRef.current;
		container.scrollTop = getScrollPosition(value);
	}

	const handleChange = (num) => {
		setSelectedValue(num);
		onChange(num);
	};

	return (
		<div className="select-container" onScroll={handleScroll} ref={selectContainerRef}>
			<div className="select-list">
				{values.map((val, index) => (
					<div key={index} className="select-item" onClick={() => handleChange(val)} >
						{val}
					</div>
				))}
			</div>
		</div>
	);
}