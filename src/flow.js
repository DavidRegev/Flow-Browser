/* Global Variables */
/********************/

var overview = document.querySelector('.overview');
var newStackBar = document.querySelector('.new-stack input');
var drag = {
	startX: null,
	startY: null,
	endX: null,
	endY: null,
};


/* Functions */
/*************/

// Expose needed properties to CSS
function setCustomProperties() {
	document.documentElement.style.setProperty('--window-width', window.innerWidth);
	document.documentElement.style.setProperty('--window-height', window.innerHeight);

	if (document.querySelector('.stack.active')) {
		var activeStack = document.querySelector('.stack.active');
		document.documentElement.style.setProperty('--stack-width', activeStack.offsetWidth);
		document.documentElement.style.setProperty('--stack-x', activeStack.offsetLeft);
		document.documentElement.style.setProperty('--stack-y', activeStack.offsetTop);
	}
}

// Add a new page to whichever stack is currently active
function addPage(url) {
	var activeStack = document.querySelector('.stack.active');
	var isActive = true;
	var newCardIndex = 1;
	var activeCardIndex;
	var lastDescendantIndex;

	if (activeStack.querySelector('.card')) {
		isActive = false;
		newCardIndex = +activeStack.querySelector('.card:last-child').dataset.cardIndex + 1;
		activeCardIndex = +activeStack.querySelector('.card.active').dataset.cardIndex;

		var currentCard = activeCardIndex;
		while (!lastDescendantIndex) {
			var currentChildren = activeStack.querySelectorAll(`[data-parent-index="${currentCard}"]`);
			if (currentChildren.length > 0) {
				currentCard = +currentChildren[currentChildren.length - 1].dataset.cardIndex;
			} else {
				lastDescendantIndex = currentCard;
			}
		}
	}

	var newCardHtml = `
			<article class="card ${isActive ? 'active ' : ''}offscreen" data-card-index="${newCardIndex}"${(activeCardIndex) ? ` data-parent-index="${activeCardIndex}"` : ''}>
				<section class="page">
					<webview src="${url}"></webview>
				</section>
			</article>`;

	if (activeCardIndex) {
		var numForward = +activeStack.style.getPropertyValue('--num-forward') + 1;

		activeStack.style.setProperty('--num-forward', numForward);
		activeStack.querySelector(`[data-card-index="${lastDescendantIndex}"]`).insertAdjacentHTML('afterend', newCardHtml);
		activeStack.querySelector('.offscreen').classList.remove('offscreen');

		var page = overview.querySelector(`.stack.active [data-card-index="${newCardIndex}"] .page webview`);
		page.addEventListener('contentload', handleNavigation(page));
	} else {
		activeStack.insertAdjacentHTML('beforeend', newCardHtml);
		activeStack.querySelector('.offscreen').classList.remove('offscreen');

		var page = overview.querySelector(`.stack.active [data-card-index="${newCardIndex}"] .page webview`);
		page.addEventListener('contentload', handleNavigation(page));

		setTimeout(function () {
			overview.classList.add('fullscreen');
		}, 500);
	}
}

// Add a new stack and with a new page
function addStack(url) {
	var newStackIndex = 1;

	if (overview.querySelector('.stack')) {
		newStackIndex = +overview.querySelector('.stack:first-child').dataset.stackIndex + 1;
	}
	var newStackHtml = `<section class="stack active" style="--num-back: 0; --num-forward: 0;" data-stack-index="${newStackIndex}"></section>`;

	if (overview.querySelector('.stack.active')) {
		overview.querySelector('.stack.active').classList.remove('active');
	}
	overview.insertAdjacentHTML('afterbegin', newStackHtml);
	setCustomProperties();

	overview.classList.add('zoom');
	setTimeout(function () {
		addPage(url);
	}, 500);
};

// Zoom In
function zoomIn() {
	if (!overview.classList.contains('zoom')) {
		overview.classList.add('zoom');
	} else if (!overview.classList.contains('fullscreen')) {
		overview.classList.add('fullscreen');
	}
	// TO DO: zoom in all the way if only one page
}

// Zoom Out
function zoomOut() {
	if (overview.classList.contains('fullscreen')) {
		overview.classList.remove('fullscreen');
	} else if (overview.classList.contains('zoom')) {
		overview.classList.remove('zoom');
	}
}

// Go Back/Forward
function go(direction) {
	var activeStack = overview.querySelector('.stack.active');
	var activeCard = overview.querySelector('.stack.active .card.active');
	var newActiveCard;

	if (direction === 'forward' && activeCard.nextElementSibling) {
		newActiveCard = activeCard.nextElementSibling;
		activeStack.style.setProperty('--num-forward', +activeStack.style.getPropertyValue('--num-forward') - 1);
		activeStack.style.setProperty('--num-back', +activeStack.style.getPropertyValue('--num-back') + 1);
	} else if (direction === 'back' && activeCard.previousElementSibling) {
		newActiveCard = activeCard.previousElementSibling;
		activeStack.style.setProperty('--num-forward', +activeStack.style.getPropertyValue('--num-forward') + 1);
		activeStack.style.setProperty('--num-back', +activeStack.style.getPropertyValue('--num-back') - 1);
	}

	if (newActiveCard) {
		activeCard.classList.remove('active');
		newActiveCard.classList.add('active');
	}
}

// Remove the active page
function removePage() {
	var activeStack = overview.querySelector('.stack.active');
	var activeCard = overview.querySelector('.stack.active .card.active');
	
	if (activeCard.nextSibling) {
		activeStack.style.setProperty('--num-back', +activeStack.style.getPropertyValue('--num-back') - 1);
		go('forward');
	} else if (activeCard.previousSibling) {
		activeStack.style.setProperty('--num-forward', +activeStack.style.getPropertyValue('--num-forward') - 1);
		go('back');
	}
	
	activeCard.classList.add('deleting');
	setTimeout(function() {
		activeCard.remove();

		if (!activeStack.firstElementChild) {
			activeStack.remove('active');
			zoomOut();
			setCustomProperties();	// TO DO: Set next stack as active?
		}
	}, 500);	
}

/* Event Handlers */
/******************/

function handleInput(e) {
	var text = e.target.value;

	if (text === '') {
		newStackBar.className = '';
	} else if (text.startsWith('wikipedia')) {
		newStackBar.className = 'wikipedia';
	} else if (text.includes(' ') || (!text.startsWith('http://') && !text.startsWith('https://') && !text.includes('.com') && !text.includes('.org') && !text.includes('.net'))) {
		newStackBar.className = 'google';
	} else {
		newStackBar.className = 'link'
	}
};

function handleSearch(e) {
	var text = e.target.value;

	if (text !== '') {
		if (text.startsWith('wikipedia')) {
			text = 'https://en.wikipedia.org/wiki/' + text.substring(10);
		} else if (text.startsWith('google')) {
			text = 'https://www.google.com/search?q=' + text.substring(7);
		} else if (text.includes(' ') || (!text.startsWith('http://') && !text.startsWith('https://') && !text.includes('.com') && !text.includes('.org') && !text.includes('.net'))) {
			text = 'https://www.google.com/search?q=' + text;
		} else {
			if (!text.startsWith('http://') && !text.startsWith('https://')) {
				text = 'http://' + text;
			}
		}

		newStackBar.value = '';
		newStackBar.className = '';
		addStack(text);
	}
}

function handleClick(e) {
	var activeStack = overview.querySelector('.stack.active');
	var targetStack = e.target.closest('.stack');

	if (!overview.classList.contains('zoom') && targetStack) {
		activeStack.classList.remove('active');
		targetStack.classList.add('active');
		setCustomProperties();
		zoomIn();
	}
};

function handleWheel(e) {
	overview.removeEventListener('wheel', handleWheel);

	var y = e.deltaY;
	var x = e.deltaX;

	if (!overview.classList.contains('zoom')) {	// Interfers with overview scrolling!
		var targetStack = e.target.closest('.stack');
		var activeStack = overview.querySelector('.stack.active');

		if ((Math.abs(y) > Math.abs(x)) && (y < 0)) {
			if (targetStack) {
				if (activeStack) {
					activeStack.classList.remove('active');
				}
				targetStack.classList.add('active');
				setCustomProperties();
			}
			if (activeStack) {
				zoomIn();
			}
		}
	} else if (overview.classList.contains('zoom') && !overview.classList.contains('fullscreen')) {
		if (Math.abs(y) > Math.abs(x)) {
			if (y > 0) {
				zoomOut();
			} else if (y < 0) {
				zoomIn();
			}
		} else {
			if (x > 0) {
				go('forward');
			} else if (x < 0) {
				go('back');
			}
		}
	}

	setTimeout(function() {
		overview.addEventListener('wheel', handleWheel);
	}, 500);
}

function handleNavigation(page) {
	page.addEventListener('newwindow', function(e) {
		if (overview.classList.contains('fullscreen')) {
			overview.classList.remove('fullscreen');
		}
		window.addPage(e.targetUrl);
	});
	setTimeout(function () {
		page.executeScript({code:
			`var links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"])');

			for (i = 0; i < links.length; i++) {
				links[i].setAttribute('target', '_blank');
				links[i].addEventListener('click', function() {
					window.open(links[i].href);
					return false;
				});
			}`
		});
	}, 1500);	//Why??
}

function handleMouseDown(e) {
	if (overview.classList.contains('zoom') && !overview.classList.contains('fullscreen')) {
		drag.startX = e.clientX;
		drag.startY = e.clientY;

		overview.querySelector('.stack.active .card.active').classList.add('inactive');
	
		overview.removeEventListener('mousedown', handleMouseDown);
		overview.addEventListener('mouseup', handleMouseUp);
	}
}

function handleMouseUp(e) {
	drag.endX = e.clientX;
	drag.endY = e.clientY;
	var deltaX = drag.endX - drag.startX;
	var deltaY = drag.endY - drag.startY;

	overview.querySelector('.stack.active .card.active').classList.remove('inactive');

	if (Math.abs(deltaY) > Math.abs(deltaX)) {
		if (deltaY < -0) {
			removePage();
		}
	} else if (deltaX > 0) {
		go('back');
	} else if (deltaX < -0) {
		go('forward');
	}

	drag.startX = null;
	drag.startY = null;
	drag.endX = null;
	drag.endY = null;

	overview.removeEventListener('mouseup', handleMouseUp);
	overview.addEventListener('mousedown', handleMouseDown);
}


/* Events */
/***********/

// Custom Properties
window.onload = setCustomProperties;
window.onresize = setCustomProperties;

// New Stack
newStackBar.onfocus = zoomOut;
newStackBar.oninput = handleInput;
newStackBar.onsearch = handleSearch;

// Navigation
overview.addEventListener('click', handleClick);
overview.addEventListener('wheel', handleWheel);
overview.addEventListener('mousedown', handleMouseDown);