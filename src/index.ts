type bool = boolean;
type int = number; // sad (and useless due to structural typing), but still valuable for expressing intent

function str(n: int) {
  return String(n);
}

///

const ROWS = 9;
const COLS = 9;

// const ROWS = 20;
// const COLS = 20;


let mines: bool[][] = [];    // 2D grid, bool
let visible: bool[][]  = []; // 2D grid, bool
let counts: int[][] = [] ;  // 2D grid, int (well, 'number' in JS...)

let flags: bool[][] = [] ;  // 2D grid, bool


let cells: HTMLTableCellElement[][] = [];  // 2D grid, references to <td> (game board cells)

let firstClick = true;
let wasReset = false;

function init_mines() {
	mines = [];
	for(let x = 0; x < COLS; x++) {
		mines.push([]);
		for(let y = 0; y < ROWS; y++) {
			const isMine = Math.random() < 0.10; // on avg, 10% of board filled with mines 
			mines[x]!.push(isMine);
		}
	}
}

function init_visible() {
	visible = [];
	for(let x = 0; x < COLS; x++) {
		visible.push([]);
		for(let y = 0; y < ROWS; y++) {
			visible[x]!.push(false);
		}
	}
}

function init_table() {
	cells = [];
	const table = document.querySelector('table') as HTMLTableElement;
	for(let x = 0; x < COLS; x++) {
		cells.push([]);
		const tr = document.createElement("tr");
		for(let y = 0; y < ROWS; y++) {
			const td = document.createElement("td");
			td.id = `${x}_${y}`;
			// td.addEventListener("mousedown", (e) => {
			// 	e.target.style.backgroundColor = "red";
			// })
			// td.addEventListener("mousedown", click_cell) // NOTE: moved to table

			cells[x]![y] = td;
			tr.append(td);
		}
		table.append(tr);
	}
	table.addEventListener("mousedown", click_table);
}

function init_board() {
  // NOTE: this appears to be unnecessary 
  // TODO remove?
  /*	width: 21em; */ /* 9 cols * 2em per cell = 18em, plus 2em padding */
	
  // const w = COLS * 2 + 2;
	// document.querySelector('#board').style.width = w + 'em';
}

///

function click_table(event: MouseEvent) {

	// NOTE: currently we only handle the case where a cell was clicked
	const target = event.target as HTMLElement;
	
	if (target.tagName != 'TD')  return;

	// TODO use .cell divs instead
	// if (target.className != 'cell') return;

  const cell : HTMLTableElement = target as HTMLTableElement; // NOTE: click_cell() handler is only attached to TD elements 
	const [x,y] = id_to_coords(cell.id);
	console.log('click',x,y)

	if(event.button == 0) {
		left_click_cell(x,y);
	}
	if(event.button == 2) {
		right_click_cell(x,y);
		// event.preventDefault(); // prevent right click menu
		// return false; // prevent right click menu
	}
}

function left_click_cell(x: int, y: int) {

	// visible[x][y] = true;
	let isMine = mines[x]![y];

	if(firstClick && isMine) {
		move_mine(x,y);
		isMine = false;
	}

	firstClick = false;

	if (isMine) {
		// cells[x][y].style.backgroundColor = "red";
		// alert('dead');
		game_over();
	} else {
		// cells[x][y].style.backgroundColor = "#ddd";
		flood_fill(x,y);
		if(check_win()) {
			alert('you win')
			game_over();
		}
	}
	render();
}

function right_click_cell(x: int, y: int) {
	console.log('right_click_cell', x, y)
	console.log(flags[x]![y])
	// if(visible[x][y]) return;
	flags[x]![y] = !flags[x]![y]!;
	console.log(flags[x]![y])
	render();
}

function move_mine(x: int, y: int) {
	mines[x]![y] = false;
	// find first free slot from top left
	for(let x = 0; x < COLS; x++) {
		for(let y = 0; y < ROWS; y++) {
			if (mines[x]![y] == false) {
				mines[x]![y] = true;
				init_counts();
				render();
				return;
			}
		}
	}

}

function id_to_coords(id: string) : [int, int] {
  // TODO: after refactor does it make sense to use IDs here at all?
  // I think we removed them in another version
  // @ts-ignore 
	return id.split('_').map(x => Number(x));
}

///

function init_counts() {
	counts = [];
	for(let x = 0; x < COLS; x++) {
		counts.push([])
		for(let y = 0; y < ROWS; y++) {
			let count = 0;

			if (check_mine(x-1, y-1)) count++; // up left
			if (check_mine(x,   y-1)) count++; // up
			if (check_mine(x+1, y-1)) count++; // up right
			if (check_mine(x-1, y  )) count++; // left
			if (check_mine(x+1, y  )) count++; // right
			if (check_mine(x-1, y+1)) count++; // down left
			if (check_mine(x,   y+1)) count++; // down
			if (check_mine(x+1, y+1)) count++; // down right

			counts[x]![y] = count;
		}
	}
}


function init_flags() {
	flags = [];
	for(let x = 0; x < COLS; x++) {
		flags.push([])
		for(let y = 0; y < ROWS; y++) {
			flags[x]![y] = false;
		}
	}
}

///

function check_mine(x: int, y: int) {
	if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
		return false;
	}
	return mines[x]![y];
}

function flood_fill(x: int, y: int) {
	if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
		return;
	}
	if (visible[x]![y]) return;
	
	visible[x]![y] = true;
	if (counts[x]![y]! > 0) return; // only recurse if zero (blank) cell

	flood_fill(x-1, y-1)
	flood_fill(x,   y-1)
	flood_fill(x+1, y-1)
	flood_fill(x-1, y  )
	flood_fill(x+1, y  )
	flood_fill(x-1, y+1)
	flood_fill(x,   y+1)
	flood_fill(x+1, y+1)
}

///

function check_win() {
	// the game is won when all non mine tiles are uncovered
	// In other words, when the visible grid is the inverse of the mines grid

	for(let x = 0; x < COLS; x++) {
		for(let y = 0; y < ROWS; y++) {
			if (visible[x]![y] == mines[x]![y]!) {
				return false;
			}
		}
	}
	return true;
}

///

function get_color(count: int) {
	if (count < 1) throw "get_color() expected count >= 1"
	switch(count) {
		case 1: return 'blue';
		case 2: return 'green';
		case 3: return 'red';
		case 4: return 'navy';
		case 5: return 'maroon';
		case 6: return 'teal';
		case 7: return 'gray';  // can't find
		case 8: return 'black'; // seems to differ by version
    default: throw "get_color() received unexpected input: " + count
	}
}

///

function render() {
	for(let x = 0; x < COLS; x++) {
		for(let y = 0; y < ROWS; y++) {
			const cell = cells[x]![y]!;
			if (!visible[x]![y]) {
				// cell.style.opacity = 0;
				cell.style.backgroundColor = '#aaa'
				if(flags[x]![y]){
					cell.innerHTML = 'F';
					cell.style.color = 'red'
				} else {
					cell.innerHTML = '';
					cell.style.color = ''
				}
			} else {
				cell.style.color = ''
				cell.style.backgroundColor = '#ccc'
				cell.style.opacity = str(1);
				const count = counts[x]![y]!;
				if(mines[x]![y]){
					cell.style.backgroundColor = 'red';
					cell.innerHTML = 'x';
				}else{
					if (count > 0) {
						cell.innerHTML = str(count);
						cell.style.color = get_color(count);
					} else {
						cell.innerHTML = ' '; // zero cells are just blank
					}
				}
			}
		}
	}
}

// @ts-ignore
function dbg_render() {
	for(let x = 0; x < COLS; x++) {
		for(let y = 0; y < ROWS; y++) {
			const count = counts[x]![y]!;
			const isMine = mines[x]![y]!;
      const cell = cells[x]![y]!;
			if (isMine){
				cell.style.backgroundColor = 'red';
			}else{
				cell.innerHTML = (count == 0) ? ' ' : str(count);
				cell.style.color = get_color(count);
			}
			cell.style.opacity = '1';
		}
	}
}

function show_all() {
	for(let x = 0; x < COLS; x++) {
		for(let y = 0; y < ROWS; y++) {
			visible[x]![y] = true;
		}
	}
	render();
}

///

function game_over() {
	show_all();
}

///

function init() {
	firstClick = true;
	init_mines();
	init_visible();
	init_counts();
	init_flags();
	if(!wasReset){
		init_table();
	}
	init_board();
	// dbg_render();
	render();
}

function reset() {
	wasReset = true;
	init();
}

init();

document.querySelector('#board')!.addEventListener('contextmenu', function(e){
	e.preventDefault();
	return false;
})
document.addEventListener('keydown', function(e) {
	// console.log(e.key)
	// console.log(e.code)
	if (e.code == 'KeyR') {
		reset();
	}

})
