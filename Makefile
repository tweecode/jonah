test:	test.tw
	twee -t jonahtest test.tw > test.html
doc:	*.js
	NaturalDocs -i . -o html doc -p .nd	
release: *.js *.css
	~/Sites/gimcrackd/bin/pack/assemblejonah
