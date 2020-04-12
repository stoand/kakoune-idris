let parseProtocolExpr = require('./parse-protocol-expr');
let assert = require('assert');

let example1 =
    `000018(:protocol-version 2 0)
000040(:write-string "1/1: Building TestInvalid (TestInvalid.idr)" 1)
0000c0(:warning ("TestInvalid.idr" (4 8) (5 1) "While processing right hand side of asdf at TestInvalid.idr:4:1--5:1:
When unifying String and Integer
Mismatch between:
	String
and
	Integer" ()) 1)
000105(:return (:error "Error(s) building file TestInvalid.idr: TestInvalid.idr:4:1--5:1:When elaborating right hand side of TestInvalid.asdf:
TestInvalid.idr:4:8--5:1:When unifying: String and Integer
	TestInvalid.idr:4:8--5:1:Type mismatch: String and Integer") 1)
Alas the file is done, aborting

`;

assert.deepEqual(parseProtocolExpr(example1), [
    [':protocol-version', '2', '0'],
    [':write-string', '1/1: Building TestInvalid (TestInvalid.idr)', '1'],
    [':warning', ["TestInvalid.idr", ['4', '8'], ['5', '1'],
        'While processing right hand side of asdf at TestInvalid.idr:4:1--5:1:\n' +
        'When unifying String and Integer\nMismatch between:\n	String\nand\n	Integer', []], 1],
    [':return', [':error', 'Error(s) building file TestInvalid.idr: TestInvalid.idr:4:1--5:1:' +
        'When elaborating right hand side of TestInvalid.asdf:\nTestInvalid.idr:4:8--5:1:' +
        'When unifying: String and Integer\n	TestInvalid.idr:4:8--5:1:Type mismatch: String and Integer'], 1]
], 'Example 1 parsed correctly');


// todo handle quotes
let example2 = '';
