var { execSync } = require('child_process');
var path = require('path');
var fs = require('fs');
var parseProtocolExpr = require('./parse-protocol-expr');

function newLinesToRet(text) {
    return text.replace(/\n/g, '<ret>');
}

function extract(fileContents, regex, defaultValue) {
  let matches = fileContents.match(regex);
  if (matches && matches.length && matches.length >= 1)
    return matches[1].trim();
  else
    return defaultValue;
}

function idrisExec(file, ipkg, root, additionalCommand, next) {
    let cdProjectCmd = 'cd ' + root + ' >> /dev/null';
    
    let command = cdProjectCmd + '; [ -d ' + root + ' ] && cd ' + root + '; idris2 --find-ipkg --ide-mode';
    let input = `((:load-file "${file}") 1)\n` + additionalCommand + '\n';

    // idris2 --ide-mode always returns status 1 (error) because the last line sent was empty
    try {
        execSync(command, { input, encoding: 'utf8' });
    } catch (res) {

        let esc = s => s.replace(/"/g, '""');

        let escapedCommand = esc(command);
        let escapedInput = esc(input);

        if (res.stderr) {
            let escapedErr = esc(res.stderr)
            return `info "\n[${__filename}] -- Error:\n\nCommand:\n${escapedCommand}\n\nInput:\n${escapedInput}\n\nStdErr:\n${escapedErr}\n\n"`;
        } else if (!res.stdout) {
            return `info "\n[${__filename}] -- Got empty stdout and stderr:\n\nCommand:\n${escapedCommand}\n\nInput:\n${escapedInput}\n\n"`;
        } else {

            let exprs = parseProtocolExpr(res.stdout);
            let warn = exprs.find(e => e[0] == ':warning');
            let err = exprs.find(e => e[0] == ':return' && e[1][0] == ':error');
            
            // Prefer to use the warning message over the error message
            if (warn) {
                let filePath = warn[1][0];
                let [line, column] = warn[1][1];
                let msg = warn[1][3];
                let escapedMsg = msg.replace(/\\"/g, '""'); // kakoune uses "" instead of \" to escape "
                return `e "${filePath}" ${line} ${column}; info "${escapedMsg}"`;
            } else if (err) {
                let msg = err[1][1];
                return `info "${msg}"`;
            } else {
                return next(exprs);
            }
        }
    }
}

function lastRetVal(exprs) {
    return exprs.concat().reverse().find(e => e[0] == ':return').find(e => e[0] == ':ok')[1];
}

exports.load = function(file, ipkg, root) {
    return idrisExec(file, ipkg, root, '', () => {});
}

exports.interpret = function(file, ipkg, root, selection) {
    return idrisExec(file, ipkg, root, `((:interpret "${selection}") 1)`, exprs => {
        return `echo "${lastRetVal(exprs)}"`;
    });
}

exports.typeOf = function(file, ipkg, root, selection, line, column) {
    return idrisExec(file, ipkg, root, `((:type-of "${selection}" ${line} ${column}) 1)`, exprs => {
        return `info -title "idris-ide: type" "\n${lastRetVal(exprs)}"`;
    });
}

exports.caseSplit = function(file, ipkg, root, selection, line, column) {
    return idrisExec(file, ipkg, root, `((:case-split ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft g h G l d i "${newLinesToRet(generatedCode)}<esc>"; execute-keys ${line}g ${column - 1}l`;
    });
    
}

exports.addClause = function(file, ipkg, root, selection, line) {
    return idrisExec(file, ipkg, root, `((:add-clause ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<esc>"; execute-keys jwwb`;
    });
}

exports.proofSearch = function(file, ipkg, root, selection, line) {
    return idrisExec(file, ipkg, root, `((:proof-search ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft c <backspace> "${newLinesToRet(generatedCode)}<esc>"`;
    });
}

exports.generateDef = function(file, ipkg, root, selection, line) {
    return idrisExec(file, ipkg, root, `((:generate-def ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<esc>"; execute-keys jwwb`;
    });
}

exports.makeLemma = function(file, ipkg, root, selection, line) {
    return idrisExec(file, ipkg, root, `((:make-lemma ${line} "${selection}") 1)`, exprs => {
        let [generatedCode, replace] = lastRetVal(exprs).split('\n');
        return `execute-keys c <backspace> "${replace}" <esc> <A-i> p O "${generatedCode}" <ret> <esc> k`;
    });
}

// Make Case - TOOD (not implemented in idris2 as of this time)

exports.makeWith = function(file, ipkg, root, selection, line) {
    return idrisExec(file, ipkg, root, `((:make-with ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<backspace><esc>"; execute-keys -with-maps -with-hooks j <A-l> h c`;
    });
}
