const serverConfig = require('../../global/severConfig')
// This class is responsible for formulas used for limits
class FormulaFunctions {
    // ******************************************************************************************//
    // below two function responsible for calculation of lower and upper limit for Balance & vernier
    //***************************************************************************************** */
    lowerLimit(inComingObj, TType='T2') {
        var digit = parseInt(serverConfig.calculationDigit);
        var nominal = parseFloat(inComingObj.nominal); // Nominal
        var T1Neg = this.FormatNumber(inComingObj.T1Neg, digit);
        var T1Pos = this.FormatNumber(inComingObj.T1Pos, digit);
        var T2Neg = this.FormatNumber(inComingObj.T2Neg, digit);
        var T2Pos = this.FormatNumber(inComingObj.T2Pos, digit);
        if(TType == 'T2'){
            TType = T2Neg;
        } else {
            TType = T1Neg;
        }
        if (inComingObj.LimitOn.readUIntLE() == 0) { //Actual 
            var lowerLimit = this.FormatNumberString(Math.abs(nominal - TType), digit);
            return lowerLimit;
        } else { // Percentage
            var lowerLimit = this.FormatNumberString((((nominal * TType) / 100) - nominal), digit);
            return this.FormatNumberString(Math.abs(lowerLimit), digit);
        }
    }


    FormatNumberString(numberValue, intFormatNumber) {
        var dp = 0;
        switch (intFormatNumber) {
            case 1:
                dp = 10;
                break;
            case 2:
                dp = 100;
                break;
            case 3:
                dp = 1000;
                break;
            case 4:
                dp = 10000;
                break;
            case 5:
                dp = 100000;
                break;
            default:
                break;
        }
        return parseFloat(Math.round(numberValue * dp) / dp).toFixed(intFormatNumber);
    }
    FormatNumber(num, places) {
        return Math.trunc(num * Math.pow(10, places)) / Math.pow(10, places);
    }

    upperLimit(inComingObj,TType='T2') {
        var digit = parseInt(serverConfig.calculationDigit);
        var nominal = parseFloat(inComingObj.nominal);
        var T1Neg = this.FormatNumber(inComingObj.T1Neg, digit);
        var T1Pos = this.FormatNumber(inComingObj.T1Pos, digit);
        var T2Neg = this.FormatNumber(inComingObj.T2Neg, digit);
        var T2Pos = this.FormatNumber(inComingObj.T2Pos, digit);
        if(TType == 'T2'){
            TType = T2Pos;
        } else {
            TType = T1Pos;
        }
        if (inComingObj.LimitOn.readUIntLE() == 0) { //Actual 
            var upperLimit = this.FormatNumberString(nominal + TType, digit);
            return upperLimit;
        } else {// Percentage
            var upperLimit = this.FormatNumberString((((nominal * TType) / 100) + nominal), digit);
            return upperLimit;
        }
    }
    lowerLimitForRemark(inComingObj, AvgNominal) {
        var digit = parseInt(serverConfig.calculationDigit);
        var objLowerLimit = {};

        if (AvgNominal == "" || AvgNominal == undefined) {
            var nominal = parseFloat(inComingObj.Nom); // Nominal
        } else {
            var nominal = parseFloat(AvgNominal); // Nominal
        }

        var T1Neg = this.FormatNumber(inComingObj.T1NegTol, digit);
        var T1Pos = this.FormatNumber(inComingObj.T1PosTol, digit);
        var T2Neg = this.FormatNumber(inComingObj.T2NegTol, digit);
        var T2Pos = this.FormatNumber(inComingObj.T2PosTol, digit);
        if (inComingObj.limitOn.readUIntLE() == 0) { //Actual 
            var lowerLimit1 = this.FormatNumberString(nominal - T1Neg, digit);
            var lowerLimit2 = this.FormatNumberString(nominal - T2Neg, digit);
            Object.assign(objLowerLimit,
                { lowerLimit1: lowerLimit1 },
                { lowerLimit2: lowerLimit2 },
            )
            return objLowerLimit;
        } else { // Percentage
            var lowerLimit1 = this.FormatNumberString((((nominal * T1Neg) / 100) - nominal), digit);
            var lowerLimit2 = this.FormatNumberString((((nominal * T2Neg) / 100) - nominal), digit);
            //return Math.abs(lowerLimit);
            Object.assign(objLowerLimit,
                { lowerLimit1: Math.abs(lowerLimit1) },
                { lowerLimit2: Math.abs(lowerLimit2) },
            )
            return objLowerLimit;
        }
    }
    upperLimitForRemark(inComingObj, AvgNominal) {
        var digit = parseInt(serverConfig.calculationDigit);
        var objLowerLimit = {};
        if (AvgNominal == "" || AvgNominal == undefined) {
            var nominal = parseFloat(inComingObj.Nom); // Nominal
        } else {
            var nominal = parseFloat(AvgNominal); // Nominal
        }

        var T1Neg = this.FormatNumber(inComingObj.T1NegTol, digit);
        var T1Pos = this.FormatNumber(inComingObj.T1PosTol, digit);
        var T2Neg = this.FormatNumber(inComingObj.T2NegTol, digit);
        var T2Pos = this.FormatNumber(inComingObj.T2PosTol, digit);
        if (inComingObj.limitOn.readUIntLE() == 0) { //Actual 
            var upperLimit1 = this.FormatNumberString(nominal + T1Pos, digit);
            var upperLimit2 = this.FormatNumberString(nominal + T2Pos, digit);
            Object.assign(objLowerLimit,
                { upperLimit1: upperLimit1 },
                { upperLimit2: upperLimit2 },
            )
            return objLowerLimit;

        } else {// Percentage
            var upperLimit1 = this.FormatNumberString((((nominal * T1Pos) / 100) + nominal), digit);
            var upperLimit2 = this.FormatNumberString((((nominal * T2Pos) / 100) + nominal), digit);
            Object.assign(objLowerLimit,
                { upperLimit1: upperLimit1 },
                { upperLimit2: upperLimit2 },
            )
            return objLowerLimit;
        }
    }


    lowerLimitForRemarkForDiff(inComingObj, AvgNominal) {
        var objLowerLimit = {};
        var digit = parseInt(serverConfig.calculationDigit);
        if (AvgNominal == "" || AvgNominal == undefined) {
            var nominal = this.FormatNumber(inComingObj.NomNet, digit); // Nominal
        } else {
            var nominal = this.FormatNumber(AvgNominal, digit); // Nominal
        }

        var T1Neg = this.FormatNumber(inComingObj.T1NegNet, digit);
        var T1Pos = this.FormatNumber(inComingObj.T1PosNet, digit);
        if(serverConfig.ProjectName=='SunHalolGuj1'){
            /**
             * here want to compare last remark with operational limit so we are taking T3 as lowerLimit2
             */
            var T2Neg = this.FormatNumber(inComingObj.T3NegNet, digit);
        } else {
            var T2Neg = this.FormatNumber(inComingObj.T2NegNet, digit);
        }
        var T2Pos = this.FormatNumber(inComingObj.T2PosNet, digit);
        if (inComingObj.limitOn.readUIntLE() == 0) { //Actual 
            var lowerLimit1 = this.FormatNumberString(nominal - T1Neg, digit);
            var lowerLimit2 = this.FormatNumberString(nominal - T2Neg, digit);
            Object.assign(objLowerLimit,
                { lowerLimit1: lowerLimit1 },
                { lowerLimit2: lowerLimit2 },
            )
            return objLowerLimit;
        } else { // Percentage
            var lowerLimit1 = this.FormatNumberString((((nominal * T1Neg) / 100) - nominal), digit);
            var lowerLimit2 = this.FormatNumberString((((nominal * T2Neg) / 100) - nominal), digit);
            //return Math.abs(lowerLimit);
            Object.assign(objLowerLimit,
                { lowerLimit1: Math.abs(lowerLimit1) },
                { lowerLimit2: Math.abs(lowerLimit2) },
            )
            return objLowerLimit;
        }
    }
    upperLimitForRemarkForDiff(inComingObj, AvgNominal) {
        var digit = parseInt(serverConfig.calculationDigit);
        var objLowerLimit = {};
        if (AvgNominal == "" || AvgNominal == undefined) {
            var nominal = this.FormatNumber(inComingObj.NomNet, digit); // Nominal
        } else {
            var nominal = this.FormatNumber(AvgNominal, digit); // Nominal
        }

        var T1Neg = this.FormatNumber(inComingObj.T1NegNet, digit);
        var T1Pos = this.FormatNumber(inComingObj.T1PosNet, digit);
        var T2Neg = this.FormatNumber(inComingObj.T2NegNet, digit);
        if(serverConfig.ProjectName=='SunHalolGuj1'){
            /**
             * here want to compare last remark with operational limit so we are taking T3 as upperLimit2
             */
            var T2Pos = this.FormatNumber(inComingObj.T3PosNet, digit);
        } else {
            var T2Pos = this.FormatNumber(inComingObj.T2PosNet, digit);
        }
       
        if (inComingObj.limitOn.readUIntLE() == 0) { //Actual 
            var upperLimit1 = this.FormatNumberString(nominal + T1Pos, digit);
            var upperLimit2 = this.FormatNumberString(nominal + T2Pos, digit);
            Object.assign(objLowerLimit,
                { upperLimit1: upperLimit1 },
                { upperLimit2: upperLimit2 },
            )
            return objLowerLimit;

        } else {// Percentage
            var upperLimit1 = this.FormatNumberString((((nominal * T1Pos) / 100) + nominal), digit);
            var upperLimit2 = this.FormatNumberString((((nominal * T2Pos) / 100) + nominal), digit);
            Object.assign(objLowerLimit,
                { upperLimit1: upperLimit1 },
                { upperLimit2: upperLimit2 },
            )
            return objLowerLimit;
        }
    }
    //************************************************************************************************ */

    // *************************************************************************************************//
    // below two function responsible for calculation of lower and upper limit for Bulk data Instrument
    //***************************************************************************************** *********/
    lowerLimit1(nominal, T1Neg) {
        if (nominal == undefined && T1Neg != undefined) {
            var lowerLimit = T1Neg;
            return Math.abs(lowerLimit);
        } else {
            var lowerLimit = parseFloat(nominal) - parseFloat(T1Neg);
            return Math.abs(lowerLimit);
        }

    }
    upperLimit1(nominal, T1Pos) {
        if (nominal == undefined && T1Pos != undefined) {
            var upperLimit = T1Pos;
            return upperLimit;
        }
        else {
            var upperLimit = parseFloat(nominal) + parseFloat(T1Pos);
            return upperLimit;
        }


    }
    FormatNumberNOS(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }
    //********************************************************************************************** */
};
module.exports = FormulaFunctions;