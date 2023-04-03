const Database = require('../../database/clsQueryProcess');
const printReport = require('./clsPrintReport');
const IOnlinePrint = require('../../../Interfaces/IOnlinePrint.model');
const globalData = require('../../global/globalData');
const database = new Database();
const objPrintReport = new printReport();
const serverConfig = require('../../global/severConfig')
let clsGetMstSrAndSideSr = require('../Weighments/clsGetMstSrAndSideSr');
const objGetMstSrAndSideSr = new clsGetMstSrAndSideSr()
const date = require('date-and-time')
const ErrorLog = require('../clsErrorLog');
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();
class WeighmentDataTransfer {

    async saveCommonDataToComplete(resultdata, weighmentModeNo = 0, Idsno) {

        try {
            var mstSerNo = '';
            var sideNo = '';
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == Idsno);

            var objMenu = globalData.arrMultihealerMS.find(k => k.idsNo == Idsno);
            let responseObj = {};
            const checkData = {
                str_tableName: resultdata.completeTableName,
                data: 'MAX(MstSerNo) AS SeqNo',
                condition: [
                    { str_colName: 'BFGCode', value: resultdata.incompleteData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: resultdata.incompleteData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: resultdata.incompleteData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: resultdata.incompleteData.Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: resultdata.incompleteData.Idsno, comp: 'eq' },
                ]
            }
            if (ProductType.productType == 3) {
                checkData.condition.push({ str_colName: 'TestType', value: objMenu.menu, comp: 'eq' })
            }
            var resultCompleteData = await database.select(checkData);
            var intMstSerNo;
            if (resultCompleteData[0][0].SeqNo == null) {
                intMstSerNo = 1;
            } else {
                var newMstSerNo = resultCompleteData[0][0].SeqNo + 1;
                intMstSerNo = newMstSerNo;
            }


            if (resultdata.incompleteData.ReportType == 1) {// initial report
                mstSerNo = intMstSerNo;
                sideNo = 1;
            }
            else { //regular report
                var mastTableNAme = resultdata.completeTableName;
                var side = resultdata.incompleteData.Side;
                var BFGCode = resultdata.incompleteData.BFGCode;
                var ProductName = resultdata.incompleteData.ProductName;
                var PVersion = resultdata.incompleteData.PVersion;
                var Version = resultdata.incompleteData.Version;
                var Batch = resultdata.incompleteData.BatchNo
                var IdsNo = resultdata.incompleteData.Idsno;

                if (side == 'NA') {
                    mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                    sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);

                    if (weighmentModeNo == 'D')// for Differential
                    {
                        if (sideNo < 3) {
                            sideNo = sideNo + 1;
                        }
                        else {
                            sideNo = 1;
                            mstSerNo = mstSerNo + 1;
                        }
                    }
                    else {
                        if (sideNo < 10) {
                            sideNo = sideNo + 1;
                        }
                        else {
                            sideNo = 1;
                            mstSerNo = mstSerNo + 1;
                        }
                    }

                }
                else {
                    mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                    sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                    if (sideNo < 5) {
                        sideNo = sideNo + 1;
                    }
                    else {
                        sideNo = 1;
                        mstSerNo = mstSerNo + 1;
                    }
                }
            }

            var masterCompleteData = {
                str_tableName: resultdata.completeTableName,
                data: [
                    { str_colName: 'MstSerNo', value: mstSerNo },// modified by vivek on 03/04/2020
                    { str_colName: 'SideNo', value: sideNo },// added by vivek on 03/04/2020
                    { str_colName: 'InstruId', value: resultdata.incompleteData.InstruId },
                    { str_colName: 'BFGCode', value: resultdata.incompleteData.BFGCode },
                    { str_colName: 'ProductName', value: resultdata.incompleteData.ProductName },
                    { str_colName: 'ProductType', value: resultdata.incompleteData.ProductType },
                    { str_colName: 'Qty', value: resultdata.incompleteData.Qty },
                    { str_colName: 'GrpQty', value: resultdata.incompleteData.GrpQty },
                    { str_colName: 'GrpFreq', value: resultdata.incompleteData.GrpFreq },
                    { str_colName: 'Idsno', value: resultdata.incompleteData.Idsno },
                    { str_colName: 'CubicalNo', value: resultdata.incompleteData.CubicalNo },
                    { str_colName: 'BalanceId', value: resultdata.incompleteData.BalanceId },
                    { str_colName: 'BalanceNo', value: resultdata.incompleteData.BalanceNo },
                    { str_colName: 'VernierId', value: resultdata.incompleteData.VernierId },
                    { str_colName: 'VernierNo', value: resultdata.incompleteData.VernierNo },
                    { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo },
                    { str_colName: 'UserId', value: resultdata.incompleteData.UserId },
                    { str_colName: 'UserName', value: resultdata.incompleteData.UserName },
                    { str_colName: 'PrDate', value: resultdata.incompleteData.PrDate },
                    { str_colName: 'PrTime', value: resultdata.incompleteData.PrTime },
                    { str_colName: 'PrEndDate', value: resultdata.incompleteData.PrEndDate },
                    { str_colName: 'PrEndTime', value: resultdata.incompleteData.PrEndTime },
                    { str_colName: 'Side', value: (ProductType.productType == 2) ? 'NA' : resultdata.incompleteData.Side },
                    { str_colName: 'Unit', value: resultdata.incompleteData.Unit },
                    { str_colName: 'DecimalPoint', value: resultdata.incompleteData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: resultdata.incompleteData.WgmtModeNo },
                    { str_colName: 'Nom', value: resultdata.incompleteData.Nom },
                    { str_colName: 'T1NegTol', value: resultdata.incompleteData.T1NegTol },
                    { str_colName: 'T1PosTol', value: resultdata.incompleteData.T1PosTol },
                    { str_colName: 'T2NegTol', value: resultdata.incompleteData.T2NegTol },
                    { str_colName: 'T2PosTol', value: resultdata.incompleteData.T2PosTol },
                    { str_colName: 'limitOn', value: resultdata.incompleteData.limitOn },
                    { str_colName: 'NomEmpty', value: resultdata.incompleteData.NomEmpty },
                    { str_colName: 'T1NegEmpty', value: resultdata.incompleteData.T1NegEmpty },
                    { str_colName: 'T1PosEmpty', value: resultdata.incompleteData.T1PosEmpty },
                    { str_colName: 'T2NegEmpty', value: resultdata.incompleteData.T2NegEmpty },
                    { str_colName: 'T2PosEmpty', value: resultdata.incompleteData.T2PosEmpty },
                    { str_colName: 'NomNet', value: resultdata.incompleteData.NomNet },
                    { str_colName: 'T1NegNet', value: resultdata.incompleteData.T1NegNet },
                    { str_colName: 'T1PosNet', value: resultdata.incompleteData.T1PosNet },
                    { str_colName: 'T2NegNet', value: resultdata.incompleteData.T2NegNet },
                    { str_colName: 'T2PosNet', value: resultdata.incompleteData.T2PosNet },
                    { str_colName: 'CubicleType', value: resultdata.incompleteData.CubicleType },
                    { str_colName: 'ReportType', value: resultdata.incompleteData.ReportType },
                    { str_colName: 'MachineCode', value: resultdata.incompleteData.MachineCode },
                    { str_colName: 'MFGCode', value: resultdata.incompleteData.MFGCode },
                    { str_colName: 'BatchSize', value: resultdata.incompleteData.BatchSize },
                    { str_colName: 'FriabilityID', value: resultdata.incompleteData.FriabilityID },
                    { str_colName: 'HardnessID', value: resultdata.incompleteData.HardnessID },
                    { str_colName: 'CubicleName', value: resultdata.incompleteData.CubicleName },
                    { str_colName: 'CubicleLocation', value: resultdata.incompleteData.CubicleLocation },
                    { str_colName: 'RepoLabel10', value: resultdata.incompleteData.RepoLabel10 },
                    { str_colName: 'RepoLabel11', value: resultdata.incompleteData.RepoLabel11 },
                    { str_colName: 'RepoLabel12', value: resultdata.incompleteData.RepoLabel12 },
                    { str_colName: 'RepoLabel13', value: resultdata.incompleteData.RepoLabel13 },
                    { str_colName: 'RepoLabel14', value: resultdata.incompleteData.RepoLabel14 },
                    { str_colName: 'PrintNo', value: resultdata.incompleteData.PrintNo },
                    { str_colName: 'IsArchived', value: resultdata.incompleteData.IsArchived },
                    { str_colName: 'GraphType', value: resultdata.incompleteData.GraphType },
                    { str_colName: 'BatchComplete', value: resultdata.incompleteData.BatchComplete },
                    { str_colName: 'PVersion', value: resultdata.incompleteData.PVersion },
                    { str_colName: 'Version', value: resultdata.incompleteData.Version },
                    { str_colName: 'CheckedByID', value: resultdata.incompleteData.CheckedByID },
                    { str_colName: 'CheckedByName', value: resultdata.incompleteData.CheckedByName },
                    { str_colName: 'CheckedByDate', value: resultdata.incompleteData.CheckedByDate },
                    { str_colName: 'BRepSerNo', value: resultdata.incompleteData.BRepSerNo },
                    { str_colName: `T1NMTTab`, value: resultdata.incompleteData.T1NMTTab },
                    { str_colName: `Lot`, value: resultdata.incompleteData.Lot },
                    { str_colName: `Area`, value: resultdata.incompleteData.Area },
                    { str_colName: `AppearanceDesc`, value: resultdata.incompleteData.AppearanceDesc },
                    { str_colName: `MachineSpeed_Min`, value: resultdata.incompleteData.MachineSpeed_Min },
                    { str_colName: `MachineSpeed_Max`, value: resultdata.incompleteData.MachineSpeed_Max },
                    { str_colName: `GenericName`, value: resultdata.incompleteData.GenericName },
                    { str_colName: `BMRNo`, value: resultdata.incompleteData.BMRNo },


                ]
            }


            if (ProductType.productType == 3) {
                masterCompleteData.data.push({ str_colName: 'TestType', value: objMenu.menu })
            }
            if (ProductType.productType == 4 && serverConfig.ProjectName == "SunHalolGuj1" && weighmentModeNo == "D") {
                masterCompleteData.data.push(
                    { str_colName: 'T3NegNet', value: resultdata.incompleteData.T3NegNet },
                    { str_colName: 'T3PosNet', value: resultdata.incompleteData.T3PosNet },
                    { str_colName: 'GraphTypeNet', value: resultdata.incompleteData.GraphTypeNet },
                )
            }
            else if (ProductType.productType == 2 && weighmentModeNo == "D") {
                masterCompleteData.data.push(
                    { str_colName: 'limitOnEmpty', value: resultdata.incompleteData.limitOnEmpty },
                    { str_colName: 'NMTTabEmpty', value: resultdata.incompleteData.NMTTabEmpty },
                    { str_colName: 'limitOnNet', value: resultdata.incompleteData.limitOnNet },
                    { str_colName: 'NMTTabNet', value: resultdata.incompleteData.NMTTabNet },
                    { str_colName: 'GraphTypeEmpty', value: resultdata.incompleteData.GraphTypeEmpty },
                    { str_colName: 'GraphTypeNet', value: resultdata.incompleteData.GraphTypeNet },
                    { str_colName: `Content1Desc`, value: resultdata.incompleteData.Content1Desc },
                    { str_colName: `Content2Desc`, value: resultdata.incompleteData.Content2Desc },
                    { str_colName: `Content3Desc`, value: resultdata.incompleteData.Content3Desc },
                    { str_colName: `Content4Desc`, value: resultdata.incompleteData.Content4Desc },
                    { str_colName: `Content1Type`, value: resultdata.incompleteData.Content1Type },
                    { str_colName: `Content2Type`, value: resultdata.incompleteData.Content2Type },
                    { str_colName: `Content3Type`, value: resultdata.incompleteData.Content3Type },
                    { str_colName: `Content4Type`, value: resultdata.incompleteData.Content4Type },
                    { str_colName: `NomContent1`, value: resultdata.incompleteData.NomContent1 },
                    { str_colName: `T1NegContent1`, value: resultdata.incompleteData.T1NegContent1 },
                    { str_colName: `T1PosContent1`, value: resultdata.incompleteData.T1PosContent1 },
                    { str_colName: `T2NegContent1`, value: resultdata.incompleteData.T2NegContent1 },
                    { str_colName: `T2PosContent1`, value: resultdata.incompleteData.T2PosContent1 },
                    { str_colName: `limitOnContent1`, value: resultdata.incompleteData.limitOnContent1 },
                    { str_colName: `NMTTabContent1`, value: resultdata.incompleteData.NMTTabContent1 },
                    { str_colName: `NomContent2`, value: resultdata.incompleteData.NomContent2 },
                    { str_colName: `T1NegContent2`, value: resultdata.incompleteData.T1NegContent2 },
                    { str_colName: `T1PosContent2`, value: resultdata.incompleteData.T1PosContent2 },
                    { str_colName: `T2NegContent2`, value: resultdata.incompleteData.T2NegContent2 },
                    { str_colName: `T2PosContent2`, value: resultdata.incompleteData.T2PosContent2 },
                    { str_colName: `limitOnContent2`, value: resultdata.incompleteData.limitOnContent2 },
                    { str_colName: `NMTTabContent2`, value: resultdata.incompleteData.NMTTabContent2 },
                    { str_colName: `NomContent3`, value: resultdata.incompleteData.NomContent3 },
                    { str_colName: `T1NegContent3`, value: resultdata.incompleteData.T1NegContent3 },
                    { str_colName: `T1PosContent3`, value: resultdata.incompleteData.T1PosContent3 },
                    { str_colName: `T2NegContent3`, value: resultdata.incompleteData.T2NegContent3 },
                    { str_colName: `T2PosContent3`, value: resultdata.incompleteData.T2PosContent3 },
                    { str_colName: `limitOnContent3`, value: resultdata.incompleteData.limitOnContent3 },
                    { str_colName: `NMTTabContent3`, value: resultdata.incompleteData.NMTTabContent3 },
                    { str_colName: `NomContent4`, value: resultdata.incompleteData.NomContent4 },
                    { str_colName: `T1NegContent4`, value: resultdata.incompleteData.T1NegContent4 },
                    { str_colName: `T1PosContent4`, value: resultdata.incompleteData.T1PosContent4 },
                    { str_colName: `T2NegContent4`, value: resultdata.incompleteData.T2NegContent4 },
                    { str_colName: `T2PosContent4`, value: resultdata.incompleteData.T2PosContent4 },
                    { str_colName: `limitOnContent4`, value: resultdata.incompleteData.limitOnContent4 },
                    { str_colName: `NMTTabContent4`, value: resultdata.incompleteData.NMTTabContent4 },
                    { str_colName: `GraphTypeContent1`, value: resultdata.incompleteData.GraphTypeContent1 },
                    { str_colName: `GraphTypeContent2`, value: resultdata.incompleteData.GraphTypeContent2 },
                    { str_colName: `GraphTypeContent3`, value: resultdata.incompleteData.GraphTypeContent3 },
                    { str_colName: `GraphTypeContent4`, value: resultdata.incompleteData.GraphTypeContent4 },
                    { str_colName: `NoOfContent`, value: resultdata.incompleteData.NoOfContent },
                )
            }
            var resultCompleteData = await database.save(masterCompleteData)
            var lastInsertedID = resultCompleteData[0].insertId;

            var fetchMasterRecord = {
                str_tableName: masterCompleteData.str_tableName,
                data: 'MstSerNo',
                condition: [
                    { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }]
            }

            var objfetchMasterRecord = await database.select(fetchMasterRecord)

            for (const [i, v] of resultdata.detailData.entries()) {
                const insertDetailObj = {
                    str_tableName: resultdata.detailTableName,
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedID },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValue', value: v.DataValue },
                        { str_colName: 'DecimalPoint', value: v.DecimalPoint },
                        { str_colName: 'MstSerNo', value: objfetchMasterRecord[0][0].MstSerNo }
                    ]
                }
                if (ProductType.productType == 3) {
                    insertDetailObj.data.push({ str_colName: 'DataValue1', value: v.DataValue1 })
                    insertDetailObj.data.push({ str_colName: 'NetWeight', value: v.NetWeight })
                    insertDetailObj.data.push({ str_colName: 'Remark', value: v.Remark })
                } else if ((ProductType.productType == 2 || ProductType.productType == 4) && weighmentModeNo == "D") {
                    insertDetailObj.data.push({ str_colName: 'DataValue1', value: v.DataValue1 })
                    insertDetailObj.data.push({ str_colName: 'NetWeight', value: v.NetWeight })
                    insertDetailObj.data.push({ str_colName: 'Content1', value: v.Content1 })
                    insertDetailObj.data.push({ str_colName: 'Content2', value: v.Content2 })
                    insertDetailObj.data.push({ str_colName: 'Content3', value: v.Content3 })
                    insertDetailObj.data.push({ str_colName: 'Content4', value: v.Content4 })
                }
                let res = await database.save(insertDetailObj)
            }

            const deleteIncompleteData = {
                str_tableName: resultdata.incompleteTableName,
                condition: [
                    { str_colName: 'RepSerNo', value: resultdata.incompleteData.RepSerNo, comp: 'eq' },

                ]
            }
            let res = await database.delete(deleteIncompleteData)
            const deleteIncompleteDetailData = {
                str_tableName: resultdata.incompletedetailTableName,
                condition: [
                    { str_colName: 'RepSerNo', value: resultdata.incompleteData.RepSerNo, comp: 'eq' },
                ]
            }
            let res1 = await database.delete(deleteIncompleteDetailData);
            //Online Printing
            const objIOnlinePrint = new IOnlinePrint();
            objIOnlinePrint.RepSerNo = lastInsertedID;
            switch (resultdata.incompleteData.WgmtModeNo) {
                case 1:
                    objIOnlinePrint.reportOption = "Individual";
                    //calculation = true;
                    break;
                case 3:
                    ProductType.productType == 2 ? objIOnlinePrint.reportOption = "Differential" : objIOnlinePrint.reportOption = "Thickness";
                    // objIOnlinePrint.reportOption = "Thickness";
                    //calculation = true;
                    break;
                case 4:
                    objIOnlinePrint.reportOption = "Breadth";
                    //calculation = true;
                    break;
                case 5:
                    objIOnlinePrint.reportOption = "Length";
                    //calculation = true;
                    break;
                case 6:
                    objIOnlinePrint.reportOption = "Diameter";
                    // calculation = true;
                    break;
                case 9:
                    objIOnlinePrint.reportOption = "Individual Layer1";
                    //calculation = true;
                    break;
                case 11:
                    objIOnlinePrint.reportOption = "Individual Layer2";
                    //calculation = true;
                    break;
                case 7:
                    if (objMenu.menu == 'Dry Cartridge') {
                        objIOnlinePrint.reportOption = "Dry Cartridge";
                    } else if (objMenu.menu == 'Net Content') {
                        objIOnlinePrint.reportOption = "Net Content";
                    } else if (objMenu.menu == 'Dry Powder') {
                        objIOnlinePrint.reportOption = "Dry Powder";
                    }

                default:
                    break;
            }
            //print online Report for Regular only
            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == Idsno);

            if ( objPrinterName.Sys_PrinterName != 'NA' &&  globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = resultdata.incompleteData.UserId;
                objIOnlinePrint.username = resultdata.incompleteData.UserName;
                objIOnlinePrint.idsNo = Idsno
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == Idsno);



                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
                const Activity = {};
                Object.assign(Activity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + IdsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);



                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName, ProductType.productType);
            }

            Object.assign(responseObj, { status: 'success' })

            return responseObj
        } catch (err) {
            console.log("Error message : " + err);
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + err;
            logError = logError + err;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err);
        }
    }

}

module.exports = WeighmentDataTransfer;