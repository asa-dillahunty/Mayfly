import "./CustomPicker.css";


const hours = [0,1,2,3,4,5,6,7,8,9]; 
export default function Picker ({value, onChange}) {
	
	const handleScroll = (event) => {
		const scrollTop = event.target.scrollTop;
		const itemHeight = event.target.firstChild.clientHeight;
		const selectedIndex = Math.floor(scrollTop / itemHeight);
		handleChange(hours[selectedIndex]);
	};
	
	/*
	set things like this ->
	{
		hours: num,
		minutes: decimal num
	}
	*/
	const handleChange = (num) => {
		// do some logic to get the one that's in the center
		// snap it to the center
		onChange({
			hours:num,
			minutes:0
		});
	};

	return (
		<div className="select-container" onScroll={handleScroll} >
			{hours.map((hour, index) => (
				<div key={index} className={`select-item ${value === hour ? 'selected' : ''}`}>
					{hour}
				</div>
			))}
		</div>
	);
}