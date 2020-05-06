var actions = require('./ide-mode-actions.js');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var testDir = path.join(__dirname, 'tests/src');

var testSrc = path.join(testDir, 'Test.idr');
var testInvalidSrc = path.join(testDir, 'TestInvalid.idr');
var testNonExistingSrc = path.join(testDir, 'NonExisting.idr');

// clear build directory to prevent change in idris compiler
// version from breaking tests
try{ fs.rmdirSync('build', { recursive: true }); } catch (e) {}


// We need to preload the files to have deterministic messages later
actions.load(testSrc);
actions.load(testInvalidSrc);

assert.equal(
	actions.interpret(testNonExistingSrc, '', 1, 1),
	`info "Error loading file ${testNonExistingSrc}: File Not Found"`,
    'Attempt to load wrong file should display command failed');

// Don't display additional error info for incorrect files
// Expect the developer to be building the file in another shell tab
assert.equal(
	actions.interpret(testInvalidSrc, '', 1, 1),
	`info "While processing right hand side of asdf at TestInvalid.idr:4:1--5:1:
When unifying String and Integer
Mismatch between:
	String
and
	Integer"`,
    'Attempt to load invalid file should display command failed');

assert.equal(
	actions.interpret(testSrc, '2+2', 1, 1),
	`echo "4"`,
    'Interpret');

// It appears the ide mode server does not handle escaping correctly yet
// assert.equal(
// 	actions.interpret(testSrc, `"a"`, 1, 1),
// 	`echo "4"`,
//     'Interpret correctly handles quotes');

assert.equal(
	actions.typeOf(testSrc, 'caseSplitHere_rhs', 1, 1),
	`info -title "idris-ide: type" "\n   splitHere : Bool\n` +
    '-------------------------------------\ncaseSplitHere_rhs : ' +
    `String"`,
    'Type of');

assert.equal(
	actions.caseSplit(testSrc, 'splitHere', 4, 15),
	`execute-keys -draft x c "caseSplitHere True = ?caseSplitHere_rhs_1<ret>` +
	`caseSplitHere False = ?caseSplitHere_rhs_2<ret><esc>"; execute-keys 4g 14l`,
    'Clause split runs new line with clause');

assert.equal(
	actions.addClause(testSrc, 'addClauseHere', 6, 1),
	'execute-keys -draft o "addClauseHere xs = ?addClauseHere_rhs<esc>"; execute-keys jwwb',
    'Add clause');

assert.equal(
	actions.proofSearch(testSrc, 'proofSearchHere_rhs', 9, 1),
	'execute-keys -draft c <backspace> "Refl<esc>"',
    'Proof search');

assert.equal(
	actions.generateDef(testSrc, 'generateDefHere', 11, 1),
	'execute-keys -draft o "generateDefHere x = Refl<esc>"; execute-keys jwwb',
    'Generate definition');

assert.equal(
	actions.makeLemma(testSrc, 'makeLemmaHere_rhs', 14, 1),
	'execute-keys c <backspace> "makeLemmaHere_rhs y x" <esc> ' +
    '<A-i> p O "makeLemmaHere_rhs : Int -> Int -> Int" <ret> ' +
    '<esc> k',
    'Make lemma');

assert.equal(
	actions.makeWith(testSrc, 'x', 17, 1),
	'execute-keys -draft o "makeWithHere x with (_)<ret>  makeWithHere x | ' +
    'with_pat = ?x_rhs<ret><backspace><esc>"; execute-keys -with-maps -with-hooks j <A-l> ' +
    'h c',
    'Make lemma');

console.log('All tests succeeded');
