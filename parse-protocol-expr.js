let endLine = 'Alas the file is done, aborting';
let sizePrefixLength = 6;

// converts lines in the format of 0000<length>(:data ..)0000<length>(:more ..) to ['(:data ..', '(:more ..']
function readPrefixedLines(str) {
    let lines = [];
    while(str.indexOf(endLine) !== 0) {
        let size = parseInt(str.slice(0, sizePrefixLength), 16);
        lines.push(str.slice(sizePrefixLength, size + sizePrefixLength - 1));
        str = str.slice(size + sizePrefixLength);
    }

    return lines;
}

function parseProtocolExpr(str) {
    console.log(readPrefixedLines(str));
    return [];
}

module.exports = parseProtocolExpr;
