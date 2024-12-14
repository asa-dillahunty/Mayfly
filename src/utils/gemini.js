function validateJeopardyData(data, numBoards, numCategories, numSongs) {
	try {
		if (data.finalJeopardy?.song === undefined) {
			throw new Error(`Final Jeopardy not included.`);
		}

		const boards = Object.keys(data);
		// we add one here for final jeopardy
		let sumBoards = 0;
	
		for (let i=0; i<boards.length; i++) {
			const boardKey = boards[i];
			if (boardKey === "finalJeopardy") continue;
			const board = data[boardKey];
			sumBoards++;
	
			if (!board.categories || !Array.isArray(board.categories)) {
				throw new Error(`Board ${boardKey} is missing 'categories' or it is not an array.`);
			}
	
			if (board.categories.length !== numCategories) {
				throw new Error(`Board ${boardKey} has ${board.categories.length} categories, expected ${numCategories}.`);
			}
	
			board.categories.forEach(category => {
				if (!category.songs || !Array.isArray(category.songs)) {
					throw new Error(`Category '${category.name}' in ${boardKey} is missing 'songs' or it is not an array.`);
				}
		
				// Check the number of songs in the category
				if (category.songs.length !== numSongs) {
					throw new Error(`Category '${category.name}' in ${boardKey} has ${category.songs.length} songs, expected ${numSongs}.`);
				}
			});
		}

		if (sumBoards !== numBoards) {
			throw new Error(`Expected ${numBoards} boards, but found ${sumBoards}.`);
		}
		
		return true;
	} catch (error) {
		console.log("Validation error:", error.message);
		return false;
	}
  }

const aiExample = {
	"board1": {
		"categories": [
			{
				"name": "Taylor's Feats",
				"songs": [
					{"song": "Build God, Then We'll Talk", "artist": "Panic! At The Disco"},
					{"song": "Deli", "artist": "Ice Spice"},
					{"song": "Don't", "artist": "Ed Sheeran"}
				]
			},
			{
				"name": "West Coast Hip-Hop",
				"songs": [
					{"song": "Gin and Juice", "artist": "Snoop Dogg"},
					{"song": "The Watcher", "artist": "Dr. Dre"},
					{"song": "Express Yourself", "artist": "N.W.A."}
				]
			},
			{
				"name": "In The Family",
				"songs": [
					{"song": "Burnin' Up", "artist": "Jonas Brothers"},
					{"song": "Circle The Drain", "artist": "Soccer Mommy"},
					{"song": "Follow Me", "artist": "Uncle Kracker"}
				]
			}
		]
	},
	"board2": {
		"categories": [
			{
				"name": "Blue Collar",
				"songs": [
					{"song": "Sue Me", "artist": "Sabrina Carpenter"},
					{"song": "Angel in the Snow", "artist": "Elliott Smith"},
					{"song": "Top of the World", "artist": "The Carpenters"}
				]
			},
			{
				"name": "YouTubers",
				"songs": [
					{"song": "Bitch Lasagna", "artist": "PewDiePie"},
					{"song": "It's Everyday Bro", "artist": "Jake Paul"},
					{"song": "Con te partirò", "artist": "Ludwig Ahgren"}
				]
			},
			{
				"name": "Royals",
				"songs": [
					{"song": "Tennis Courts", "artist": "Lorde"},
					{"song": "Let's Go Crazy", "artist": "Prince"},
					{"song": "Under Pressure", "artist": "Queen"}
				]
			}
		]
	},
	"finalJeopardy" : {
		"song": "Move Along", "artist": "The All-American Rejects"
	}
};

// Example JSON data (replace with actual AI output or test data)
const jeopardyData = {
	board1: {
	categories: [
		{
		name: "Soundtrack Superstars",
		songs: [
			{ song: "My Heart Will Go On", artist: "Celine Dion" },
			{ song: "Lose Yourself", artist: "Eminem" },
			{ song: "Stayin' Alive", artist: "Bee Gees" },
			{ song: "Falling Slowly", artist: "Glen Hansard & Marketa Irglova" }
		]
		},
		{
		name: "Name Drop",
		songs: [
			{ song: "Buddy Holly", artist: "Weezer" },
			{ song: "Billie Jean", artist: "Michael Jackson" },
			{ song: "Dear John", artist: "Taylor Swift" },
			{ song: "Andy Warhol", artist: "David Bowie" }
		]
		},
		{
		name: "Sibling Acts",
		songs: [
			{ song: "Everybody (Backstreet's Back)", artist: "Backstreet Boys" },
			{ song: "MMMBop", artist: "Hanson" },
			{ song: "The Wire", artist: "HAIM" },
			{ song: "I'll Be There", artist: "The Jackson 5" }
		]
		}
	]
	},
	board2: {
	categories: [
		{
		name: "Animal Instincts",
		songs: [
			{ song: "Eye of the Tiger", artist: "Survivor" },
			{ song: "Black Dog", artist: "Led Zeppelin" },
			{ song: "Crocodile Rock", artist: "Elton John" },
			{ song: "She Wolf", artist: "Shakira" }
		]
		},
		{
		name: "Cover Kings and Queens",
		songs: [
			{ song: "All Along the Watchtower", artist: "Jimi Hendrix" },
			{ song: "Respect", artist: "Aretha Franklin" },
			{ song: "Hallelujah", artist: "Jeff Buckley" },
			{ song: "I Will Always Love You", artist: "Whitney Houston" }
		]
		},
		{
		name: "Numerical Hits",
		songs: [
			{ song: "One", artist: "U2" },
			{ song: "7 Rings", artist: "Ariana Grande" },
			{ song: "99 Problems", artist: "Jay-Z" },
			{ song: "1979", artist: "Smashing Pumpkins" }
		]
		}
	]
	},"finalJeopardy" : {
		"song": "Move Along", "artist": "The All-American Rejects"
	}
};

// Validate the data
console.log("Is example 1 data valid?", validateJeopardyData(aiExample, 2, 3, 3));
console.log("Is example 2 data valid?", validateJeopardyData(jeopardyData, 2, 3, 4));