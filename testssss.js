const { isValid, parse } = require("date-fns");

const validate1 = parse("29.1.2a20", "dd.MM.yyyy", new Date());
const validate2 = parse("30.2.2020", "dd.MM.yyyy", new Date());

console.log(validate1);
console.log(validate2);
console.log(isValid(validate1));
console.log(isValid(validate2));
