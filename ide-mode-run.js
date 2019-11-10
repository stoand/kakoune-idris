var actions = require('./ide-mode-actions.js');
var fs = require('fs');

var stdinBuffer = fs.readFileSync(0);
var [command, file, selection, line, column] = stdinBuffer.toString().split('\n');

var action = actions[command];

if(!action) {
    console.log('echo "Invalid Action"');
} else {
    // We need to preload the file to have deterministic messages later
    actions.load(file);
    
    console.log(action(file, selection, line, column));
}
