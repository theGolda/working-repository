;( function( window ) {

	'use strict';
//				location = location.split('/').splice(location.length - 1, 1, 'images');

	function absImgLoc(scriptname) {
		var scriptElements = document.getElementsByTagName('script');
		for (var i = 0; i < scriptElements.length; i++) {
			var source = scriptElements[i].src;
			if (source.indexOf(scriptname) > -1) {
				var loc = source.substring(0, source.indexOf(scriptname)) + scriptname;
				return loc.replace(scriptname, 'images/');
			}
		}
		return false;
	}

	/**
	* MemoBoard
	*
	* Modul constructor
	*/
	function MemoryGame() {

		//default options that are used if nothing from user is provided
		let defaults = {
			wrapper: document.body,
			images: [absImgLoc('memo.js') + 'def1.jpg', absImgLoc('memo.js') + 'def2.jpg', absImgLoc('memo.js') + 'def3.jpg'],
			backImage: absImgLoc('memo.js') + 'back.jpg',
			animation: 'flip',
			columns: 2,
			cardShape: 'circle',
			time: 0.2,
			message: {
				success: 'Well done',
				fail: 'Try again',
				reset: 'Progress will be lost'
			},
			deductPoints: true,
			overlayColour: 'dark',
			popupColour: 'light',
			popupAnimation: 'right',
			responsive: []
		}

		//create options by extending defaults with settings provided by user
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = mergeSettings( defaults, arguments[0]);
		}

		if( typeof this.options.wrapper === 'string' ){
			this.options.wrapper = document.getElementById(this.options.wrapper);
			console.log(this.options.wrapper);
		} else {
			console.log('default body wrapper');
		}

		this.init();

	}

	/**
	* MemoBoard.init()
	*
	* Initializer function - starts everything
	*/
	MemoryGame.prototype.init = function() {
		this.markup();
		this.onresize();
		this.events();


		let timer = this.options.time * 60,
		minutes = parseInt( timer / 60, 10 ),
		seconds = parseInt( timer % 60, 10 );
		
		minutes = minutes < 10 ? "0" + minutes : minutes;
		seconds = seconds < 10 ? "0" + seconds : seconds;
		
		document.getElementById('mg-minutes').textContent = minutes;
		document.getElementById('mg-seconds').textContent = seconds;

	}

	/**
	* MemoBoard.markup()
	*
	* Create initial HTML markup
	*/
	MemoryGame.prototype.markup = function() {
		//append svg
		this.options.wrapper.innerHTML += `
		<svg xmlns="http://www.w3.org/2000/svg" style="display: none">
			<symbol id="mg-close" viewBox="0 0 74.8 74.8">
				<path d="M3.3 3.3L3.3 3.3c4.4-4.4 11.6-4.4 16 0l52.1 52.1c4.4 4.4 4.4 11.6 0 16l0 0c-4.4 4.4-11.6 4.4-16 0L3.3 19.3C-1.1 14.9-1.1 7.7 3.3 3.3z"/><path d="M3.3 71.5L3.3 71.5c-4.4-4.4-4.4-11.6 0-16L55.4 3.3c4.4-4.4 11.6-4.4 16 0l0 0c4.4 4.4 4.4 11.6 0 16L19.3 71.5C14.9 75.9 7.7 75.9 3.3 71.5z"/>
			</symbol>
		</svg>`;

		//create board wrapper
		this.board = document.createElement('div');
		this.board.className = 'mg-board';

		//create header
		this.header = document.createElement('div');
		this.header.className = 'mg-header';


		//append header
		this.board.appendChild(this.header);

		//append timer
		this.header.innerHTML += 
		`<div class="mg-timer">

			<div class="mg-timer__outter">

				<div class="mg-timer__inner">
					<span id="mg-minutes" class="mg-timer__minutes">00</span>
				</div>

				<span>minutes</span>

			</div>

			<div class="mg-timer__outter">

				<div class="mg-timer__inner">				
					<span id="mg-seconds" class="mg-timer__seconds">00</span>
				</div>

				<span>seconds</span>
				
			</div>

		</div>`;


		//append points counter{
		this.header.innerHTML += 
		`<div class="mg-points">
			Points: <span id="mg-points" class="mg-text--md">000</span>
		</div>`;

		//create pairs of images
		this.cardImages = this.options.images.concat(this.options.images);

		//randomize cards order
		shuffle(this.cardImages);

		//create main board
		this.main = document.createElement('div');
		this.main.className = 'mg-main';
		this.board.appendChild(this.main);

		//append cards to main board
		for ( let i=0; i < this.cardImages.length; i++) {
			this.main.innerHTML += 
			`<div class='mg-card ${this.options.animation} mg-col-${this.options.columns}' data-card-number=${i}>
				<div class='mg-card__front mg-card--${this.options.cardShape}'>
					<img class='mg-card__front__img' src='${this.cardImages[i]}'/>
				</div>
				<div class='mg-card__back mg-card--${this.options.cardShape}'>
					<img src='${this.options.backImage}'/>
				</div
			</div>`;
		}

		//create footer
		this.footer = document.createElement('div');
		this.footer.className = 'mg-footer';
		this.board.appendChild(this.footer);

		//append start button
		this.start = document.createElement('button');
		this.start.textContent = 'Start';
		this.start.className = 'mg-start mg-btn mg-btn--lg mg-btn--primary';
		this.footer.appendChild(this.start);

		this.options.wrapper.appendChild(this.board);
	}

	/**
	* MemoBoard.flipLogic()
	*
	* Logic behind memory game. It monitors if cards are matching and flips them back if no match has been made
	*/
	let memoryTemp = [],
		memoryTempIds = [];
	MemoryGame.prototype.flipLogic = function(tile) {

		let self = this;
		if ( !tile.classList.contains('post-' + this.options.animation) && memoryTemp.length < 2 ) {
			
			if ( memoryTemp.length == 0 ) {
				tile.classList.add('post-' + this.options.animation);
				memoryTemp.push(tile.querySelector('.mg-card__front__img').getAttribute('src'));
				memoryTempIds.push(tile.getAttribute('data-card-number'));
				if ( parseInt(document.getElementById('mg-points').innerHTML) > 0 && this.options.deductPoints ) {
					document.getElementById('mg-points').innerHTML = parseInt(document.getElementById('mg-points').innerHTML) - 10;
				}
				
			} else if ( memoryTemp.length == 1 ) {
				tile.classList.add('post-' + this.options.animation);
				memoryTemp.push(tile.querySelector('.mg-card__front__img').getAttribute('src'));
				memoryTempIds.push(tile.getAttribute('data-card-number'));
				if ( parseInt(document.getElementById('mg-points').innerHTML) > 0 && this.options.deductPoints ) {
					document.getElementById('mg-points').innerHTML = parseInt(document.getElementById('mg-points').innerHTML) - 10;
				}
				
				if ( memoryTemp[0] == memoryTemp[1] ) {
					memoryTemp = [];
					memoryTempIds = [];
					document.getElementById('mg-points').innerHTML = parseInt(document.getElementById('mg-points').innerHTML) + 100;
				} else {
					setTimeout(function(){
						document.querySelector('[data-card-number="' + memoryTempIds[0] +'"]').classList.remove('post-' + self.options.animation);
						document.querySelector('[data-card-number="' + memoryTempIds[1] +'"]').classList.remove('post-' + self.options.animation);
						memoryTemp = [];
						memoryTempIds = [];
					}, 1000);
				}
			}

		}
	}


	/**
	* MemoBoard.timer()
	*
	* Method responsible for setting up the timer and countdown
	*/
	MemoryGame.prototype.timer = function() {

		//minus 1 second due to interval which is 1000ms
		let timer = this.options.time * 60 - 1,
				minutes,
				seconds,
				self = this;

		function startTimer() {
			minutes = parseInt( timer / 60, 10 );
			seconds = parseInt( timer % 60, 10 );
			
			minutes = minutes < 10 ? "0" + minutes : minutes;
			seconds = seconds < 10 ? "0" + seconds : seconds;
			
			document.getElementById('mg-minutes').textContent = minutes;
			document.getElementById('mg-seconds').textContent = seconds;

			if( timer == 0 ) {
				window.clearTimeout(MGstartTimerInterval);
				setTimeout(function(){
					self.popup('fail');					
				}, 1000);
			} else{
				console.log('there is still' + timer + 'left');
			}
			return timer--;

		}

		let MGstartTimerInterval = setInterval(startTimer, 1000);

		document.getElementsByClassName('mg-reset')[0].addEventListener('click', function() {
			self.popup('reset');
		});

		let cards = document.getElementsByClassName('mg-card');
		for ( let i=0; i < cards.length; i++){
			cards[i].addEventListener('click', function() {
				console.log(this);
				if (document.querySelectorAll('.mg-card.post-' + self.options.animation).length == self.cardImages.length) {
						window.clearTimeout(MGstartTimerInterval);

						//timeout allows animation to finish
						setTimeout(function(){
							self.popup('success');
						},1000)
				}
			})
		}
		window.MGstartTimerInterval = MGstartTimerInterval;
	}

	/**
	* MemoBoard.events(
	*
	* Hooke eventListeners
	*/
	MemoryGame.prototype.events = function() {
		let cards = document.getElementsByClassName('mg-card'),
			self = this;

		document.getElementsByClassName('mg-start')[0].addEventListener('click', function() {
			let resetBtn = document.createElement('button'),
				hurryUp = document.createElement('p');

			resetBtn.className = 'mg-reset mg-btn mg-btn--sm mg-btn--secondary';
			resetBtn.textContent = 'Reset';

			hurryUp.className = 'mg-hurry';
			hurryUp.textContent = 'Hurry Up!';

			document.getElementsByClassName('mg-footer')[0].replaceChild(resetBtn, document.getElementsByClassName('mg-start')[0]);

			document.getElementsByClassName('mg-footer')[0].appendChild(hurryUp);

			setTimeout(function() {
				document.getElementsByClassName('mg-footer')[0].removeChild(hurryUp);
			}, 4500);

			for ( let i=0; i < cards.length; i++) {
				cards[i].addEventListener('click', function(){
					self.flipLogic(this);
				})
			}
			self.timer();
		})
	}

	/**
	* MemoryGame.popup()
	*
	* Generate popup with messages
	*/
	MemoryGame.prototype.popup = function(type) {
		let popup = document.createElement('div'),
			close = document.createElement('button'),
			popupFooter = document.createElement('div'),
			overlay = document.createElement('div'),
			content,
			contentFooter,
			self = this;

		popup.className = 'mg-popup mg-popup--' + this.options.popupColour;
		close.className = 'mg-close';
		close.innerHTML = `
			<svg viewBox="0 0 74.8 74.8">
   				<use xlink:href="#mg-close"></use>
			</svg>`

		popupFooter.className = 'mg-popup-footer';
		overlay.className = 'mg-overlay mg-overlay--' + this.options.overlayColour;

		document.body.appendChild(overlay);
		overlay.classList.add('mg-fade--in');

		switch(type) {
			case 'success':
				content = `
					<h3>Congratulation!</h3>
					<p>${this.options.message.success || 'Well done'}</p>
					<p>You've finished the game in:<br/>
					<span id="mg-final-time" class="mg-special"></span>
					</p>
					<p>points: <span id="mg-final-points" class="mg-special">${document.getElementById('mg-points').innerHTML}</span><br/>
					time bonus: <span id="mg-final-bonus" class="mg-special">${(parseInt(document.getElementById('mg-minutes').innerHTML)*60 + parseInt(document.getElementById('mg-seconds').innerHTML))*10}</span><br/>
					total: <span id="mg-final-total" class="mg-special"></span>
					</p>`;
				contentFooter = `
					<button class="mg-btn mg-btn--sm mg-btn--secondary mg-share">Share result</button><br/><br/>
					<button class="mg-reset mg-btn mg-btn--lg mg-btn--primary">Solve another</button>` ;
				break;

			case 'fail':
				content = `
					<h3>Time's up!</h3>
					<p>${this.options.message.fail || 'Try again'}</p>`;;
				contentFooter = `
					<button class="mg-reset mg-btn mg-btn--sm mg-btn--primary">Try again!</button>` ;
				break;

			case 'reset':
				content = `
					<h3>Reset</h3>
					<p>${this.options.message.reset || 'Progress will be lost'}</p>`;
				contentFooter = `
					<button class="mg-btn mg-continue mg-btn--lg mg-btn--primary">I'm not giving up!</button><br/><br/>
					<button class="mg-reset mg-btn mg-btn--sm mg-btn--secondary">Reset anyway</button>`;
				break;

			default:
				content = `
					<h3>Ups!</h3>
					<p>We didn't predict this situation, please close the dialog or start again</p>`;
				contentFooter = `
					<button class="mg-reset mg-btn--sm mg-btn--seconady">Reset</button>`;
		}
		popup.innerHTML = content;
		popup.appendChild(close);

		popupFooter.innerHTML = contentFooter;
		popup.appendChild(popupFooter);

		document.body.appendChild(popup);
		popup.classList.add('mg-slide--' + this.options.popupAnimation);

		close.addEventListener('click', function() {
			document.body.removeChild(popup);
			document.body.removeChild(overlay);
		})

		if ( type === 'success' ) {
			document.getElementById('mg-final-total').innerHTML = parseInt(document.getElementById('mg-final-points').innerHTML) + parseInt(document.getElementById('mg-final-bonus').innerHTML);
			let finalTime = this.options.time * 60 - (parseInt(document.getElementById('mg-minutes').innerHTML)*60 + parseInt(document.getElementById('mg-seconds').innerHTML));
			
			if ( finalTime / 60 >= 1 ) {
				finalTime = finalTime / 60 + ' minutes and ' + finalTime%60 + ' seconds';
			} else {
				finalTime = finalTime % 60 + ' seconds';
			}

			document.getElementById('mg-final-time').innerHTML = finalTime;

			let siteUrl = window.location.href,
				quote = `I have just successfuly completed MemoryGame in ${document.getElementById('mg-final-time').innerHTML} and achieved a score of ${document.getElementById('mg-final-total').innerHTML}`;

			quote.replace(/ /g, '%20');
			console.log(quote);
			document.querySelector('.mg-share').addEventListener('click',function() {
				window.open("https://www.facebook.com/sharer/sharer.php?u=" + siteUrl + "&quote=" + quote, "", "width=200,height=100");
			})
		}

		if ( type === 'reset' ) {
			document.getElementsByClassName('mg-continue')[0].addEventListener('click', function() {
				document.body.removeChild(popup);
				document.body.removeChild(overlay);			
			})
		}

		for ( let i=0; i < document.querySelectorAll('.mg-popup .mg-reset').length; i++) {
			document.querySelectorAll('.mg-popup .mg-reset')[i].addEventListener('click', function() {
				document.body.removeChild(popup);
				document.body.removeChild(overlay);
				window.clearTimeout(MGstartTimerInterval);
				self.options.wrapper.innerHTML = '';
				self.init();
			})
		}
	}

	/**
	* MemoryGame.widthCheck()
	*
	* Check window size and return number of columns to use
	*/
	MemoryGame.prototype.widthCheck = function() {
		let vw = window.outerWidth,
			breakpoints = this.options.responsive,
			breakpointsOrdered;

		if (this.options.responsive.length) {

			breakpointsOrdered = breakpoints.sort(
				function(a,b) {
					return b.breakpoint - a.breakpoint;
				}
			);

			for (let i = 0; i < breakpointsOrdered.length; i++) {
				if ( vw > breakpointsOrdered[i].breakpoint ) {
					return breakpointsOrdered[i].columns;
				}
			}

		} else {
			return this.options.columns;
		}

	}

	/**
	* MemoryGame.responsive()
	*
	* Layout cards in correct number of columns
	*/	
	MemoryGame.prototype.responsive = function() {
		let columnsNo = this.widthCheck(),
			cards = document.querySelectorAll('.mg-card'),
			columnClass;

		switch(columnsNo) {
			case 1:
				columnClass = 'mg-col-1';
				break;
			case 2:
				columnClass = 'mg-col-2';
				break;
			case 3:
				columnClass = 'mg-col-3';
				break;
			case 4:
				columnClass = 'mg-col-4';
				break;
			case 5:
				columnClass = 'mg-col-5';
				break;
			case 6:
				columnClass = 'mg-col-6';
				break;
			case 7:
				columnClass = 'mg-col-7';
				break;
			case 8:
				columnClass = 'mg-col-8';
				break;
			case 9:
				columnClass = 'mg-col-9';
				break;
			case 10:
				columnClass = 'mg-col-10';
				break;
			case 11:
				columnClass = 'mg-col-11';
				break;
			case 12:
				columnClass = 'mg-col-12';
				break;
			default:
				columnClass = 'mg-col-' + this.options.columns;
		}

		for ( let i = 0; i < cards.length; i++ ) {
			cards[i].className = cards[i].className.replace(/mg-col-[0-9]*/g, columnClass);
		}
		console.log('invoke!');
	}

	/**
	* MemoryGame.onresize()
	*
	* Add event listener so the layout refreshes on window resize
	*/
	MemoryGame.prototype.onresize = function() {
		let self = this;
		window.addEventListener('load', self.responsive());

		//WORKS NOW BUT LOOK INTO IT!
		window.addEventListener('resize', self.debounce(function() {
			self.responsive();
		}, 200));
	}

	/**
	* MemoryGame.debounce()
	*
	* Prevent function to fire before resize is finished
	*/
	MemoryGame.prototype.debounce = function(func, wait, immediate) {
      let timeout = 0;
      return function() {
        let context = this,
        	args = arguments,
        	later = function() {
	          timeout = null;
	          if (!immediate) {
	            func.apply(context, args);
	          }
	        },
       		callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait || 200);
        if (callNow) {
          func.apply(context, args);
        }
      };		
  	};

	/**
	* mergeSettings()
	*
	* Merges settings provided by the user with default settings
	*/
	function mergeSettings( defSettings, custSettings) {
		for ( let key in custSettings) {
			if( custSettings.hasOwnProperty( key ) ) {
				defSettings[key] = custSettings[key];
			}
		}
		return defSettings;
	}

	/**
	* shuffle()
	*
	* Fisher-Yates shuffle algorithm. Randomize order of elements in an Array
	*/
	function shuffle( arr ) {
		let currentIndex = arr.length,
			temporaryVal,
			randomIndex;

		while( 0 < currentIndex-- ) {
			randomIndex = Math.floor( Math.random() * ( currentIndex + 1 ) );
			temporaryVal = arr[currentIndex];
			arr[currentIndex] = arr[randomIndex];
			arr[randomIndex] = temporaryVal;
		};

		return arr;		
	};

	/**
	*
	* Assigns our constructor to global scope so it can be called by the user everywhere
	*/
	window.MemoryGame = MemoryGame;

})( window );