const encdecAlgo = require('../middleware/encdecAlgo');
//****************************************************************************************************** *//
//Below function calculates the checksum we have two values for blnOnlyCheckSum, if true then it only     //
// calculates checksum rather it calculates checksum and appends to protocol                             //
//******************************************************************************************************** */
function getCheckSum(strDataVal, blnOnlyCheckSum = false) {
    // console.log("start time",new Date().getTime());
    return new Promise((resolve, reject) => {
        var ChkSum, Chksum1, strLen, ResVal;
        ChkSum = 0;
        strLen = strDataVal.length;
        // console.log('strLen',strLen)
        if (strLen < 0) {
            reject('in checksum str lenght less than zero');
        }
        var myarr = [];
        for (let i = 0; i <= strLen - 1; i++) {
            myarr.push(strDataVal.substring(i, i + 1));
            ChkSum = ChkSum + myarr[i].charCodeAt(0);
            // console.log("loop",myarr[i],": ", myarr[i].charCodeAt(0));
        }
        // console.log("inside get",myarr);
        Chksum1 = ChkSum % 256;
        ResVal = (256 - Chksum1);
        // console.log('Resval', myarr, ResVal);
        //for printing labels (setPrintData)if chksum is Chr(ResVal) = Chr(13) Or Chr(ResVal) = Chr(36) Or Chr(ResVal) = Chr(45) Or Chr(ResVal) = Chr(0)
        //then String is appended with N so it is now appended with space
        if (ResVal == 256 || ResVal == 13) //' Character set is upto 255
        {
            encdecAlgo.decrypt(strDataVal).then(decryptedProtocol => {
                decryptedProtocol += " "; //"N"
                encdecAlgo.encrypt(decryptedProtocol).then(encryptedProtocol => {
                    getCheckSum(encryptedProtocol);
                }).catch(err => { console.log(err) })
            }).catch(err => { console.log(err) })
        }
        if (blnOnlyCheckSum == true) {
            //var buffer1 = new Buffer(String.fromCharCode(ResVal), "ascii")
            resolve(ResVal);
            //return buffer1;
        }
        else {
            var buffer = new Buffer(strDataVal + String.fromCharCode(ResVal) + String.fromCharCode(13), "ascii")
            resolve(buffer);
        }

    })
}

/**
 * This function will return a checksum or protocol with checksum
 * This function will take buffer values in array if checksum value is 256 or 13 then it will
 * add a space charater in the recived protocol buffer and call the same function to get checksum again.
 * @param {*} arrDataVal : array of buffer values
 * @param {*} blnOnlyCheckSum : true = Return only checksum , false = return protocol with checksum in buffer format.
 */
function getCheckSumBuffer(arrDataVal, blnOnlyCheckSum = false) {
    // console.log("start time",new Date().getTime());
    return new Promise((resolve, reject) => {
        var ChkSum, Chksum1, strLen, ResVal;
        ChkSum = 0;
        strLen = arrDataVal.length;
        // console.log('strLen',strLen)
        if (strLen < 0) {
            reject('in checksum str lenght less than zero');
        }
        //var myarr = [];
        for (let i = 0; i <= strLen - 1; i++) {
            //myarr.push(strDataVal.substring(i, i + 1));
            ChkSum = ChkSum + arrDataVal[i];
            // console.log("loop",myarr[i],": ", myarr[i].charCodeAt(0));
        }
        // console.log("inside get",myarr);
        Chksum1 = ChkSum % 256;
        ResVal = (256 - Chksum1);
        // console.log('Resval', myarr, ResVal);
        //for printing labels (setPrintData)if chksum is Chr(ResVal) = Chr(13) Or Chr(ResVal) = Chr(36) Or Chr(ResVal) = Chr(45) Or Chr(ResVal) = Chr(0)
        //then String is appended with N so it is now appended with space
        if (ResVal == 256 || ResVal == 13) //' Character set is upto 255
        {
            arrDataVal.push(38);//38-6 = 32 space
            getCheckSumBuffer(arrDataVal);
            //     decryptedProtocol += " "; //"N"
            //     encdecAlgo.encrypt(decryptedProtocol).then(encryptedProtocol => { 
            //        
            //     }).catch(err => { console.log(err) })
            // }).catch(err => { console.log(err)})
        }
        if (blnOnlyCheckSum == true) {
            //var buffer1 = new Buffer(String.fromCharCode(ResVal), "ascii")
            resolve(ResVal);
            //return buffer1;
        }
        else {
            arrDataVal.push(ResVal, 13);
            var buffer = new Buffer(arrDataVal, "ascii");
            resolve(buffer);
        }

    })
}

//***************************************************************************************************************** */

module.exports.getCheckSum = getCheckSum;
module.exports.getCheckSumBuffer = getCheckSumBuffer;