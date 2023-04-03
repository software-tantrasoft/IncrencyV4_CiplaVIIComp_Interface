var request = require('request');
var OPCURL = "http://192.168.1.113:39320/iotgateway/write";
var logFromPC = require('../clsLogger');
const date = require('date-and-time');
class OPC {

  async exportToOPC_Balance(strBalanceId, objBalValues) {
    var arrBal = [];

    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".test", "v": objBalValues.strTest });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".productName", "v": objBalValues.strProductName });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".StartTime", "v": objBalValues.strStartTime });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".NoOfSample", "v": objBalValues.intNos });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".batchNo", "v": objBalValues.strBatchNo });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".side", "v": objBalValues.strSide });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".maximum.grp", "v": objBalValues.intMaximumGrp });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".minimum.grp", "v": objBalValues.intMinimumGrp });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".average.grp", "v": objBalValues.intAverageGrp });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".maximum.indi", "v": objBalValues.intMaximumInd });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".minimum.indi", "v": objBalValues.intMinimumInd });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".average.indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".Result", "v": objBalValues.strResult });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".Endtime", "v": objBalValues.strEndTime });
    arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".Lot", "v": objBalValues.strLot });


    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        //commented by vivek on 31-07-2020********************************
        //logFromPC.info(logQ);
        //logFromPC.addtoProtocolLog(logQ)
        //************************************************************** */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + msg;
          //commented by vivek on 31-07-2020********************************
          //logFromPC.info(logQ);
          //logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : OPC Data posted successfully" + body;
          //commented by vivek on 31-07-2020********************************
          //logFromPC.info(logQ);
          //logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
}

module.exports = OPC;