var burger = document.getElementsByClassName('burger')[0],
	nav = document.getElementsByTagName('nav')[0],
	navItems = document.querySelectorAll('nav>ul>li'),
	overlay = document.createElement('DIV');

burger.addEventListener('click', function() {

	this.classList.toggle('opened');
	nav.classList.toggle('opened');
	if ( this.classList.contains('opened') ) {
		this.getElementsByTagName('use')[0].setAttribute('xlink:href', '#close');
		document.body.appendChild(overlay).classList.add('overlay');
	} else {
		this.getElementsByTagName('use')[0].setAttribute('xlink:href', '#menu');
		document.body.removeChild(overlay);
	}

});

for( var i = 0; i < navItems.length; i++ ) {
	navItems[i].addEventListener('click', function() {
		for( var y = 0; y < navItems.length; y++ ) {
			navItems[y].classList.remove('opened');
		}
		this.classList.add('opened');
	})
}


var myBoard = new MemoryGame({

	wrapper: 'memo-example',
	images: ['http://news.nationalgeographic.com/news/2007/04/images/070412-square-nebula.jpg', 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Sierpinski_square.jpg', 'https://pbs.twimg.com/profile_images/553572195390091265/IeHWVVMX.png'],
	backImage: 'http://vpx.pl/i/2016/08/11/cardback.jpg',
	responsive: [
		{
			breakpoint: 768,
			columns: 4
		},
		{
			breakpoint: 968,
			columns: 3
		},
		{
			breakpoint: 1168,
			columns: 6
		},
		{
			breakpoint: 1268,
			columns: 8
		}
	],
	animation: 'spin',
	timer: false,
	message: {
		fail: 'Try again test'
	}

});