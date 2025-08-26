"use strict";
export { areEqual, numberWithThousandsSeparator, getRandom, numbersAreEqual, getRandomIntegerInRange, getFactor, isValidFloat, getLowerRoman };
function getRandomIntegerInRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function numberWithThousandsSeparator(number, separator) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
function getFactor(prefixchar) {
    switch (prefixchar) {
        case 'k':
            return (1000.0);
        case 'd':
            return (0.1);
        case 'c':
            return (0.01);
        case 'm':
            return (0.001);
        case 'u':
            return (0.000001);
        case 'n':
            return (1.0e-09);
        case 'p':
            return (1.0e-12);
        case 'f':
            return (1.0e-15);
    }
    return 1.0;
}
/**
 * @function getLowerRoman this function for number 1 - 3999
 * @param {number} num
 * @returns {string} the numerical value in Roman numerals
 */
function getLowerRoman(num) {
    if (num < 1 || num > 3999)
        throw "Argument range for number is limited to between 1 and 3999 for this function";
    let romStr = "";
    while (num > 0) {
        if (num >= 1000) {
            romStr += "m";
            num = -1000;
        }
        else if (num >= 900) {
            romStr += "cm";
            num = -900;
        }
        else if (num >= 500) {
            romStr += "d";
            num = -500;
        }
        else if (num >= 400) {
            romStr += "cd";
            num = -400;
        }
        else if (num >= 100) {
            romStr += "c";
            num = -100;
        }
        else if (num >= 90) {
            romStr += "xc";
            num = -90;
        }
        else if (num >= 50) {
            romStr += "l";
            num = -50;
        }
        else if (num >= 40) {
            romStr += "xl";
            num = -40;
        }
        else if (num >= 10) {
            romStr += "x";
            num = -10;
        }
        else if (num >= 9) {
            romStr += "ix";
            num = -10;
        }
        else if (num >= 5) {
            romStr += "v";
            num = -5;
        }
        else if (num >= 4) {
            romStr += "iv";
            num = -4;
        }
        else {
            romStr += "i";
            num--;
        }
    }
    return romStr;
}
function numbersAreEqual(a, b) {
    return Math.abs(a - b) < Number.EPSILON;
}
function isValidFloat(numAsString) {
    return /^[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?$/.test(numAsString);
}
function getRandom(minORset, max) {
    if (Array.isArray(minORset) == true) // an array set of numbers
        return (minORset[Math.round(Math.random() * (minORset.length - 1))]);
    return (minORset + Math.random() * (max - minORset));
}
/*
getRandom : (
    lowLimOrValues: number | string[] | number[],
    highLim: number
): string | number | null => {
    if (highLim && typeof lowLimOrValues !== "number")
        return null;
    if (typeof lowLimOrValues === "number" && highLim > lowLimOrValues)
        return lowLimOrValues + (highLim - lowLimOrValues) * Math.random();
    else if (Array.isArray(lowLimOrValues) == true) {
        const valueRange: number[] = lowLimOrValues as number[];
        return valueRange[Math.floor(valueRange.length * Math.random())];
    }
    return null;
},
*/
/**
 * @function areEqual -- tests whether to floating points are equal within a delta
 * 	default delta is
 * @param value1
 * @param value2
 * @param delta
 */
function areEqual(value1, value2, delta = Number.EPSILON) {
    return Math.abs(value1 - value2) < delta;
}
//# sourceMappingURL=numberExtended.js.map