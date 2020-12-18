var actions = require('./ide-mode-actions.js');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var testDir = path.join(__dirname, 'tests/src');

var testSrc = path.join(testDir, 'Test.idr');
var testInvalidSrc = path.join(testDir, 'TestInvalid.idr');
var testNonExistingSrc = path.join(testDir, 'NonExisting.idr');
var testRoot = path.join(__dirname, 'tests');
var testIpkg = path.join(testRoot, 'tests.ipkg');

// clear build directory to prevent change in idris compiler
// version from breaking tests
try{ fs.rmdirSync('build', { recursive: true }); } catch (e) {}


// We need to preload the files to have deterministic messages later
actions.load(testSrc, testIpkg, testRoot);
actions.load(testInvalidSrc, testIpkg, testRoot);

assert.equal(
	actions.interpret(testNonExistingSrc, testIpkg, testRoot, '', 1, 1),
	`info "Error loading file ${testNonExistingSrc}: File Not Found"`,
    'Attempt to load wrong file should display command failed');

// Don't display additional error info for incorrect files
// Expect the developer to be building the file in another shell tab
assert.equal(
	actions.interpret(testInvalidSrc, testIpkg, testRoot, '', 1, 1),
	`e "${__dirname}/tests/src/TestInvalid.idr" 4 8; info "While processing right hand side of asdf. Can't find ` +
    'an implementation for FromString Integer.\n\n' +
    `${__dirname}/tests/src/TestInvalid.idr:4:8--4:15\n   |\n 4 | asdf = ""wrong""\n   ` +
    '|        ^^^^^^^\n"',
    'Attempt to load invalid file should display command failed');

assert.equal(
	actions.interpret(testSrc, testIpkg, testRoot, '2+2', 1, 1),
	`echo "4"`,
    'Interpret');

// It appears the ide mode server does not handle escaping correctly yet
// assert.equal(
// 	actions.interpret(testSrc, testIpkg, testRoot, `"a"`, 1, 1),
// 	`echo "4"`,
//     'Interpret correctly handles quotes');

assert.equal(
	actions.typeOf(testSrc, testIpkg, testRoot, 'caseSplitHere_rhs', 1, 1),
	`info -title "idris-ide: type" "\n   splitHere : Bool\n` +
    '------------------------------\ncaseSplitHere_rhs : ' +
    `String"`,
    'Type of');

assert.equal(
	actions.caseSplit(testSrc, testIpkg, testRoot, 'splitHere', 4, 15),
	`execute-keys -draft g h G l d i "caseSplitHere True = ?caseSplitHere_rhs_1<ret>` +
	`caseSplitHere False = ?caseSplitHere_rhs_2<esc>"; execute-keys 4g 14l`,
    'Clause split runs new line with clause');

assert.equal(
	actions.addClause(testSrc, testIpkg, testRoot, 'addClauseHere', 6, 1),
	'execute-keys -draft o "addClauseHere xs = ?addClauseHere_rhs<esc>"; execute-keys jwwb',
    'Add clause');

assert.equal(
	actions.proofSearch(testSrc, testIpkg, testRoot, 'proofSearchHere_rhs', 9, 1),
	'execute-keys -draft c <backspace> "Refl<esc>"',
    'Proof search');

assert.equal(
	actions.generateDef(testSrc, testIpkg, testRoot, 'generateDefHere', 11, 1),
	'execute-keys -draft o "generateDefHere True = ' +
    'Refl<ret>generateDefHere False = Refl<esc>"; ' +
    'execute-keys jwwb',
    'Generate definition');

assert.equal(
	actions.makeLemma(testSrc, testIpkg, testRoot, 'makeLemmaHere_rhs', 14, 1),
	'execute-keys c <backspace> "makeLemmaHere_rhs y x" <esc> ' +
    '<A-i> p O "makeLemmaHere_rhs : Int -> Int -> Int" <ret> ' +
    '<esc> k',
    'Make lemma');

assert.equal(
	actions.makeWith(testSrc, testIpkg, testRoot, 'x', 17, 1),
	'execute-keys -draft o "makeWithHere x with (_)<ret>  makeWithHere x | ' +
    'with_pat = ?x_rhs<backspace><esc>"; execute-keys -with-maps -with-hooks j <A-l> ' +
    'h c',
    'Make lemma');

console.log('All tests succeeded');
