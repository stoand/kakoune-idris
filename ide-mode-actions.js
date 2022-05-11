var { execSync } = require('child_process');
var path = require('path');
var fs = require('fs');
var parseProtocolExpr = require('./parse-protocol-expr');

// Uncomment to enable verbose logs (disabled due to large file size issues)
// const logFile = '/tmp/__kak_idris2_exprs';
const logFile = undefined;

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
    let input = `((:load-file "${file}") 1)\n` + additionalCommand + '\n';

    // idris2 --ide-mode always returns status 1 (error) because the last line sent was empty
    try {
        execSync(cdProjectCmd + '; [ -d ' + root + ' ] && cd ' + root + '; idris2 --find-ipkg --ide-mode',
        	{ input, encoding: 'utf8' });
    } catch (res) {

        let exprs = parseProtocolExpr(res.stdout);
        if (logFile) {
            fs.appendFileSync(logFile, 'Input Sent:\n' + input + '\n\n' + res.stdout || res.stderr || '<stdout & stderr were empty>\n');
        }
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

    let execTypeOf = params => {
      return idrisExec(file, ipkg, root, `((:type-of ${params}) 1)`, exprs => {
          let result = lastRetVal(exprs);
          return result && `info -title "idris-ide: type" "\n${result}"`;
      });
    };
    
    return execTypeOf(`"${selection}" ${line} ${column}`) || execTypeOf(`"${selection}"`);
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
        let ret = lastRetVal(exprs);
        let replace = ret[1][1];
        let generatedCode = ret[2][1];
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
