// Importing native modules
const checksum = require('./middleware/checksum');
const indexModule = require('../index');
const encdecAlgo = require('./middleware/encdecAlgo');
const globalData = require('./global/globalData');
const date = require('date-and-time')
const ErrorLog = require('./model/clsErrorLog');
//var colors = require('colors');
// const clsLogger  = require('./model/clsLogger');
// const objClsLogger = new clsLogger();
const clsprotocolHandlerController = require('./controller/protocolHandlerController');
const protocolHandlerController = new clsprotocolHandlerController();
var logFromPC = require('../Interface/model/clsLogger');
const serverConfig = require('../Interface/global/severConfig')

function protocolToString(buffIncommingProtocol) {
    var strProtocol = "";
    buffIncommingProtocol.forEach(char => {
        strProtocol = strProtocol + String.fromCharCode(char);
    });
    return strProtocol;
}
/**
 * @description function takes argument as message on socket and IPV4 family info
 * @param {*} buffIncommingProtocol 
 */
async function interface(inCommingMsg, info) {
    //console.log("First ",Buffer.from(inCommingMsg,'utf8'));
    try {
        var temp = inCommingMsg;
        var arrNonPrintableCharOctalNo = [0, 1, 2, 3, 4, 5, 6]

        var strRecivedProtocol = protocolToString(Buffer.from(inCommingMsg, 'utf8'));
        //console.log("second ",strRecivedProtocol);


        var check_tilde = await encdecAlgo.decrypt(strRecivedProtocol);
        var Istilde = check_tilde.includes('Inst.ID:') ? true : false;
        Istilde ? console.log(check_tilde) : null;



        //to remove char 13 from string
        strRecivedProtocol = strRecivedProtocol.replace(/\s+/g, ' ').trim();
        //console.log("third",strRecivedProtocol);

        // here we bypass fingerprint template as it doen not contain any checksum and not need to decrypt
        if (strRecivedProtocol.substring(0, 2) !== 'FP') {
            // checksum.getCheckSum(strRecivedProtocol.substring(0, strRecivedProtocol.length - 1), true)
            var arrBinaryProtocol = [];
            arrBinaryProtocol.push(...inCommingMsg);
            let result = await checksum.getCheckSumBuffer(arrBinaryProtocol.splice(0, arrBinaryProtocol.length - 2), true);
            var calculatedchecksum = result;

            var arrRecievedProtocol = [];
            // as we have inCommingMsg in buffer, push it to arrRecievedProtocol
            arrRecievedProtocol.push(...inCommingMsg);
            var strRecivedCheckSum = arrRecievedProtocol.splice(arrRecievedProtocol.length - 2, 1);
            // For logging Incorrect checksum protocol 
            var checkProtocol = await encdecAlgo.decrypt(strRecivedProtocol);

            //  console.log('on app.js ', strRecivedProtocol)
            // console.log(strRecivedCheckSum[0])
            //!arrNonPrintableCharOctalNo.includes(strRecivedCheckSum[0]
            //console.log(strRecivedCheckSum[0]);
            //console.log(calculatedchecksum);

            if (Istilde) {
                //logFromPC.addtoProtocolLog(strRecivedCheckSum[0])
                console.log(strRecivedCheckSum[0]);
                console.log(calculatedchecksum);
                //logFromPC.addtoProtocolLog(calculatedchecksum)
            }

            if ((strRecivedCheckSum[0] == calculatedchecksum) || Istilde) {

                //  console.log('Incoming msg', strRecivedProtocol.substring(0, 1), globalData.arrCommunication)
                //strRecivedProtocol.substring(0, 1) != '~' 
                //&& strRecivedProtocol.substring(0, 1) != 'E'

                //console.log(`replaced checksum ${strRecivedCheckSum} with $`);
                //inCommingMsg[inCommingMsg.length - 2] = Buffer.from(String.fromCharCode(36), 'utf8');
                let arrProto = [];
                arrProto.push(...inCommingMsg);

                arrProto[arrProto.length - 2] = 36;
                strRecivedProtocol = await protocolToString(Buffer.from(arrProto, 'utf8'));

                strRecivedProtocol = strRecivedProtocol.replace(/\s+/g, ' ').trim();
                if (strRecivedProtocol.substring(0, 1) != '~' && strRecivedProtocol.substring(0, 1) != '+'  && strRecivedProtocol.substring(0, 1) != '!') {
                    //console.log('Incoming msg', strRecivedProtocol);
                    /** @date 06/11/2020 
                     * @description if any protocol comes to gatway then setting value of Qcount to zero // for user release/communication off
                    */
                    var tempCountObj = globalData.arrCommunication.find(k => k.IdsNo == parseInt(info.address.split('.')[3]));
                    //console.log(tempCountObj.QCount)
                    if (tempCountObj != undefined) {
                        tempCountObj.QCount = 0
                    }
                    //26/10/2020
                    //1)Decripting string without checksome
                    var arrRecievedProtocol = [];
                    arrRecievedProtocol.push(...inCommingMsg);
                    strRecivedProtocol = protocolToString(Buffer.from(arrRecievedProtocol.splice(0, arrRecievedProtocol.length - 2), 'utf8'))
                    strRecivedProtocol = strRecivedProtocol.replace(/\s+/g, ' ').trim();
                    let strChecksome = protocolToString(Buffer.from(arrRecievedProtocol.splice(arrRecievedProtocol.length - 2, 1), 'utf8'))
                    let strDecryptProtocol = await encdecAlgo.decrypt(strRecivedProtocol);
                    //objClsLogger.protocolLogFromIDS(strDecryptProtocol,info.address);
                    // 2) Appending Checksome
                    strDecryptProtocol = strDecryptProtocol + strChecksome;
                    var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , From IDS : " + info.address + " : " + strDecryptProtocol;
                    console.log(logQ);

                    //commented by vivek on 31-07-2020********************************
                    //logFromPC.info(logQ);
                    //logFromPC.addtoProtocolLog(logQ)
                    //************************************************************** */

                    //console.log('Incoming msg1', strDecryptProtocol,info.address)
                    protocolHandlerController.handleProtocol(strDecryptProtocol, info.address);


                } else if (strRecivedProtocol.substring(0, 1) == '~') {
                    var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , From IDS " + info.address + " To PC:" + serverConfig.host + " ~";
                    //commented by vivek on 31-07-2020********************************
                    // console.log(logQ)
                    //logFromPC.addtoProtocolLog(logQ)
                    //************************************************************** */

                    var tempCountObj = globalData.arrCommunication.find(k => k.IdsNo == parseInt(info.address.split('.')[3]));
                    // console.log(tempCountObj.QCount)
                    if (tempCountObj != undefined) {
                        tempCountObj.QCount = 0
                    }
                } else if(strRecivedProtocol.substring(0, 1) == '!'){
                    //  console.log(strRecivedProtocol);
                    //  var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , From IDS : " + info.address + " : " + strRecivedProtocol;
                    // console.log(logQ);
                     let idsNo = info.address.split('.')[3];
                    var oldProtocolData = globalData.arrOldProtocol.find(k => k.IdsNo == idsNo);
                    console.log(`! received from IDS ${idsNo} for => ${oldProtocolData.protocolRecived}`);
                    protocolHandlerController.sendProtocol(oldProtocolData.Response, info.address);

                    var tempCountObj = globalData.arrCommunication.find(k => k.IdsNo == parseInt(info.address.split('.')[3]));
                    // console.log(tempCountObj.QCount)
                    if (tempCountObj != undefined) {
                        tempCountObj.QCount = 0
                    }
                }
            } else {
                var protocol = "!";
                var arrNackProtocol = [];
                arrNackProtocol.push(...Buffer.from(protocol, 'utf8'))
                let result = await checksum.getCheckSumBuffer(arrNackProtocol)
                protocol = result;
                indexModule.server.send(protocol, serverConfig.port, info.address, function (error) {
                    if (error) {
                        console.log('new Error while sending ! for incorrect checksum', error)
                    }
                    else {
                        var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , (SENT)From PC : To  " + info.address + " : " + protocol + "INCORRECT CHECKSOME FOR " + checkProtocol;
                        console.log(logQ)
                        //logFromPC.addtoProtocolLog(logQ)
                    }
                });

            }

        }
        else {
            protocolHandlerController.handleProtocol(strRecivedProtocol, info.address, inCommingMsg);
            // inCommingMsg is in buffer , strRecivedProtocol is string of that buffer
        }
    } catch (err) {
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
        logError = logError + err.stack;
        ErrorLog.addToErrorLog(logError);
        throw new Error(err);
    }
}
module.exports.interface = interface;
module.exports.protocolToString = protocolToString;