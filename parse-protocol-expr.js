let finalLine = 'Alas the file is done, aborting';
let sizePrefixLength = 6;

// converts lines in the format of 0000<length>(:data ..)0000<length>(:more ..) to ['(:data ..', '(:more ..']
function readPrefixedLines(str) {
    let lines = [];
    while (str.indexOf(finalLine) !== 0) {
        let size = parseInt(str.slice(0, sizePrefixLength), 16);
        if (!size) break;
        
        lines.push(str.slice(sizePrefixLength, size + sizePrefixLength - 1));
        str = str.slice(size + sizePrefixLength);
    }

    return lines;
}

function parseProtocolExpr(str) {
    let prevChar = '';
    let insideQuotes = false;
    let buffer = '';

    let data = [];
    let refHierarchy = [];
    let ref = data;

    for (let line of readPrefixedLines(str)) {
        for (let char of line.split('')) {

            if (insideQuotes) {
                if (prevChar != '\\' && char == '"') {
                    insideQuotes = false;
                } else {
                    buffer = buffer + char;
                }
            } else {
                switch (char) {
                    case '"':
                        insideQuotes = true;
                        break;
                    case ' ':
                        if (buffer) ref.push(buffer);
                        buffer = '';
                        break;
                    case '(':
                        let add = [];
                        refHierarchy.push(ref);
                        ref.push(add);
                        ref = add;
                        break;
                    case ')':
                        if (buffer) ref.push(buffer);
                        buffer = '';

                        if (refHierarchy.length < 1) {
                            throw `Line "${line}" is missing closing parenthesis.`;
                        }
                        ref = refHierarchy.pop();
                        break;
                    default:
                        buffer = buffer + char;
                }
            }

            prevChar = char;
        }
    }

    return data;
}

module.exports = parseProtocolExpr;
