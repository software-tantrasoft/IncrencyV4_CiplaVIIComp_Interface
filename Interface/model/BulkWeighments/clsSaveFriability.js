const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time');
const ClsProduct = require('../clsProductDetailModel');
const proObj = new ClsProduct();

var clsMonitor = require('../MonitorSocket/clsMonitSocket');
let BatchSummary = require('../Weighments/clsBatchSummaryDataTransfer');
let objBatch = new BatchSummary();
const printReport = require('../Weighments/clsPrintReport');
const IOnlinePrint = require('../../../Interfaces/IOnlinePrint.model');
const globalData = require('../../global/globalData');
const objPrintReport = new printReport();
const ErrorLog = require('../../model/clsErrorLog');
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();
// const clsLogger = require('../model/clsLogger');
// Creating object of each classes
const objMonitor = new clsMonitor();
class Friability {

    async saveFriability(productObj, arrFriabilityData, tempUserObject, IdsNo) {
        try {


            let responseObj = {};
            let now = new Date();
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var currentCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var tempLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var rwtAfterTest, rwtBeforeTest, nwtAfterTest, nwtBeforeTest, lwtAfterTest, lwtBeforeTest, decimalPoint;
            //productObj.Sys_RotaryType 
            var isLenghtCorrect = true;
            // console.log(arrFriabilityData)
            if (productObj.Sys_RotaryType == 'Single') {
                if (arrFriabilityData.arr.length != 2 && arrFriabilityData.arr.length != 4) {
                    isLenghtCorrect = false;
                }
            } else {
                if (arrFriabilityData.arr.length != 4) {
                    isLenghtCorrect = false;
                }
            }
            if (isLenghtCorrect == false) {
                // DM000INVALID STRING,FORMAT PLS TRY,AGAIN,,
                var msg = "DM000Invalid String,FORMAT PLS TRY,AGAIN,,,";
                Object.assign(responseObj, { status: 'fail', msg: msg });
                objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'ABORTED' } });
                var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                if (tempFriabilityObj == undefined) {
                    globalData.arrFriabilityData.push({ idsNo: IdsNo, version: undefined, arr: [] })
                } else {
                    tempFriabilityObj.arr = [];
                }
                return responseObj;
            }
            else if (objInvalid != undefined && objInvalid.Friabilitor.invalid == true) {
                objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'ABORTED' } });
                var msg = "DM000" + objInvalid.Friabilitor.invalidMsg + ",,,,";
                var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                if (tempFriabilityObj == undefined) {
                    globalData.arrFriabilityData.push({ idsNo: IdsNo, version: undefined, arr: [] })
                } else {
                    tempFriabilityObj.arr = [];
                }
                Object.assign(responseObj, { status: 'fail', msg: msg })
                return responseObj;

            } else {
                if (isNaN(parseFloat(arrFriabilityData.ActualCount)) || isNaN(parseFloat(arrFriabilityData.ActualRPM))) {
                    var msg = "DM000INVALID STRING,FORMAT PLS TRY,AGAIN,,,";
                    Object.assign(responseObj, { status: 'fail', msg: msg });
                    var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                    if (tempFriabilityObj == undefined) {
                        globalData.arrFriabilityData.push({ idsNo: IdsNo, version: undefined, arr: [] })
                    } else {
                        tempFriabilityObj.arr = [];
                    }
                    objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'ABORTED' } });
                    return responseObj;
                } else {
                    if (productObj.Sys_RotaryType == 'Single') {
                        rwtBeforeTest = 0;
                        rwtAfterTest = 0;
                        nwtAfterTest = parseFloat(arrFriabilityData.arr[1].after.replace('gm', ''));
                        nwtBeforeTest = parseFloat(arrFriabilityData.arr[0].before.replace('gm', ''));
                        lwtAfterTest = 0;
                        lwtBeforeTest = 0;
                        var arrTempSplit = arrFriabilityData.arr[1].after.replace('gm', '').split(".");
                        decimalPoint = arrTempSplit[1].length
                    }
                    else {
                        if (arrFriabilityData.version == 'V2.8') {
                            lwtBeforeTest = parseFloat(arrFriabilityData.arr[0].before.replace('gm', ''));
                            rwtBeforeTest = parseFloat(arrFriabilityData.arr[1].before1.replace('gm', ''));
                            lwtAfterTest = parseFloat(arrFriabilityData.arr[2].after.replace('gm', ''));
                            rwtAfterTest = parseFloat(arrFriabilityData.arr[3].after1.replace('gm', ''));

                            nwtBeforeTest = 0;
                            nwtAfterTest = 0;
                            var arrTempSplit = arrFriabilityData.arr[0].before.replace('gm', '').split(".");
                            decimalPoint = arrTempSplit[1].length
                        }
                        else {
                            lwtBeforeTest = parseFloat(arrFriabilityData.arr[0].before.replace('gm', ''));
                            lwtAfterTest = parseFloat(arrFriabilityData.arr[1].after.replace('gm', ''));
                            rwtAfterTest = parseFloat(arrFriabilityData.arr[3].after1.replace('gm', ''));
                            rwtBeforeTest = parseFloat(arrFriabilityData.arr[2].before1.replace('gm', ''));
                            nwtBeforeTest = 0;
                            nwtAfterTest = 0;
                            var arrTempSplit = arrFriabilityData.arr[0].before.replace('gm', '').split(".");
                            decimalPoint = arrTempSplit[1].length
                        }



                    }

                    var res = await proObj.productData(productObj)
                    const checkData = {
                        str_tableName: 'tbl_tab_friability',
                        data: 'MAX(MstSerNo) AS SeqNo',
                        condition: [
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                            { str_colName: 'IdsNo', value: IdsNo, comp: 'eq' },
                        ]
                    }

                    var result = await database.select(checkData)
                    var intMstSerNo;
                    if (result[0][0].SeqNo == null) {
                        intMstSerNo = 1;
                    } else {
                        var newMstSerNo = result[0][0].SeqNo + 1;
                        intMstSerNo = newMstSerNo;
                    }
                    var saveFriData = {
                        str_tableName: 'tbl_tab_friability',
                        data: [
                            { str_colName: 'MstSerNo', value: intMstSerNo },
                            { str_colName: 'InstruId', value: 0 },
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                            { str_colName: 'ProductType', value: ProductType.productType },
                            { str_colName: 'IdsNo', value: IdsNo },
                            { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                            { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                            { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                            //{ str_colName: 'NoOfSample', value: productObj.Sys_Batch },
                            { str_colName: 'UserId', value: tempUserObject.UserId },
                            { str_colName: 'UserName', value: tempUserObject.UserName },
                            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Side', value: productObj.Sys_RotaryType },
                            { str_colName: 'Unit', value: '%' },
                            { str_colName: 'DecimalPoint', value: decimalPoint },
                            { str_colName: 'WgmtModeNo', value: 8 },
                            { str_colName: 'FriNMTLimit', value: res[1].Param8_Nom },
                            { str_colName: 'SetCount', value: res[1].Param8_T1Neg },
                            { str_colName: 'SetRPM', value: res[1].Param8_T1Pos },
                            { str_colName: 'FriabilityQty', value: tempLimits.Friability.noOfSamples },
                            { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                            { str_colName: 'ReportType', value: productObj.Sys_RptType },
                            { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                            { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                            { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'FriabilityID', value: currentCubic.Sys_FriabID },
                            { str_colName: 'NWtBeforeTest', value: nwtBeforeTest },
                            { str_colName: 'NWtAfterTest', value: nwtAfterTest },
                            { str_colName: 'LWtBeforeTest', value: lwtBeforeTest },
                            { str_colName: 'LWtAfterTest', value: lwtAfterTest },
                            //{ str_colName: 'RHSSrNo', value: productObj.CubicleType },
                            { str_colName: 'RWtBeforeTest', value: rwtBeforeTest },
                            { str_colName: 'RWtAfterTest', value: rwtAfterTest },
                            { str_colName: 'PrintNo', value: 0 },
                            { str_colName: 'IsArchived', value: 0 },
                            //{ str_colName: 'BatchComplete', value: date.format(now, 'HH:mm:ss') },
                            //{ str_colName: 'GraphType', value: productObj.HardnessID },
                            { str_colName: 'BalanceId', value: productObj.Sys_BalID },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                            { str_colName: 'Version', value: productObj.Sys_Version },
                            //{ str_colName: 'CheckedByID', value: productObj.RepoLabel11 },
                            //{ str_colName: 'CheckedByName', value: productObj.Sys_BalID },
                            //{ str_colName: 'CheckedByDate', value: productObj.RepoLabel13 },
                            //{ str_colName: 'Stage', value: productObj.PrintNo },
                            { str_colName: 'BRepSerNo', value: 0 },
                            { str_colName: 'RepoLabel11', value: currentCubic.Sys_Validation },
                            { str_colName: 'Lot', value: objLotData.LotNo },
                            { str_colName: 'ActualCount', value: arrFriabilityData.ActualCount },
                            { str_colName: 'ActualRPM', value: arrFriabilityData.ActualRPM },
                            { str_colName: 'Area', value: productObj.Sys_Area },
                            { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                            { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                            { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                            { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },


                        ]
                    }
                    //console.log(saveFriData);
                    var resultOfFri = await database.save(saveFriData);
                    var lastInsertedId = resultOfFri[0].insertId;
                    let batchSummaryObject = {
                        BFGCode: productObj.Sys_BFGCode,
                        ProductName: productObj.Sys_ProductName,
                        PVersion: productObj.Sys_PVersion,
                        Version: productObj.Sys_Version,
                        PrdType: 1,
                        CubType: productObj.Sys_CubType,
                        BatchNo: productObj.Sys_Batch,
                        Unit: productObj.Sys_BatchSizeUnit,
                        Side: productObj.Sys_RotaryType,
                        InstrumentID: currentCubic.Sys_FriabID,
                        UserId: tempUserObject.UserId,
                        UserName: tempUserObject.UserName,
                        nwtBeforeTestF: nwtBeforeTest,
                        nwtAfterTestF: nwtAfterTest,
                        lwtBeforeTestF: lwtBeforeTest,
                        lwtAfterTestF: lwtAfterTest,
                        rwtBeforeTestF: rwtBeforeTest,
                        rwtAfterTestF: rwtAfterTest,
                        Dept: productObj.Sys_dept,
                        Nom: res[1].Param8_Nom,
                        PrTime: date.format(now, 'HH:mm:ss'),
                        PrDate: date.format(now, 'YYYY-MM-DD'),
                        ReportType: 0,
                        DP: decimalPoint
                    }

                    var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                    if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {

                        await objBatch.saveBatchSummaryFriability(batchSummaryObject, IdsNo);
                    }
                    objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'COMPLETED' } });


                    Object.assign(responseObj, { status: 'success', RepSerNo: lastInsertedId });
                    
                    const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                    if (objPrinterName.Sys_PrinterName != 'NA'  && globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {


                        //Online Printing
                        const objIOnlinePrint = new IOnlinePrint();
                        objIOnlinePrint.RepSerNo = lastInsertedId;
                        objIOnlinePrint.reportOption = "Friabilator";
                        objIOnlinePrint.testType = "Regular";
                        objIOnlinePrint.userId = tempUserObject.UserId;
                        objIOnlinePrint.username = tempUserObject.UserName;
                        objIOnlinePrint.idsNo = IdsNo
                        // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);


                        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                        const Activity = {};
                        Object.assign(Activity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'IDS ' + idsNo + 'Auto Print initiated' });
                        await objActivityLog.ActivityLogEntry(Activity);


                        await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                    }
                    return responseObj;


                }
            }
        } catch (error) {
            var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
            if (tempFriabilityObj == undefined) {
                globalData.arrFriabilityData.push({ idsNo: IdsNo, version: undefined, arr: [] })
            } else {
                tempFriabilityObj.arr = [];
            }
            console.log("error from Friability", error);
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , "
            logError = logError + error.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(error);
            // return error;
        }


    }
}
module.exports = Friability;