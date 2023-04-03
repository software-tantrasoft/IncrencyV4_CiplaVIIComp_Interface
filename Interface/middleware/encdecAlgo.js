// ***********************************************************************************************//
//  Below Mechanism - taking encrypted protocol then decrypt it                                  //
//***********************************************************************************************//
function decrypt(strRecievedProtocol, blnEncryptReq = true) {
    return new Promise((resolve, reject) => {
        var length = strRecievedProtocol.length;
        var strDecryptProtocol = '';
        var arrDcrChar = [];
        for (let i = 0; i < length; i++) {
            arrDcrChar.push(strRecievedProtocol.charAt(i));
            strDecryptProtocol = strDecryptProtocol + String.fromCharCode((arrDcrChar[i].charCodeAt(0) - 2));
        }
        if (blnEncryptReq == false) {
            resolve(strRecievedProtocol);
        } else {
            resolve(strDecryptProtocol);
        }
    });
}

// ***********************************************************************************************//
//  Below Mechanism - taking plain protocol then encrypt it                                  //
//***********************************************************************************************//
function encrypt(strRecievedProtocol, blnEncryptReq = true) {
    strRecievedProtocol = strRecievedProtocol.toString('utf8');
    return new Promise((resolve, reject) => {
        var length = strRecievedProtocol.length;
        var strEncProtocol = '';
        var arrEncChar = [];
        for (let i = 0; i < length; i++) {
            arrEncChar.push(strRecievedProtocol.charAt(i));
            strEncProtocol = strEncProtocol + String.fromCharCode((arrEncChar[i].charCodeAt(0) + 2));
            //console.log(strEncProtocol);
        }
        if (blnEncryptReq == false) {
            resolve(strRecievedProtocol);
        }
        else {
            resolve(strEncProtocol);
        }

    });
}
//************************************************************************************************** */
module.exports.decrypt = decrypt;
module.exports.encrypt = encrypt;