//
// Class: History
//
// A class used to manage the state of the story -- displaying new passages
// and rewinding to the past.
//
// Property: History
// An array representing the state of the story. history[0] is the current
// state, history[1] is the state just before the present, and so on.
// Each entry in the history is an object with two properties: *passage*,
// which corresponds to the <Passage> just displayed, and *variables*.
// Variables is in itself an object. Each property is a variable set
// by the story via the <<set>> macro. 
//

//
// Constructor: History
// Initializes a History object.
// 
// Parameters:
// none
//

function History()
{
	this.history = [{ passage: null, variables: {} }];
};

//
// Method: init
// This first attempts to restore the state of the story via the <restore>
// method. If that fails, it then either displays the passages linked in the
// *StartPassages* passage, or gives up and tries to display a passage
// named *Start*.
//
// Parameters:
// none
//
// Returns:
// nothing
//

History.prototype.init = function()
{
	if (! this.restore())
		if (tale.has('StartPassages'))
		{	
			console.log('showing StartPassages', tale.get('StartPassages').text.readBracketedList());
			
			var initials = tale.get('StartPassages').text.readBracketedList();
			for (var i = 0; i < initials.length; i++)
				this.display(initials[i], null, 'quietly');
		}
		else
		{
			console.log('no StartPassages, showing Start');
			this.display('Start', null, 'quietly');
		};	
};

//
// Method: close
// This removes a passage from display onscreen. This does not animate
// its disappearance.
//
// Parameters:
// passage - the <Passage> to remove
//
// Returns:
// nothing
//

History.prototype.close = function (passage)
{
	// we hide the passage immediately, without animation
	
	var el = $('passage' + passage.title);
	
	console.log('closing "' + passage.title + '"');
		
	if (el)
		el.parentNode.removeChild(el);
};

//
// Method: display
// Displays a passage on the page. If a passage has previously been
// displayed, the browser window is scrolled so it is in view.
//
// Parameters:
// title - the title of the passage to display.
// link - the DOM element corresponding to the link that was clicked to
// view the passage. The new passage is displayed immediately below the passage
// enclosed by the link. This parameter is optional. If it is omitted,
// the passage is displayed at the bottom of the page.
// render - may be either "quietly" or "offscreen". If a "quietly" value
// is passed, the passage's appearance is not animated. "offscreen"
// asks that the passage be rendered, but not displayed at all. This
// parameter is optional. If it is omitted, then the passage's appearance
// is animated.
//
// Returns:
// The DOM element containing the passage on the page.
//

History.prototype.display = function (title, link, render)
{	
	console.log('displaying "' + title + '" ' + (render || '') + ' from ', link);	
	
	// find enclosing passage of the link
		
	var sourcePassage = link;
	
	while (sourcePassage && (sourcePassage.className.indexOf('passage') == -1))
		if (sourcePassage.parentNode.className)
			sourcePassage = sourcePassage.parentNode;
		else
			break;

	// check if passage is already displayed
	
	if (el = $('passage' + title))
	{
		scrollWindowTo(el);
		return;
	};
	
	// create a fresh entry in the history
	
	var passage = tale.get(title);
	
	this.history.unshift({ passage: passage,
													variables: clone(this.history[0].variables) } );
	
	// add it to the page
	
	var div = passage.render();
	
	if (render != 'offscreen')
	{
		if (sourcePassage)
			$('passages').insertBefore(div, sourcePassage.nextSibling);	
		else
			$('passages').appendChild(div);
		
		// animate its appearance
		
		if (render != 'quietly')
		{
			scrollWindowTo(div);
			fade(div, { fade: 'in' });
		}
	}
	
	if ((render == 'quietly') || (render == 'offscreen'))
		div.style.visibility = 'visible';
		
	return div;	
};

//
// Method: restart
// Restarts the story from the beginning. This actually forces the
// browser to refresh the page.
//
// Parameters:
// none
//
// Returns:
// none
//

History.prototype.restart = function()
{
	// clear any bookmark
	// this has the side effect of forcing a page reload
	
	window.location.hash = '';
};

//
// Method: save
// Returns a hash to append to the page's URL that will be later
// read by the <restore> method. How this is generated is not
// guaranteed to remain constant in future releases -- but it
// is guaranteed to be understood by <restore>.
//
// Parameters:
// passage - a <Passage> whose point in the history to save.
//           This parameter is optional -- if omitted, then the
//					 entire story's history is saved.
//
// Returns:
// A hash to append to the page's URL.
//

History.prototype.save = function (passage)
{
	var order = '';

	// encode our history
	
	for (var i = 0; i < this.history.length; i++)
	{
		if ((this.history[i].passage) && (this.history[i].passage.id))
		{
			order += this.history[i].passage.id.toString(36) + '.';
		
			if (this.history[i].passage.id == passage.id)
				break;
		}
	};
	
	// strip the trailing period
	
	return '#' + order.substr(0, order.length - 1);
};

//
// Method: restore
// Attempts to restore the state of the story as saved by <save>.
//
// Parameters:
// none
//
// Returns:
// Whether this method actually restored anything.
//

History.prototype.restore = function ()
{
	try
	{
		if (window.location.hash == '')
			return false;
	
		var order = window.location.hash.replace('#', '').split('.');
		var passages = [];
		
		// render the passages offscreen in the order the reader clicked them
		// we can't show them, because contents along the way may be
		// incorrect (e.g. <<choice>>)
		
		for (var i = order.length - 1; i >= 0; i--)
		{
			var id = parseInt(order[i], 36);
			
			if (! tale.has(id))
				return false;
			
			console.log('restoring id ' + id);			
			passages.unshift(this.display(id, null, 'offscreen'));
		};
		
		// our state is now correct
		// we now display the last passage
		
		$('passages').appendChild(passages[0]);		
		return true;
	}
	catch (e)
	{
		console.log("restore failed", e);
		return false;
	};
};

//
// Method: rewindTo
// Rewinds the state of the story to a particular <Passage>.
//
// Parameters:
// passage - a <Passage> to rewind to.
//
// Returns:
// nothing
//

History.prototype.rewindTo = function (passage)
{
	// fade out the story while we work
	
	console.log('rewinding to "' + passage.title + '"');
	
	var self = this;
	
	fade($('passages'), { fade: 'out', onComplete: work });

	function work()
	{
		// delete passages after the one we are rewinding to
			
		while (self.history[0].passage.title != passage.title)
			self.close(self.history.shift().passage);
		
		// i is now the index of the passage we are rewinding to
		// we restore it to its original state
	
		self.history[0].variables = clone(self.history[1].variables);		
		passage.reset();

		var els = $('passage' + passage.title).childNodes;
		
		for (var i = 0; i < els.length; i++)
			if (els[i].className == 'body')
			{
				removeChildren(els[i]);
				new Wikifier(els[i], passage.text);
			};
			
		fade($('passages'), { fade: 'in' });
	};
};
