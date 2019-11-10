var actions = require('./ide-mode-actions.js');
var assert = require('assert');

// We need to preload the files to have deterministic messages later
actions.load('Test.idr');
actions.load('TestInvalid.idr');

assert.equal(
	actions.interpret('NonExisting.idr', '', 1, 1),
	`echo "Command failed"`,
    'Attempt to load wrong file should display command failed');

// Don't display addition error info for incorrect files
// Expect the developer to be building the file in another shell tab
assert.equal(
	actions.interpret('TestInvalid.idr', '', 1, 1),
	`echo "Failed to load TestInvalid.idr"`,
    'Attempt to load wrong file should display command failed');

assert.equal(
	actions.interpret('Test.idr', '2+2', 1, 1),
	`echo "4"`,
    'interpret returns correct expression result');

assert.equal(
	actions.caseSplit('Test.idr', 'splitHere', 4, 15),
	`execute-keys -draft x c "caseSplitHere True = ?caseSplitHere_rhs_1<ret>` +
	`caseSplitHere False = ?caseSplitHere_rhs_2<ret><esc>"; execute-keys 4g 14l`,
    'clause split runs new line with clause');

assert.equal(
	actions.addClause('Test.idr', 'addClauseHere', 6, 1),
	'execute-keys -draft o "addClauseHere xs = ?addClauseHere_rhs<esc>"; execute-keys jwwb',
    'clause split runs new line with clause');
    

console.log('All tests succeeded');
