const math = require('mathjs');

class MathJS {

    /**
     * roundUp(x,y) is used to round up number upto decimal place provided
     * @param {any} inputNumber | Number to be roud up 
     * @param {any} decimalPoint | (Optional) Number of decimals to allow
     * @returns {Number} Rounded-Up number. If decimalPoint is not specified then returns the same number.
     */
    roundUp(inputNumber,decimalPoint = 999)
    {
        if(math.number(decimalPoint) != 999)
        {
            // decimalPoint passed to function
            return math.round(math.number(inputNumber),math.round(decimalPoint));
        }
        else
        {
            // No decimalPoint passed to function
            return math.number(inputNumber);
        }
    }

    /**
     * roundUpPad(x,y) is used to round up number to fixed decimal length. If decimalPoint is not specified then returns number with 1 decimal.
     * @param {any} inputNumber | Number to be roud up 
     * @param {any} decimalPoint (Optional) Number of decimals to allow
     * @returns {Number} Rounded-Up number with padding (If reqired)
     */
    roundUpPad(inputNumber,decimalPoint = 999)
    {
        if(math.number(decimalPoint) != 999)
        {
            // decimalPoint passed to function
            return math.format(math.number(inputNumber),{notation: 'fixed', precision: math.round(decimalPoint)});
        }
        else
        {
            // No decimalPoint passed to function
            return math.format(math.number(inputNumber),{notation: 'fixed', precision: 1});
        }
    }
}
module.exports = MathJS;