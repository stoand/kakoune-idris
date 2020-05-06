var actions = require('./ide-mode-actions.js');
var fs = require('fs');

var stdinBuffer = fs.readFileSync(0);

var command    = process.env["kak_idris_command"];
var file       = process.env["kak_idris_file"];
var selection  = process.env["kak_idris_selection"];
var line       = process.env["kak_idris_line"];
var column     = process.env["kak_idris_column"];

var action = actions[command];

if(!action) {
    console.log('echo "Invalid Action"');
} else {
    // We need to preload the file to have deterministic messages later
    actions.load(file);
    
    console.log(action(file, selection, line, column));
}
