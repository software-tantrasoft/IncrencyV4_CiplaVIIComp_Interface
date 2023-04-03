const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time');
const ClsProduct = require('../clsProductDetailModel');
const proObj = new ClsProduct();
const globalData = require('../../global/globalData');
const printReport = require('../Weighments/clsPrintReport');
const objPrintReport = new printReport();
var logFromPC = require('../../../Interface/model/clsLogger');
const ErrorLog = require('../../model/clsErrorLog');
var configForProject = require('../../global/projectName.json');
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();


class TDT {
  async saveTDTData(cubicalObj, arrTDTData, tempUserObject, IdsNo) {

    try {
      var currentCubicleInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
      if (arrTDTData.length == 17 || arrTDTData.length == 18 || arrTDTData.length == 22 || arrTDTData.length == 13 || arrTDTData.length == 19) {
        //if (arrTDTData.length == 18 || arrTDTData.length == 22 || arrTDTData.length == 19) {
        let responseObj = {};
        var count1 = 0, count2 = 0, count3 = 0, count4 = 0, vol1 = 0, vol2 = 0, vol3 = 0, vol4 = 0, add1 = 0, add2 = 0;
        var wtofSampleVal = 0, initialVolumeVal = 0, tapDensityVal = 0, compressIndexVal = 0, hausnerRatioVal = 0, finalVolume = 0;
        var model = 0, serial = 0, instru = 0;
        var diff1 = 0, diff2 = 0, diff3 = 0, unit = 0;
        var method = "";
        var BulkDensity = 0;
        var decimalPoint = 0;
        var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
        var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
        for (const key of arrTDTData) {
          if ("INVALID" in key) {
            return 'Invalid data string';
          }
          if ("modelNo" in key) {
            model = key['modelNo']
          }
          if ("serialNo" in key) {
            serial = key['serialNo']
          }
          if ("instruNo" in key) {
            instru = key['instruNo']
            if (instru.trim() == "") {
              instru = 0;
            }
          }
          if ("Method" in key) {
            method = key['Method']
          }
          if ("tapCount1" in key) {
            count1 = key['tapCount1']
          }

          if ("tapCount2" in key) {
            count2 = key['tapCount2']
          }
          if ("tapCount3" in key) {
            count3 = key['tapCount3']
          }
          if ("tapCount4" in key) {
            count4 = key['tapCount4']
          }
          if ("wtOfSample" in key) {
            wtofSampleVal = key['wtOfSample']
          }
          if ("initialVolume" in key) {
            initialVolumeVal = key['initialVolume']
          }
          if ("tapCountvol1" in key) {
            vol1 = key['tapCountvol1']
          }
          if ("tapCountvol2" in key) {
            vol2 = key['tapCountvol2']
          }
          if ("tapCountvol3" in key) {
            vol3 = key['tapCountvol3']
          }
          if ("add1" in key) {
            add1 = key['add1']
          }
          if ("add2" in key) {
            add2 = key['add2']
          }
          if ("tapDensity" in key) {
            tapDensityVal = key['tapDensity']
          }

          if ("bulkDensity" in key) {
            BulkDensity = key['bulkDensity']
          }

          if ("finalVolume" in key) {
            finalVolume = key['finalVolume']
          }

          if ("compressibilityIndex" in key) {
            compressIndexVal = key['compressibilityIndex']
          }
          if ("hausnerRatio" in key) {
            hausnerRatioVal = key['hausnerRatio']
          }
          if ("diff1" in key) {
            diff1 = key['diff1']
          }
          if ("diff2" in key) {
            diff2 = key['diff2']
          }
          if ("diff3" in key) {
            diff3 = key['diff3']
          }
          if ("unit" in key) {
            unit = key['unit']
          }
        }
        //calculating bulk density using formula
        // BulkDensity = parseFloat(wtofSampleVal / initialVolumeVal);
        // //Rounding to 2 digits
        // BulkDensity = BulkDensity.toFixed(2);
        ////////////////////////////////////////
        //calculating tapdensity using formula
        // tapDensityVal = parseFloat(wtofSampleVal / finalVolume);
        // tapDensityVal = tapDensityVal.toFixed(2);
        //////////////////////////////////////
        var arrTempSplit = wtofSampleVal.split(".");
        decimalPoint = arrTempSplit[1].length;

        let now = new Date();
        // get product parameter
        var res = await proObj.productData(cubicalObj);
        const checkData = {
          str_tableName: 'tbl_tab_tapdensity',
          data: 'MAX(MstSerNo) AS SeqNo',
          condition: [
            { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
            { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
            { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
            { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
            { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
            { str_colName: 'IDSNo', value: IdsNo, comp: 'eq' },
          ]
        }
        let result = await database.select(checkData);
        var intMstSerNo;
        if (result[0][0].SeqNo == null) {
          intMstSerNo = 1;
        } else {
          var newMstSerNo = result[0][0].SeqNo + 1;
          intMstSerNo = newMstSerNo;
        }
        var saveTDData = {
          str_tableName: 'tbl_tab_tapdensity',
          data: [
            { str_colName: 'MstSerNo', value: intMstSerNo },
            { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
            { str_colName: 'ProductType', value: ProductType.productType },
            { str_colName: 'ProductId', value: cubicalObj.Sys_BFGCode },
            { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName }, // ProductType.productType
            { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
            { str_colName: 'Version', value: cubicalObj.Sys_Version },
            { str_colName: 'InstrumentID', value: instru },
            { str_colName: 'TDensityID', value: currentCubicleInfo.Sys_TapDensityID },
            { str_colName: 'ModelNo', value: model },
            { str_colName: 'SerialNo', value: serial },
            { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
            { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
            { str_colName: 'CubicleLocation', value: cubicalObj.Sys_dept },
            { str_colName: 'CubicleName', value: cubicalObj.Sys_CubicName },
            { str_colName: 'AreaCode', value: cubicalObj.Sys_Area },
            { str_colName: 'CubicalNo', value: cubicalObj.Sys_CubicNo },
            { str_colName: 'IDSNo', value: IdsNo },
            { str_colName: 'MachineCode', value: cubicalObj.Sys_MachineCode },
            { str_colName: 'unit', value: unit },
            { str_colName: 'DecimalPoint', value: decimalPoint },

            { str_colName: 'SampleWeight', value: wtofSampleVal },
            { str_colName: 'SampleVol', value: initialVolumeVal },
            { str_colName: 'BulkDensity', value: BulkDensity },
            { str_colName: 'TapCount1', value: count1 },
            { str_colName: 'TapCount2', value: count2 },
            { str_colName: 'TapCount3', value: count3 },
            { str_colName: 'TapCount4', value: count4 },
            { str_colName: 'TapVol1', value: vol1 },
            { str_colName: 'TapVol2', value: vol2 },
            { str_colName: 'TapVol3', value: vol3 },
            { str_colName: 'TapVol4', value: add1 }, //additional tab count 1
            { str_colName: 'TapVol5', value: add2 }, //additional tab count 1
            { str_colName: 'TappedDensity', value: tapDensityVal },
            { str_colName: 'Diff1', value: diff1 },
            { str_colName: 'Diff2', value: diff2 },
            { str_colName: 'Diff3', value: diff3 },
            { str_colName: 'CompressibilityIndex', value: compressIndexVal },
            { str_colName: 'HausnerRatio', value: hausnerRatioVal },
            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
            { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
            { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
            { str_colName: 'Side', value: cubicalObj.Sys_RotaryType },
            { str_colName: 'UserId', value: tempUserObject.UserId },
            { str_colName: 'UserName', value: tempUserObject.UserName },
            //  { str_colName: 'IsArchived', value: cubicalObj.RepoLabel10 },
            //  { str_colName: 'BatchComplete', value: cubicalObj.RepoLabel11 },
            { str_colName: 'BalanceId', value: cubicalObj.Sys_BalID },
            //  { str_colName: 'PrintNo', value: cubicalObj.RepoLabel13 },
            //  { str_colName: 'Remark', value: cubicalObj.PrintNo },
            { str_colName: 'ReportType', value: cubicalObj.Sys_RptType },
            //{ str_colName: 'GraphType', value: cubicalObj.GraphType },
            //{ str_colName: 'CheckedByID', value: cubicalObj.BatchComplete },
            //{ str_colName: 'CheckedByName', value: cubicalObj.PVersion },
            //{ str_colName: 'CheckedByDate', value: cubicalObj.Version },

            { str_colName: 'CubicType', value: currentCubicleInfo.Sys_CubType },
            { str_colName: 'RepoLabel11', value: currentCubicleInfo.Sys_Validation },
            { str_colName: 'Method', value: method },
            { str_colName: 'Layer', value: res[0].IsBilayerLbl },
            { str_colName: 'Lot', value: objLotData.LotNo },
            { str_colName: 'Area', value: cubicalObj.Sys_Area },
            { str_colName: 'AppearanceDesc', value: cubicalObj.Sys_Appearance },
            { str_colName: 'MachineSpeed_Min', value: cubicalObj.Sys_MachineSpeed_Min },
            { str_colName: 'MachineSpeed_Max', value: cubicalObj.Sys_MachineSpeed_Max },
            { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
            { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
          ]
        }

        //edited by Rahu

        if (
          ((cubicalObj.Sys_CubType == "IPQC" || cubicalObj.Sys_CubType == "Granulation") &&
            (cubicalObj.Sys_CubType == "IPQC" || cubicalObj.Sys_CubType == "Capsule Filling")) ||
          (cubicalObj.Sys_Area == "Granulation" || cubicalObj.Sys_Area == "Effervescent Granulation"
            || cubicalObj.Sys_Area == "Pallet Coating" || cubicalObj.Sys_Area == "MFG-1 Blending Area" || cubicalObj.Sys_Area == "MFG-1 Processing Area" || cubicalObj.Sys_Area == "MFG-3 IPQC"
            || cubicalObj.Sys_Area == "MFG-2 Processing Area" || cubicalObj.Sys_Area == "MFG-2 Blending Area"
            || cubicalObj.Sys_Area == "MFG-8 Processing Area" || cubicalObj.Sys_Area == "MFG-8 IPQC"
            || cubicalObj.Sys_Area == "MFG-5 Capsule" || cubicalObj.Sys_Area == "MFG-6 Capsule" || cubicalObj.Sys_Area == "Pellet IPQC")
        ) {
          saveTDData.data.push({ str_colName: 'WgmtModeNo', value: 7 },
            { str_colName: 'PosTol', value: res[1].Param7_Upp },
            { str_colName: 'NegTol', value: res[1].Param7_Low },
            { str_colName: 'BulkPosTol', value: res[1].Param10_Upp },
            { str_colName: 'BulkNegTol', value: res[1].Param10_Low }
          )

        }
        else {
          saveTDData.data.push({ str_colName: 'WgmtModeNo', value: 13 },
            { str_colName: 'PosTol', value: res[1].Param13_T1Neg },
            { str_colName: 'NegTol', value: res[1].Param13_T1Neg })
        }


        //console.log(saveTDData);
        var tappedResult = await database.save(saveTDData);
        let lastInsertedId = tappedResult[0].insertId;
        Object.assign(responseObj, { status: 'success', repSerNO: lastInsertedId });
        // For Tap Density We have sent direct request to generate report
        // Online report for Tap Density
        const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
        if(objPrinterName.Sys_PrinterName != 'NA' && globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto'){
          var objOnlineReport = {
            // SelectedValue: lastInsertedId,
            // UserId: tempUserObject.UserId,
            // UserName: tempUserObject.UserName,
            // waterMark: true
            recordFrom: "Current",
            reportOption: "Tapped Density",
            reportType: "Complete",
            testType: "Regular",
            RepSerNo: lastInsertedId,
            userId: tempUserObject.UserId,
            username: tempUserObject.UserName,
            idsNo: IdsNo
          }
          // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

          // var objReport = {
          //   reportOption : 'Tapped Density',
          //   RepSerNo:lastInsertedId
          // }


          const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
          const Activity = {};
          Object.assign(Activity,
            { strUserId: tempUserObject.UserId },
            { strUserName: tempUserObject.UserName },
            { activity: 'IDS ' + IdsNo + 'Auto Print initiated' });
          await objActivityLog.ActivityLogEntry(Activity);


          await objPrintReport.generateOnlineReportAsync(objOnlineReport, objPrinterName.Sys_PrinterName);
          // await objPrintReport.printReport(objOnlineReport,objReport, objPrinterName.Sys_PrinterName);
        }
        return responseObj;
      } else {
        console.log('InValid data String');
        return 'Invalid data string';
      }
    } catch (err) {
      var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
      logError = logError + err.stack;
      //commented by vivek on 31-07-2020*********************************** */
      //ErrorLog.error(logError);
      ErrorLog.addToErrorLog(logError);
      //******************************************************************* */
      throw new Error(err)
    }


  }
}
module.exports = TDT;