type bool = boolean;
type int = number; // sad (and useless due to structural typing), but still valuable for expressing intent

function str(n: int) {
  return String(n);
}

///

class MineSweeper extends HTMLElement {



	ROWS: int = 9;
	COLS: int = 9;

	// const ROWS = 20;
	// const COLS = 20;


	mines: bool[][] = [];    // 2D grid, bool
	visible: bool[][]  = []; // 2D grid, bool
	counts: int[][] = [] ;  // 2D grid, int (well, 'number' in JS...)

	flags: bool[][] = [] ;  // 2D grid, bool


	cells: HTMLDivElement[][] = [];  // 2D grid, references to <td> (game board cells)

	firstClick = true;
	wasReset = false;

	init_mines() {
		this.mines = [];
		for(let x = 0; x < this.COLS; x++) {
			this.mines.push([]);
			for(let y = 0; y < this.ROWS; y++) {
				const isMine = Math.random() < 0.10; // on avg, 10% of board filled with mines 
				this.mines[x]!.push(isMine);
			}
		}
	}

	init_visible() {
		this.visible = [];
		for(let x = 0; x < this.COLS; x++) {
			this.visible.push([]);
			for(let y = 0; y < this.ROWS; y++) {
				this.visible[x]!.push(false);
			}
		}
	}

	init_table() {
		this.cells = [];
		// TODO: if I had a shadow dom, would this work? 
		//       If so, how do we query outside shadow dom?
		// const table = document.querySelector('table') as HTMLTableElement;
		const table = this.querySelector('table') as HTMLTableElement;
		
		for(let y = 0; y < this.ROWS; y++) {
			this.cells.push([]);
		}

		// for(let x = 0; x < this.COLS; x++) {
		for(let y = 0; y < this.ROWS; y++) {
			this.cells.push([]);
			const tr = document.createElement("tr");
			// for(let y = 0; y < this.ROWS; y++) {
				for(let x = 0; x < this.COLS; x++) {
				const td = document.createElement("td");
				// td.id = `${x}_${y}`;
				
				const cell = document.createElement("div");
				cell.className = 'cell';
				// cell.id = `${x}_${y}`;
				cell.dataset['x'] = str(x);
				cell.dataset['y'] = str(y);
				cell.setAttribute('tabindex', '0'); // enable keyboard navigation

				// TODO replace cell with custom element
				
				// NOTE: click events now handled on table (event delegation)

				this.cells[x]![y] = cell;
				td.append(cell);
				tr.append(td);
			}
			table.append(tr);
		}
		table.addEventListener("mousedown", (e) => this.click_table(e));
	}

	// init_board() {
	// 	// NOTE: this appears to be unnecessary 
	// 	// TODO remove?
	// 	/*	width: 21em; */ /* 9 cols * 2em per cell = 18em, plus 2em padding */
		
	// 	// const w = COLS * 2 + 2;
	// 	// document.querySelector('#board').style.width = w + 'em';
	// }

	///

	click_table(event: MouseEvent) {

		// TODO move this into Cell 

		// NOTE: currently we only handle the case where a cell was clicked
		const target = event.target as HTMLElement;
		
		if (target.tagName != 'DIV')  return;

		// TODO use .cell divs instead
		// if (target.className != 'cell') return;

		const cell = target as HTMLDivElement; // NOTE: click_cell() handler is only attached to TD elements 
		// const [x,y] = id_to_coords(cell.id);
		const x = Number(cell.dataset['x']);
		const y = Number(cell.dataset['y']);

		console.log('click',x,y)

		if(event.button == 0) {
			this.open_cell(x,y);
		}
		if(event.button == 2) {
			this.flag_cell(x,y);
			// event.preventDefault(); // prevent right click menu
			// return false; // prevent right click menu
		}
	}



	open_cell(x: int, y: int) {

		// visible[x][y] = true;
		let isMine = this.mines[x]![y];

		if(this.firstClick && isMine) {
			this.move_mine(x,y);
			isMine = false;
		}

		this.firstClick = false;

		if (isMine) {
			// cells[x][y].style.backgroundColor = "red";
			// alert('dead');
			this.game_over();
		} else {
			// cells[x][y].style.backgroundColor = "#ddd";
			this.flood_fill(x,y);
			if(this.check_win()) {
				alert('you win')
				this.game_over();
			}
		}
		this.render();
	}

	flag_cell(x: int, y: int) {
		console.log('right_click_cell', x, y)
		console.log(this.flags[x]![y])
		// if(visible[x][y]) return;
		this.flags[x]![y] = !this.flags[x]![y]!;
		console.log(this.flags[x]![y])
		this.render();
	}

	move_mine(x: int, y: int) {
		this.mines[x]![y] = false;
		// find first free slot from top left
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				if (this.mines[x]![y] == false) {
					this.mines[x]![y] = true;
					this.init_counts();
					this.render();
					return;
				}
			}
		}

	}

	// id_to_coords(id: string) : [int, int] {
	//   // TODO: after refactor does it make sense to use IDs here at all?
	//   // I think we removed them in another version
	// 	// EDIT: In React version we use an `index` prop on <Cell>, 
	// 	// and pass `index` to the click handler. (index is from the 1D version)
	//   // @ts-ignore 
	// 	return id.split('_').map(x => Number(x));
	// }

	///

	init_counts() {
		this.counts = [];
		for(let x = 0; x < this.COLS; x++) {
			this.counts.push([])
			for(let y = 0; y < this.ROWS; y++) {
				let count = 0;

				if (this.check_mine(x-1, y-1)) count++; // up left
				if (this.check_mine(x,   y-1)) count++; // up
				if (this.check_mine(x+1, y-1)) count++; // up right
				if (this.check_mine(x-1, y  )) count++; // left
				if (this.check_mine(x+1, y  )) count++; // right
				if (this.check_mine(x-1, y+1)) count++; // down left
				if (this.check_mine(x,   y+1)) count++; // down
				if (this.check_mine(x+1, y+1)) count++; // down right

				this.counts[x]![y] = count;
			}
		}
	}


	init_flags() {
		this.flags = [];
		for(let x = 0; x < this.COLS; x++) {
			this.flags.push([])
			for(let y = 0; y < this.ROWS; y++) {
				this.flags[x]![y] = false;
			}
		}
	}

	///

	check_mine(x: int, y: int) {
		if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) {
			return false;
		}
		return this.mines[x]![y];
	}

	flood_fill(x: int, y: int) {
		if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) {
			return;
		}
		if (this.visible[x]![y]) return;
		
		this.visible[x]![y] = true;
		if (this.counts[x]![y]! > 0) return; // only recurse if zero (blank) cell

		this.flood_fill(x-1, y-1)
		this.flood_fill(x,   y-1)
		this.flood_fill(x+1, y-1)
		this.flood_fill(x-1, y  )
		this.flood_fill(x+1, y  )
		this.flood_fill(x-1, y+1)
		this.flood_fill(x,   y+1)
		this.flood_fill(x+1, y+1)
	}

	///

	check_win() {
		// the game is won when all non mine tiles are uncovered
		// In other words, when the visible grid is the inverse of the mines grid

		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				if (this.visible[x]![y] == this.mines[x]![y]!) {
					return false;
				}
			}
		}
		return true;
	}

	///

	get_color(count: int) {
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

	render() {
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				const cell = this.cells[x]![y]!;
				if (!this.visible[x]![y]) {
					// cell.style.opacity = 0;
					cell.style.backgroundColor = '#aaa'
					if(this.flags[x]![y]){
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
					const count = this.counts[x]![y]!;
					if(this.mines[x]![y]){
						cell.style.backgroundColor = 'red';
						cell.innerHTML = 'x';
					}else{
						if (count > 0) {
							cell.innerHTML = str(count);
							cell.style.color = this.get_color(count);
						} else {
							cell.innerHTML = ' '; // zero cells are just blank
						}
					}
				}
			}
		}
	}

	// @ts-ignore
	dbg_render() {
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				const count = this.counts[x]![y]!;
				const isMine = this.mines[x]![y]!;
				const cell = this.cells[x]![y]!;
				if (isMine){
					cell.style.backgroundColor = 'red';
				}else{
					cell.innerHTML = (count == 0) ? ' ' : str(count);
					cell.style.color = this.get_color(count);
				}
				cell.style.opacity = '1';
			}
		}
	}

	show_all() {
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				this.visible[x]![y] = true;
			}
		}
		this.render();
	}

	///

	game_over() {
		this.show_all();
	}

	///

	init() {
		this.firstClick = true;
		this.init_mines();
		this.init_visible();
		this.init_counts();
		this.init_flags();
		if(!this.wasReset){
			this.init_table();
		}
		// this.init_board();
		// dbg_render();
		this.render();
	}

	reset() {
		this.wasReset = true;
		this.init();
	}

	///



	static observedAttributes = ['rows', 'cols'];

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'rows') {
      this.ROWS = Number(newValue);
    } else if (name === 'cols') {
      this.COLS = Number(newValue);
    }
		
  }

	connectedCallback() {
		const template = document.querySelector('#minesweeper-template')!
		this.innerHTML = template.innerHTML;
		// NOTE: could also use cloneNode(true); Not sure if it matters

		this.init();

		// disable context menu on game board
		this.addEventListener('contextmenu', function(e){
			e.preventDefault();
			return false;
		})

		// keyboard navigation
		// TODO: TS dislikes this. Is there a better way?
		// @ts-ignore 
		if (typeof window.minesweeper_kbd_handled === 'undefined') {
			// @ts-ignore
			window.minesweeper_kbd_handled = true;
			
			document.addEventListener('keydown', (event) => {
				console.log(event.target);
				console.log(event.code)
				const target = event.target as HTMLElement;
				if (!target.className.includes('cell')) {
					console.log(target);
					return;
				}
				const cell = event.target as HTMLDivElement;
				const x = Number(cell.dataset['x']);
				const y = Number(cell.dataset['y']);		

				if (event.code == 'Space') {

					this.open_cell(x,y);
					return;
				}

				if (event.code == 'KeyF') {
					this.flag_cell(x,y);
					return;
				}

				// movement
				let dx = 0;
				let dy = 0;
				switch(event.code) {
					case "ArrowUp":    dy = -1; break;
					case "ArrowDown":  dy =  1; break;
					case "ArrowLeft":  dx = -1; break;
					case "ArrowRight": dx =  1; break;
				}
				// let targetCell = findCell(x+dx, y+dy);
				let targetCell = this.cells[x+dx]![y+dy];
				
				if(targetCell) {
					targetCell.focus();
				}
			})
		}


	}

	// this.init();

	// TODO fixme
	// document.querySelector('#board')!.addEventListener('contextmenu', function(e){
	// 	e.preventDefault();
	// 	return false;
	// })

	// document.addEventListener('keydown', function(e) {
	// 	// console.log(e.key)
	// 	// console.log(e.code)
	// 	if (e.code == 'KeyR') {
	// 		reset();
	// 	}
	// })

}

customElements.define('mine-sweeper', MineSweeper);


