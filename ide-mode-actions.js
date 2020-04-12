var { execSync } = require('child_process');
var path = require('path');
var parseProtocolExpr = require('./parse-protocol-expr');

function newLinesToRet(text) {
    return text.replace(/\n/g, '<ret>');
}

function idrisExec(file, additionalCommand, next) {
    let cdProjectCmd = 'source "' + path.join(__dirname, 'cdproject.sh') + '" "' + file + '"';
    let relPath = path.relative(__dirname, file);
    
    // idris2 --ide-mode always returns status 1 (error) because the last line sent was empty
    try {
        execSync(cdProjectCmd + '; [[ -d src ]] && cd src; idris2 --ide-mode',
        	{ input: `((:load-file "${relPath}") 1)\n` + additionalCommand + '\n', encoding: 'utf8', shell: '/bin/bash' });
    } catch (res) {
        let exprs = parseProtocolExpr(res.stdout);
        let ret = exprs.find(e => e[0] == ':return')[1];
        
        if (ret[0] == ':error') {
            // Prefer to use the warning message over the error message
            let warn = exprs.find(e => e[0] == ':warning');
            let msg = warn ? warn[1][3] : ret[1];
            return `info "${msg}"`;
        } else {
            return next(exprs);
        }
    }
}

function lastRetVal(exprs) {
   return exprs.concat().reverse().find(e => e[0] == ':return').find(e => e[0] == ':ok')[1]; 
}

exports.load = function(file) {
    return idrisExec(file, '', () => {});
}

exports.interpret = function(file, selection) {
    return idrisExec(file, `((:interpret "${selection}") 1)`, exprs => {
        return `echo "${lastRetVal(exprs)}"`;
    });
}

exports.typeOf = function(file, selection, line, column) {
    return idrisExec(file, `((:type-of "${selection}" ${line} ${column}) 1)`, exprs => {
        return `info -title "idris-ide: type" "\n${lastRetVal(exprs)}"`;
    });
}

exports.caseSplit = function(file, selection, line, column) {
    return idrisExec(file, `((:case-split ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft x c "${newLinesToRet(generatedCode)}<ret><esc>"; execute-keys ${line}g ${column - 1}l`;
    });
    
}

exports.addClause = function(file, selection, line) {
    return idrisExec(file, `((:add-clause ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<esc>"; execute-keys jwwb`;
    });
}

exports.proofSearch = function(file, selection, line) {
    return idrisExec(file, `((:proof-search ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft c <backspace> "${newLinesToRet(generatedCode)}<esc>"`;
    });
}

exports.generateDef = function(file, selection, line) {
    return idrisExec(file, `((:generate-def ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<esc>"; execute-keys jwwb`;
    });
}

exports.makeLemma = function(file, selection, line) {
    return idrisExec(file, `((:make-lemma ${line} "${selection}") 1)`, exprs => {
        let [generatedCode, replace] = lastRetVal(exprs).split('\n');
        return `execute-keys c <backspace> "${replace}" <esc> <A-i> p O "${generatedCode}" <ret> <esc> k`;
    });
}

// Make Case - TOOD (not implemented in idris2 as of this time)

exports.makeWith = function(file, selection, line) {
    return idrisExec(file, `((:make-with ${line} "${selection}") 1)`, exprs => {
        let generatedCode = lastRetVal(exprs);
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<backspace><esc>"; execute-keys -with-maps -with-hooks j <A-l> h c`;
    });
}
