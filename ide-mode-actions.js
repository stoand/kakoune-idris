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


    let optionsRegexp = /opts\s*=\s*\"([^\"]*)\"/;
    let sourcedirRegexp = /sourcedir\s*=\s*'?"?([a-zA-Z/0-9.]+)/;
    let pkgsRegexp = /(?:depends|pkgs)\s*=\s*(([a-zA-Z/0-9., ]+\s{0,1})*)/;
    let ipkgFileContents = fs.readFileSync(ipkg,{ encoding: 'utf8' }).toString();

    let sourcedir = extract(ipkgFileContents, sourcedirRegexp, "src");
    let options = extract(ipkgFileContents, optionsRegexp, "");
    let pkgs = extract(ipkgFileContents, pkgsRegexp, "")
                 .split(",")
                 .filter((v, i, a) => v.trim() != "")
                 .map(t => "-p " + t.trim());
    let compilerOptions = options + " " + pkgs.join(" ")
    let fullSourcedir = path.join(root, sourcedir);

    // idris2 --ide-mode always returns status 1 (error) because the last line sent was empty
    try {
        execSync(cdProjectCmd + '; [[ -d ' + fullSourcedir + ' ]] && cd ' + fullSourcedir + '; idris2 ' + compilerOptions + ' --ide-mode',
        	{ input: `((:load-file "${file}") 1)\n` + additionalCommand + '\n', encoding: 'utf8', shell: '/bin/bash' });

        // When `https://github.com/edwinb/Idris2/issues/349` gets merged, we will not need to parse the ipkg file
        // and the following would be enough to use thie ipkg configuration
        // execSync(cdProjectCmd + '; [[ -d ' + root + ' ]] && cd ' + root + '; idris2 --find-ipkg --ide-mode',
        // 	{ input: `((:load-file "${file}") 1)\n` + additionalCommand + '\n', encoding: 'utf8', shell: '/bin/bash' });
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
        return `execute-keys -draft x c "${newLinesToRet(generatedCode)}<ret><esc>"; execute-keys ${line}g ${column - 1}l`;
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
