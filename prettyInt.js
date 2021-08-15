/**
 * Courtesy of Project Dyson
 */

const UNITS = ['K', 'M', 'B', 'T'];
/**
 * Formats a number into a standardized integer display
 */
const REGEX_SPLIT_THREE_DIGITS = /(\d+)(\d{3})/;
function prettyInt(num) {
    if (!num) {
        return '0';
    }
    if (num === Infinity) {
        return 'Unlimited';
    }
    //Convert input to integer
    let parsedNum = Math.round(+num);
    let prefix = '';
    let postfix = '';
    //Work on absolute value of the number
    if (parsedNum < 0) {
        prefix = '-';
        parsedNum = -parsedNum;
    }
    let unitIndex = 0;
    while (parsedNum > 10000 && unitIndex < UNITS.length) {
        postfix = '.' + Math.floor((parsedNum % 1000) / 100) + UNITS[unitIndex];
        unitIndex++;
        parsedNum = Math.floor(parsedNum / 1000);
    }
    const numString = String(parsedNum).replace(/^\d+/, w => {
        while (REGEX_SPLIT_THREE_DIGITS.test(w)) {
            w = w.replace(REGEX_SPLIT_THREE_DIGITS, '$1,$2');
        }
        return w;
    });
    return prefix + numString + postfix;
}
