var { execSync } = require('child_process');

function newLinesToRet(text) {
    return text.replace(/\n/g, '<ret>');
}

function idrisExec(file, additionalCommand, next) {
    // idris2 --ide-mode always returns status 1 (error) because the last line sent was empty
    try {
        execSync('idris2 --ide-mode', { input: `((:load-file "${file}") 1)\n` + additionalCommand + '\n', encoding: 'utf8' });
    } catch (res) {
        let out = res.stdout;
        let matchError = out.match(/:error "(.*)"/);
        if (matchError) {
            return `echo "${matchError[1]}"`;
        } else {
            return next(out);
        }
    }
}

exports.load = function(file) {
    return idrisExec(file, '', () => {});
}

exports.interpret = function(file, selection) {
    return idrisExec(file, `((:interpret "${selection}") 1)`, out => {
        return `echo "${out.split('\n')[2]}"`;
    });
}

exports.typeOf = function(file, selection, line, column) {
    return idrisExec(file, `((:type-of "${selection}" ${line} ${column}) 1)`, out => {
        // return out;
        return `info -title "idris-ide: type" "\n${out.split('"')[3]}"`;
    });
}

exports.caseSplit = function(file, selection, line, column) {
    return idrisExec(file, `((:case-split ${line} "${selection}") 1)`, out => {
        var generatedCode = out.split('"')[3];
        return `execute-keys -draft x c "${newLinesToRet(generatedCode)}<esc>"; execute-keys ${line}g ${column - 1}l`;
    });
    
}

exports.addClause = function(file, selection, line) {
    return idrisExec(file, `((:add-clause ${line} "${selection}") 1)`, out => {
        var generatedCode = out.split('"')[3];
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<esc>"; execute-keys jwwb`;
    });
}

exports.proofSearch = function(file, selection, line) {
    return idrisExec(file, `((:proof-search ${line} "${selection}") 1)`, out => {
        var generatedCode = out.split('"')[3];
        return `execute-keys -draft c <backspace> "${newLinesToRet(generatedCode)}<esc>"`;
    });
}

exports.generateDef = function(file, selection, line) {
    return idrisExec(file, `((:generate-def ${line} "${selection}") 1)`, out => {
        var generatedCode = out.split('"')[3];
        return `execute-keys -draft o "${newLinesToRet(generatedCode)}<esc>"; execute-keys jwwb`;
    });
}

// | MakeLemma Integer String

// | MakeCase Integer String

// | MakeWith Integer String
