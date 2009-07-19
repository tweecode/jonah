//
// Class: Passage
//
// This class represents an individual passage.
// This is analogous to the Tiddler class in the core TiddlyWiki code.
//
// Property: title
// The title of the passage, displayed at its top.
//
// Property: id
// An internal id of the passage. This is never seen by the reader,
// but it is used by the <History> class.
//
// Property: initialText
// The initial text of the passage. This is used by the reset method.
//
// Property: text
// The current text of the passage. This is usually the same as
// the <initialText> property, though macros such as <<choice>>
// may alter it.
//
// Property: tags
// An array of strings, each corresponding to a tag the passage belongs to.
//

//
// Constructor: Passage
//
// Initializes a new Passage object. You may either call this with
// a DOM element, which creates the passage from the text stored in the
// element, or you may pass only a title, 
//
// Parameters:
// title - the title of the passage to create. This parameter is required.
// el - the DOM element storing the content of the passage.
// This parameter is optional. If it is omitted, "this passage does not
// exist" is used as the passage's content.
// order - the order in which this passage was retrieved from the
// document's *storeArea* div. This is used to generate the passage's id.
// This parameter is optional, but should be included if el is specified.
//

function Passage (title, el, order)
{	
	this.title = title;

	if (el)
	{
		this.id = order;	
		this.initialText = this.text = Passage.unescapeLineBreaks(el.firstChild ? el.firstChild.nodeValue : "");
		this.tags = el.getAttribute("tags");
		
		if (typeof this.tags == 'string')
			this.tags = this.tags.readBracketedList();
		else
			this.tags = [];
	}
	else
	{
		this.initialText = this.text = '@@This passage does not exist.@@';
		this.tags = [];
	};
};

//
// Method: render
// 
// Renders the passage to a DOM element, including its title, toolbar,
// and content. It's up to the caller to add this to the DOM tree appropriately
// and animate its appearance.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Passage.prototype.render = function()
{
	// construct passage
	
	var passage = insertElement(null, 'div', 'passage' + this.title, 'passage');
	passage.style.visibility = 'hidden';
		
	var title = insertElement(passage, 'div', '', 'title', this.title);
	var toolbar = insertElement(title, 'span', '', 'toolbar');
	
	for (var i = 0; i < Passage.toolbarItems.length; i++)
	{
		var link = insertElement(toolbar, 'a');
		insertText(link, Passage.toolbarItems[i].label(passage));
		link.passage = this;
		
		if (Passage.toolbarItems[i].href)
			link.href = Passage.toolbarItems[i].href(passage)
		else
			link.href = 'javascript:void(0)';
			
		link.title = Passage.toolbarItems[i].tooltip(passage);
		link.onclick = Passage.toolbarItems[i].activate;
	};
		
	var body = insertElement(passage, 'div', '', 'body');
	
	new Wikifier(body, this.text);
	
	// event handlers
	
	passage.onmouseover = function() { passage.className += ' selected' };
	passage.onmouseout = function() { passage.className = passage.className.replace(' selected', ''); };
	
	return passage;
};

//
// Method: reset
// 
// Resets the passage's <text> property to its <initialText> property.
// This does not directly affect anything displayed on the page.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Passage.prototype.reset = function()
{
	console.log('resetting "' + this.title + '"');
	this.text = this.initialText;
};

Passage.toolbarItems =
[
	{
		label: function() { return 'bookmark' },
		tooltip: function() { return 'Bookmark this point in the story' },
		href: function(passage)
		{
			return(state.save(passage));
		},
		activate: function() {}
	},

	{
		label: function() { return 'rewind to here' },
		tooltip: function() { 'Rewind the story to here' },
		activate: function()
		{
			state.rewindTo(this.passage);
		}
	}
];

//
// Method: unescapeLineBreaks
// 
// A static function used by the constructor to convert string literals
// used by TiddlyWiki to indicate newlines into actual newlines.
//
// Parameters:
// text - a string to unescape
//
// Returns:
// a converted string
//

Passage.unescapeLineBreaks = function (text)
{
	if(text && text != "")
		return text.replace(/\\n/mg,"\n").replace(/\\/mg,"\\").replace(/\r/mg,"");
	else
		return "";
};
