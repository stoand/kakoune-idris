var actions = require('./ide-mode-actions.js');
var assert = require('assert');

// We need to preload the files to have deterministic messages later
actions.load('Test.idr');
actions.load('TestInvalid.idr');

assert.equal(
	actions.interpret('NonExisting.idr', '', 1, 1),
	`echo "Command failed"`,
    'Attempt to load wrong file should display command failed');

// Don't display additional error info for incorrect files
// Expect the developer to be building the file in another shell tab
assert.equal(
	actions.interpret('TestInvalid.idr', '', 1, 1),
	`echo "Failed to load TestInvalid.idr"`,
    'Attempt to load wrong file should display command failed');

assert.equal(
	actions.interpret('Test.idr', '2+2', 1, 1),
	`echo "4"`,
    'Interpret');

assert.equal(
	actions.typeOf('Test.idr', 'caseSplitHere_rhs', 1, 1),
	`info -title "idris-ide: type" "\n   splitHere : Bool\n` +
    '-------------------------------------\ncaseSplitHere_rhs : ' +
    `String"`,
    'Type of');

assert.equal(
	actions.caseSplit('Test.idr', 'splitHere', 4, 15),
	`execute-keys -draft x c "caseSplitHere True = ?caseSplitHere_rhs_1<ret>` +
	`caseSplitHere False = ?caseSplitHere_rhs_2<ret><esc>"; execute-keys 4g 14l`,
    'Clause split runs new line with clause');

assert.equal(
	actions.addClause('Test.idr', 'addClauseHere', 6, 1),
	'execute-keys -draft o "addClauseHere xs = ?addClauseHere_rhs<esc>"; execute-keys jwwb',
    'Add clause');

assert.equal(
	actions.proofSearch('Test.idr', 'proofSearchHere_rhs', 9, 1),
	'execute-keys -draft c <backspace> "Refl<esc>"',
    'Proof search');

assert.equal(
	actions.generateDef('Test.idr', 'generateDefHere', 11, 1),
	'execute-keys -draft o "generateDefHere x = Refl<esc>"; execute-keys jwwb',
    'Generate definition');

assert.equal(
	actions.makeLemma('Test.idr', 'makeLemmaHere_rhs', 14, 1),
	'execute-keys c <backspace> "makeLemmaHere_rhs y x" <esc> ' +
    '<A-i> p O "makeLemmaHere_rhs : Int -> Int -> Int" <ret> ' +
    '<esc> k',
    'Make lemma');

assert.equal(
	actions.makeWith('Test.idr', 'x', 17, 1),
	'execute-keys -draft o "makeWithHere x with (_)<ret>  makeWithHere x | ' +
    'with_pat = ?x_rhs<ret><esc>"; execute-keys -with-maps -with-hooks j <A-l> ' +
    'h c',
    'Make lemma');
    

console.log('All tests succeeded');
