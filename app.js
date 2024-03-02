const ready = require('./server/util/ready');

console.log(ready.generate('S39KNX0J733948J', '2019/03/01'));
console.log(ready.generate('E14C_0060_5603_2300.', '2029/03/01'));
console.log(ready.generate('WD-WCC6Y4KRFHLZ', '2119/03/01'));
console.log(ready.generate('3032363131303531303035332039202020202020', '2119/03/01'));
console.log(ready.generate('E14C_0060_5603_2300.', '2119/03/01'));
console.log(ready.generate('41543232313532343437314a3734203320202020', '2025/03/01'));
console.log(ready.generate('WD-WCC6Y5EUL69C', '2028/03/01'));
console.log('==>')
console.log(ready.generate('YS20230505375437', '2123/11/05'));