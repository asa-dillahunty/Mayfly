import "./CustomPicker.css";

export default function Picker (props) {
	// add functionality with JavaScript
	const container = document.querySelector('.scroll-container')
	const items = document.querySelectorAll('.scroll-item')

	const scrollToItem = (index) => {
		// calculate the position of the item
		const item = items[index]
		const top = item.offsetTop
		// scroll the container to that position
		container.scrollTop = top - container.offsetTop
	}

	items.forEach((item, index) => {
		// add click event listener to each item
		item.addEventListener('click', () => {
			scrollToItem(index)
		});
	})
	
	return (
		<div class="scroll-container">
			<div class="scroll-item">Item 1</div>
			<div class="scroll-item">Item 2</div>
			<div class="scroll-item">Item 3</div>
			<div class="scroll-item">Item 4</div>
			<div class="scroll-item">Item 5</div>
			<div class="scroll-item">Item 6</div>
		</div>
	);
}