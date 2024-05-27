type bool = boolean;
type int = number; // sad (and useless due to structural typing), but still valuable for expressing intent

function str(n: int) {
  return String(n);
}

///


class MsgBus {
  handlers: Record<string, Function[]> = {}; // map of array

  subscribe(event: string, callback: Function): () => void {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    this.handlers[event]!.push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event: string, callback: Function) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event]!.filter( cb => cb !== callback);
  }

  publish(event: string, data: any) {
    if(this.handlers[event]) {
      for(let callback of this.handlers[event]!) {
        callback(data);
      }
    }
  }
}

let msgBus = new MsgBus();

///

class MineSweeper extends HTMLElement {
	gameOver = false;
	wonGame = false;
	firstClick = true;
	wasReset = false;

	startTime = -1;
	endTime = -1;
	score: int = 0;

	ROWS: int = 9;
	COLS: int = 9;


	mines: bool[][] = []; 
	visible: bool[][]  = []; 
	counts: int[][] = [] ; 

	flags: bool[][] = [] ; 


	cells: HTMLDivElement[][] = []; 

	clock_interval: number | null = null;
	clock_start_time: Date | null = null;
	clock_stop_time: Date | null = null; // technically unused, but for completeness
	

	clock_start() : void {
		this.clock_start_time = new Date();
		this.clock_interval = window.setInterval(()=>{ this.update_clock(); }, 100);
	}

	clock_stop(): void {
		if (this.clock_interval){
			window.clearInterval(this.clock_interval);
			this.clock_interval = null;
			this.clock_stop_time = new Date();
		}
	}

	init_mines() : void {
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
		
		const table = this.querySelector('table') as HTMLTableElement;
		
		for(let y = 0; y < this.ROWS; y++) {
			this.cells.push([]);
		}

		for(let y = 0; y < this.ROWS; y++) {
			this.cells.push([]);
			const tr = document.createElement("tr");
				for(let x = 0; x < this.COLS; x++) {
				const td = document.createElement("td");
				
				const cell = document.createElement("div");
				cell.className = 'cell';
				cell.dataset['x'] = str(x);
				cell.dataset['y'] = str(y);
				cell.setAttribute('tabindex', '0'); // enable keyboard navigation

				// TODO replace cell with custom element ?
				
				// NOTE: click events now handled on table (event delegation)
				// EDIT: This doesn't necessarily constitute an improvement...
				//       If we make Cell its own component, we'll move the event back inside

				this.cells[x]![y] = cell;
				td.append(cell);
				tr.append(td);
			}
			table.append(tr);
		}
		table.addEventListener("mousedown", (e) => this.click_table(e));
	}


	click_table(event: MouseEvent) {

		if(this.gameOver) return;

		// TODO move this into a Cell component ?

		// NOTE: currently we only handle the case where a cell was clicked
		const target = event.target as HTMLElement;
		
		if (target.tagName != 'DIV')  return;

		// TODO use .cell divs instead
		if (target.className != 'cell') return;

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

		if (this.clock_interval == null) {
			this.clock_start();
		}

		// visible[x][y] = true;
		let isMine = this.mines[x]![y];

		if (this.firstClick){
			this.startTime = Number(new Date());
		
			if(isMine) {
				this.move_mine(x,y);
				isMine = false;
			}
		}

		this.firstClick = false;

		if (isMine) {
			this.game_over(false);
		} else {
			this.flood_fill(x,y);
			if(this.check_win()) {
				this.game_over(true);
			}
		}
		this.render();
	}

	flag_cell(x: int, y: int) {
		if (this.clock_interval == null) {
			this.clock_start();
		}
		
		console.log('right_click_cell', x, y)
		console.log(this.flags[x]![y])
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
		// status messages 
		this.update_text_content();

		// board
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				const cell = this.cells[x]![y]!;
				if (!this.visible[x]![y]) {
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

  count_mines() : int {
		let count = 0;
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				if(this.mines[x]![y]!) {
					count++;
				}
			}
		}
		return count;
	}

	count_flags() : int {
		let count = 0;
		for(let x = 0; x < this.COLS; x++) {
			for(let y = 0; y < this.ROWS; y++) {
				if(this.flags[x]![y]!) {
					count++;
				}
			}
		}
		return count;
	}

	count_unflagged_mines() : int {
		return this.count_mines() - this.count_flags();
	}

	///

	update_text_content() : void {
		this.update_status_text();
		// this.update_time(); // NOTE: time updates itself
		this.update_score(); // NOTE: Score only displays at end of game
		this.update_restart_msg(); // NOTE: Restart message only displays at end of game 

	}

	update_clock() : void {
		const time_msg = this.querySelector('#time-msg') as HTMLHeadingElement;
		const elapsed = Number(new Date()) - Number(this.clock_start_time);
		const total_seconds = Math.floor(elapsed / 1000);
		const display_seconds = total_seconds % 60;
		const total_minutes = Math.floor(total_seconds / 60);
		// time_msg.textContent = str(total_seconds); // classic
		const s = (display_seconds<10) ? `0${display_seconds}` : str(display_seconds);
		const m = (total_minutes<10) ? `0${total_minutes}` : str(total_minutes);
		
		time_msg.textContent = `${m}:${s}`;
		// TODO: this breaks if you play for more than an hour...
		// I think original minesweeper just shows seconds and caps them at 999?
		
	}

	update_status_text() : void {
		const status_msg = this.querySelector('#status-msg') as HTMLHeadingElement;
		if(this.gameOver) {
			status_msg.textContent = this.wonGame ? 'You Win!' : 'Game Over!';
		} else {
			status_msg.textContent = `Mines Left: ${this.count_unflagged_mines()}`;
		}
	}

	update_score() : void {
		const score_msg = this.querySelector('#score-msg') as HTMLHeadingElement;
		if(this.gameOver) {
			score_msg.textContent = `Score: ${this.score}`;
		} else {
			score_msg.innerHTML = '&nbsp;';
		}
	}

	update_restart_msg() : void {
		let restart_msg = this.querySelector('#restart-msg') as HTMLHeadingElement;
		if(!this.gameOver) {
			restart_msg.style.visibility = 'hidden';
		} else {
			restart_msg.style.visibility = '';
		}
	}

	game_over(win: bool) {
		
		this.gameOver = true;
		this.wonGame = win;

		this.clock_stop();

		this.endTime = Number(new Date());
		if(win){
			const time = this.endTime - this.startTime;
			if (time == 0) {
				this.score = Infinity;
				// Note: In JS, Infinity is already the result of 1/0
				// But now we're explicit about it!
			} else {
				this.score = Math.floor( ( 1/time ) * 1000000);
			}
		} else {
			this.score = 0;
		}
		this.show_all();
		this.update_status_text();
		this.update_score();

		const status_msg = this.querySelector('#status-msg') as HTMLHeadingElement;
		const gameOverText = win ? 'You Win!' : 'You Exploded!';
		status_msg.textContent = gameOverText; 
		`Mines: ${this.count_mines()}`;

		// notify high score component
		const payload : GameOverEvent = { 
			score: this.score, 
			highScoreCallback: () => { this._highlight(); }
		}; 
		msgBus.publish("gameover", payload);
		
	}

	///

	init() {

		this.gameOver = false;
		this.wonGame = false;
		this.firstClick = true;
		// this.wasReset = false; // we use this to not rebuild the board on subsequent inits
		this.startTime = -1;
		this.endTime = -1;
		this.score = 0;

		this.init_mines();
		this.init_visible();
		this.init_counts();
		this.init_flags();
		if(!this.wasReset){
			this.init_table();
		}
		this.render();
	}

	reset() {
		this.querySelector('#time-msg')!.innerHTML = '&nbsp';
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

		// restart button
		this.querySelector('#restart-msg')!.addEventListener('click', () => this.reset());

		// reset state and build the game board
		this.init();

		// disable context menu on game board
		this.addEventListener('contextmenu', function(e){
			e.preventDefault();
			return false;
		})


		this.addEventListener('keydown', (event) => {
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
			
			let targetCell = this.cells[x+dx]![y+dy];
			
			if(targetCell) {
				targetCell.focus();
			}
		})
	
	


	}

	disconnectedCallback() {
		this.clock_stop(); // clears time interval if necessary

	}


	_highlight() {
		const board = this.querySelector('.board')!;
		board.classList.add('highlight');
		setTimeout(() => {board.classList.remove('highlight');}, 2000);
	}

	
}

customElements.define('mine-sweeper', MineSweeper);

// NOTE: this is unrelated to the browser's event system
// TODO: so perhaps the name is confusing?
interface GameOverEvent {
	score: number;
	highScoreCallback: () => void;
}

class HighScore extends HTMLElement {
	score = 0;
	connectedCallback() {
		this.render();
		msgBus.subscribe(
			'gameover', 
			(gameOverEvent: GameOverEvent) => this.handleGameOver(gameOverEvent)
		);
	}
	render(){
		this.innerHTML = `<div class="highscore">High Score: ${this.score}</div>`;
	}
	handleGameOver(gameOverEvent: GameOverEvent) {
		console.log('HighScore.handleGameOver()')
		console.log(gameOverEvent);
		if(gameOverEvent.score > this.score) {
			this.score = gameOverEvent.score;
			this.render();
			gameOverEvent.highScoreCallback(); // tell the game that it won
		}
	}
}

customElements.define('high-score', HighScore);