const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time');
let now = new Date();
let BatchSummary = require('../Weighments/clsBatchSummaryDataTransfer');
let objBatch = new BatchSummary();
const clsRemarkInComplete = require('../../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();
const printReport = require('../Weighments/clsPrintReport');
const IOnlinePrint = require('../../../Interfaces/IOnlinePrint.model');
const globalData = require('../../global/globalData');
const ErrorLog = require('../../model/clsErrorLog');
const objPrintReport = new printReport();
let clsGetMstSrAndSideSr = require('../Weighments/clsGetMstSrAndSideSr')
const objGetMstSrAndSideSr = new clsGetMstSrAndSideSr();
const PowerBackup = require('../clsPowerBackupModel');
const clspowerbackup = new PowerBackup();

const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();

class Hardness {
    async saveHardnessData(srno, idsNo) {
        try {

            let responseObj = {};
            const getIncompleteMasterData = {
                str_tableName: 'tbl_tab_masterhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var masterData = await database.select(getIncompleteMasterData);


            var completeMastData = masterData[0][0];
            const checkMasterData = {
                str_tableName: 'tbl_tab_masterhtd',
                data: 'MAX(MstSerNo) AS SeqNo',
                condition: [
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: completeMastData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: completeMastData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: completeMastData.Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: completeMastData.Idsno, comp: 'eq' },
                ]
            }
            var result = await database.select(checkMasterData)
            var intMstSerNo;

            if (result[0][0].SeqNo == null) {
                intMstSerNo = 1;
            } else {
                var newMstSerNo = result[0][0].SeqNo + 1;
                intMstSerNo = newMstSerNo;
            }
            now = new Date();
            var masterCompleteData = {
                str_tableName: 'tbl_tab_masterhtd',
                data: [
                    { str_colName: 'MstSerNo', value: intMstSerNo },
                    { str_colName: 'InstruId', value: completeMastData.InstruId },
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode },
                    { str_colName: 'ProductName', value: completeMastData.ProductName },
                    { str_colName: 'ProductType', value: completeMastData.ProductType },
                    //{ str_colName: 'Qty', value: completeMastData.Qty },
                    //{ str_colName: 'GrpQty', value: completeMastData.GrpQty },
                    // { str_colName: 'GrpFreq', value: completeMastData.GrpFreq },
                    { str_colName: 'Idsno', value: completeMastData.Idsno },
                    { str_colName: 'CubicalNo', value: completeMastData.CubicalNo },
                    { str_colName: 'BalanceId', value: completeMastData.BalanceId },
                    //{ str_colName: 'BalanceNo', value: completeMastData.BalanceNo },
                    { str_colName: 'VernierId', value: completeMastData.VernierId },
                    //{ str_colName: 'VernierNo', value: completeMastData.VernierNo },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo },
                    { str_colName: 'UserId', value: completeMastData.UserId },
                    { str_colName: 'UserName', value: completeMastData.UserName },
                    { str_colName: 'PrDate', value: completeMastData.PrDate },
                    { str_colName: 'PrTime', value: completeMastData.PrTime },
                    { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                    { str_colName: 'Side', value: completeMastData.Side },
                    { str_colName: 'Unit', value: completeMastData.Unit },
                    { str_colName: 'Qty', value: completeMastData.Qty },
                    { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: completeMastData.WgmtModeNo },

                    { str_colName: 'CubicleType', value: completeMastData.CubicleType },
                    { str_colName: 'ReportType', value: completeMastData.ReportType },
                    { str_colName: 'MachineCode', value: completeMastData.MachineCode },
                    { str_colName: 'MFGCode', value: completeMastData.MFGCode },
                    { str_colName: 'BatchSize', value: completeMastData.BatchSize },
                    //{ str_colName: 'FriabilityID', value: completeMastData.FriabilityID },
                    { str_colName: 'HardnessID', value: completeMastData.HardnessID },
                    { str_colName: 'CubicleName', value: completeMastData.CubicleName },
                    { str_colName: 'CubicleLocation', value: completeMastData.CubicleLocation },

                    //  { str_colName: 'PrintNo', value: completeMastData.PrintNo },
                    { str_colName: 'IsArchived', value: 0 },
                    //{ str_colName: 'GraphType', value: completeMastData.GraphType },
                    //{ str_colName: 'BatchComplete', value: completeMastData.BatchComplete },
                    { str_colName: 'PVersion', value: completeMastData.PVersion },
                    { str_colName: 'Version', value: completeMastData.Version },
                    //  { str_colName: 'CheckedByID', value: completeMastData.CheckedByID },
                    //  { str_colName: 'CheckedByName', value: completeMastData.CheckedByName },
                    //  { str_colName: 'CheckedByDate', value: completeMastData.CheckedByDate },
                    //  { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'Stage', value: completeMastData.Stage },
                    { str_colName: 'ColHeadDOLOBO', value: completeMastData.ColHeadDOLOBO },

                    { str_colName: 'NomThick', value: completeMastData.NomThick },
                    { str_colName: 'PosTolThick', value: completeMastData.PosTolThick },
                    { str_colName: 'NegTolThick', value: completeMastData.NegTolThick },

                    { str_colName: 'NomHard', value: completeMastData.NomHard },
                    { str_colName: 'PosTolHard', value: completeMastData.PosTolHard },
                    { str_colName: 'NegTolHard', value: completeMastData.NegTolHard },

                    { str_colName: 'NomDOLOBO', value: completeMastData.NomDOLOBO },
                    { str_colName: 'PosTolDOLOBO', value: completeMastData.PosTolDOLOBO },
                    { str_colName: 'NegTolDOLOBO', value: completeMastData.NegTolDOLOBO },

                    { str_colName: 'GraphType', value: completeMastData.GraphType },
                    { str_colName: 'RepoLabel11', value: completeMastData.RepoLabel11 },
                    { str_colName: 'Lot', value: completeMastData.Lot },
                    { str_colName: 'Area', value: completeMastData.Area },
                    { str_colName: 'AppearanceDesc', value: completeMastData.AppearanceDesc },
                    { str_colName: 'MachineSpeed_Min', value: completeMastData.MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: completeMastData.MachineSpeed_Max },
                    { str_colName: 'GenericName', value: completeMastData.GenericName },
                    { str_colName: 'BMRNo', value: completeMastData.BMRNo }

                ]
            }
            //console.log(masterCompleteData);
            var masterSrno = await database.save(masterCompleteData)
            var lastInsertedId = masterSrno[0].insertId;
            const getIncompleteDetailData = {
                str_tableName: 'tbl_tab_detailhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var detailData = await database.select(getIncompleteDetailData)
            var completedetailData = detailData[0];

            for (const [i, v] of completedetailData.entries()) {
                const insertDetailObj = {
                    str_tableName: 'tbl_tab_detailhtd',
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedId },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValueThick', value: v.DataValueThick },
                        { str_colName: 'DataValueDOLOBO', value: v.DataValueDOLOBO },
                        { str_colName: 'DataValueHard', value: v.DataValueHard },
                        { str_colName: 'DecimalPointThick', value: v.DecimalPointThick },
                        { str_colName: 'DecimalPointDOLOBO', value: v.DecimalPointDOLOBO },
                        { str_colName: 'DecimalPointHard', value: v.DecimalPointHard },


                    ]
                }
                var res = await database.save(insertDetailObj);
            }

            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {




                await objBatch.saveBatchDataHardness(completeMastData, completedetailData, idsNo);
            }
            // clear array after successfully 


            const deleteIncompleteMasterData = {
                str_tableName: 'tbl_tab_masterhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' }
                ]
            }
            var res = await database.delete(deleteIncompleteMasterData)
            const deleteIncompleteDetailData = {
                str_tableName: 'tbl_tab_detailhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'idsNo', value: idsNo, comp: 'eq' }
                ]
            }
            await objRemarkInComplete.deleteEntry(idsNo);
            await database.delete(deleteIncompleteDetailData)

            await clspowerbackup.deletePowerBackupData(idsNo);
            Object.assign(responseObj, { status: 'success' });


            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (objPrinterName.Sys_PrinterName != 'NA' && globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {


                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedId;
                objIOnlinePrint.reportOption = "Hardness";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = completeMastData.UserId;
                objIOnlinePrint.username = completeMastData.UserName;
                objIOnlinePrint.idsNo = idsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
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

        } catch (err) {
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness", err)
        }
    }

    async saveHardnessData8M(srno, idsNo, instrument = "") {
        try {
            var mstSerNo = ''
            var sideNo = ''
            let responseObj = {};
            const getIncompleteMasterData = {
                str_tableName: 'tbl_tab_master7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var masterData = await database.select(getIncompleteMasterData)
            var completeMastData = masterData[0][0];
            const checkMasterData = {
                str_tableName: 'tbl_tab_master7',
                data: 'MAX(MstSerNo) AS SeqNo',
                condition: [
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: completeMastData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: completeMastData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: completeMastData.Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: completeMastData.Idsno, comp: 'eq' },
                ]
            }
            var result = await database.select(checkMasterData)
            var intMstSerNo;

            if (result[0][0].SeqNo == null) {
                intMstSerNo = 1;
            } else {
                var newMstSerNo = result[0][0].SeqNo + 1;
                intMstSerNo = newMstSerNo;
            }
            var mstTblName = 'tbl_tab_master7'
            if (completeMastData.ReportType == 1) {//for Initial 
                mstSerNo = intMstSerNo
                sideNo = 1
            }
            else { //regular
                if (completeMastData.Side == 'NA') {

                    mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);
                    sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);

                    if (sideNo < 10) {
                        sideNo = sideNo + 1;
                    }
                    else {
                        sideNo = 1;
                        mstSerNo = mstSerNo + 1;
                    }
                }
                else {
                    mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);
                    sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);

                    if (sideNo < 5) {
                        sideNo = sideNo + 1;
                    }
                    else {
                        sideNo = 1;
                        mstSerNo = mstSerNo + 1;
                    }
                }
            }
            now = new Date();
            var masterCompleteData = {
                str_tableName: 'tbl_tab_master7',
                data: [
                    { str_colName: 'MstSerNo', value: mstSerNo },
                    { str_colName: 'SideNo', value: sideNo },
                    { str_colName: 'InstruId', value: completeMastData.InstruId },
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode },
                    { str_colName: 'ProductName', value: completeMastData.ProductName },
                    { str_colName: 'ProductType', value: completeMastData.ProductType },
                    { str_colName: 'Qty', value: completeMastData.Qty },
                    //{ str_colName: 'GrpQty', value: completeMastData.GrpQty },
                    // { str_colName: 'GrpFreq', value: completeMastData.GrpFreq },
                    { str_colName: 'Idsno', value: completeMastData.Idsno },
                    { str_colName: 'CubicalNo', value: completeMastData.CubicalNo },
                    { str_colName: 'BalanceId', value: completeMastData.BalanceId },
                    //{ str_colName: 'BalanceNo', value: completeMastData.BalanceNo },
                    { str_colName: 'VernierId', value: completeMastData.VernierId },
                    //{ str_colName: 'VernierNo', value: completeMastData.VernierNo },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo },
                    { str_colName: 'UserId', value: completeMastData.UserId },
                    { str_colName: 'UserName', value: completeMastData.UserName },
                    { str_colName: 'PrDate', value: completeMastData.PrDate },
                    { str_colName: 'PrTime', value: completeMastData.PrTime },
                    { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                    { str_colName: 'Side', value: completeMastData.Side },
                    { str_colName: 'Unit', value: completeMastData.Unit },
                    // { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: completeMastData.WgmtModeNo },

                    { str_colName: 'Nom', value: completeMastData.Nom },
                    { str_colName: 'T1NegTol', value: completeMastData.T1NegTol },
                    { str_colName: 'T1PosTol', value: completeMastData.T1PosTol },
                    { str_colName: 'limitOn', value: completeMastData.limitOn },
                    { str_colName: 'CubicleType', value: completeMastData.CubicleType },
                    //{ str_colName: 'FriabilityID', value: completeMastData.FriabilityID },
                    { str_colName: 'ReportType', value: completeMastData.ReportType },
                    { str_colName: 'MachineCode', value: completeMastData.MachineCode },
                    { str_colName: 'BatchSize', value: completeMastData.BatchSize },

                    //  { str_colName: 'PrintNo', value: completeMastData.PrintNo },
                    { str_colName: 'HardnessID', value: completeMastData.HardnessID },
                    //{ str_colName: 'GraphType', value: completeMastData.GraphType },
                    //{ str_colName: 'BatchComplete', value: completeMastData.BatchComplete },
                    { str_colName: 'CubicleName', value: completeMastData.CubicleName },
                    { str_colName: 'CubicleLocation', value: completeMastData.CubicleLocation },
                    //  { str_colName: 'CheckedByID', value: completeMastData.CheckedByID },
                    //  { str_colName: 'CheckedByName', value: completeMastData.CheckedByName },
                    //  { str_colName: 'CheckedByDate', value: completeMastData.CheckedByDate },
                    //  { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'RepoLabel10', value: completeMastData.RepoLabel10 },
                    { str_colName: 'RepoLabel11', value: completeMastData.RepoLabel11 },

                    { str_colName: 'RepoLabel12', value: completeMastData.RepoLabel12 },
                    { str_colName: 'RepoLabel13', value: completeMastData.RepoLabel13 },
                    { str_colName: 'RepoLabel14', value: completeMastData.RepoLabel14 },
                    { str_colName: 'IsArchived', value: completeMastData.IsArchived },

                    { str_colName: 'GraphType', value: completeMastData.GraphType },
                    { str_colName: 'PVersion', value: completeMastData.PVersion },
                    { str_colName: 'Version', value: completeMastData.Version },

                    // { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'Lot', value: completeMastData.Lot },
                    { str_colName: 'Area', value: completeMastData.Area },
                    { str_colName: 'AppearanceDesc', value: completeMastData.AppearanceDesc },
                    { str_colName: 'MachineSpeed_Min', value: completeMastData.MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: completeMastData.MachineSpeed_Max },
                    { str_colName: 'GenericName', value: completeMastData.GenericName },
                    { str_colName: 'BMRNo', value: completeMastData.BMRNo },
                    { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                ]
            }
            //console.log(masterCompleteData);
            var masterSrno = await database.save(masterCompleteData)
            var lastInsertedId = masterSrno[0].insertId;
            const getIncompleteDetailData = {
                str_tableName: 'tbl_tab_detail7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                ]
            }
            var detailData = await database.select(getIncompleteDetailData)
            var completedetailData = detailData[0];
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                var remarkRes = await objBatch.saveBatchDataHardness8M(completeMastData, completedetailData, idsNo);
            }



            for (const [i, v] of completedetailData.entries()) {
                const insertDetailObj = {
                    str_tableName: 'tbl_tab_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedId },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValue', value: v.DataValue },
                        { str_colName: 'DecimalPoint', value: v.DecimalPoint }
                    ]
                }
                var res = await database.save(insertDetailObj);
            }


            const deleteIncompleteMasterData = {
                str_tableName: 'tbl_tab_master7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' }
                ]
            }
            var res = await database.delete(deleteIncompleteMasterData)
            const deleteIncompleteDetailData = {
                str_tableName: 'tbl_tab_detail7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                ]
            }
            await objRemarkInComplete.deleteEntry(idsNo);
            await database.delete(deleteIncompleteDetailData)
            await clspowerbackup.deletePowerBackupData(idsNo);
            Object.assign(responseObj, { status: 'success' })



            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (objPrinterName.Sys_PrinterName != 'NA' &&  globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {


                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedId;
                objIOnlinePrint.reportOption = "Hardness";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = completeMastData.UserId;
                objIOnlinePrint.username = completeMastData.UserName;
                objIOnlinePrint.idsNo = idsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);

                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);


                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                const Activity = {};
                Object.assign(Activity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + idsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);


                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
            }
            // on successfull insertion clear array


            if (instrument == 'TH1050S+') {
                const objHardness = globalData.arrHardnessTH1050.find(ht => ht.idsNo == idsNo);
                if (objHardness == undefined) {
                    globalData.arrHardnessTH1050.push({
                        idsNo: IdsNo,
                        arr_heading: [],
                        arr_reading: [],
                        arr_info: [],
                        extractSample: false,
                        sampleno: 0,
                        currentsampleno: 0,
                        masterEntryFlag: false,
                        capacityFlag: false
                    });
                } else {
                    objHardness.arr_heading = [];
                    objHardness.arr_reading = [];
                    objHardness.arr_info = [];
                }
            }
            else {

                var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == idsNo)
                if (tempHardnessReadings == undefined) {
                    globalData.arrHardnessDRSCPharmatron.push({ idsNo: idsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
                } else {
                    tempHardnessReadings.oc = 0;
                    tempHardnessReadings.arr = [];
                    tempHardnessReadings.capacityFlag = false;
                    tempHardnessReadings.hardnessFlag = false;
                    tempHardnessReadings.masterId = 0;
                    tempHardnessReadings.masterEntryFlag = false;
                }
            }
            return remarkRes;

        } catch (err) {
            var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == idsNo)
            if (tempHardnessReadings == undefined) {
                globalData.arrHardnessDRSCPharmatron.push({ idsNo: idsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
            } else {
                tempHardnessReadings.oc = 0;
                tempHardnessReadings.arr = [];
                tempHardnessReadings.capacityFlag = false;
                tempHardnessReadings.hardnessFlag = false;
                tempHardnessReadings.masterId = 0;
                tempHardnessReadings.masterEntryFlag = false;
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness Saving", err)
        }
    }

    async saveHardnessDataKraemer(srno, idsNo) {
        try {
            var mstSerNo = ''
            var sideNo = ''
            let responseObj = {};
            const getIncompleteMasterData = {
                str_tableName: 'tbl_tab_master7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var masterData = await database.select(getIncompleteMasterData)
            var completeMastData = masterData[0][0];
            const checkMasterData = {
                str_tableName: 'tbl_tab_master7',
                data: 'MAX(MstSerNo) AS SeqNo',
                condition: [
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: completeMastData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: completeMastData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: completeMastData.Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: completeMastData.Idsno, comp: 'eq' },
                ]
            }
            var result = await database.select(checkMasterData)
            var intMstSerNo;

            if (result[0][0].SeqNo == null) {
                intMstSerNo = 1;
            } else {
                var newMstSerNo = result[0][0].SeqNo + 1;
                intMstSerNo = newMstSerNo;
            }

            var mstTblName = 'tbl_tab_master7'
            if (completeMastData.ReportType == 1) {//for Initial 
                mstSerNo = intMstSerNo
                sideNo = 1
            }
            else { //regular
                if (completeMastData.Side == 'NA') {

                    mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);
                    sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);

                    if (sideNo < 10) {
                        sideNo = sideNo + 1;
                    }
                    else {
                        sideNo = 1;
                        mstSerNo = mstSerNo + 1;
                    }
                }
                else {
                    mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);
                    sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTblName, 0, completeMastData.Side, completeMastData.BFGCode, completeMastData.ProductName, completeMastData.PVersion, completeMastData.Version, completeMastData.BatchNo, completeMastData.Idsno);

                    if (sideNo < 5) {
                        sideNo = sideNo + 1;
                    }
                    else {
                        sideNo = 1;
                        mstSerNo = mstSerNo + 1;
                    }
                }
            }

            now = new Date();
            var masterCompleteData = {
                str_tableName: 'tbl_tab_master7',
                data: [
                    { str_colName: 'MstSerNo', value: mstSerNo },
                    { str_colName: 'SideNo', value: sideNo },
                    { str_colName: 'InstruId', value: completeMastData.InstruId },
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode },
                    { str_colName: 'ProductName', value: completeMastData.ProductName },
                    { str_colName: 'ProductType', value: completeMastData.ProductType },
                    { str_colName: 'Qty', value: completeMastData.Qty },
                    //{ str_colName: 'GrpQty', value: completeMastData.GrpQty },
                    // { str_colName: 'GrpFreq', value: completeMastData.GrpFreq },
                    { str_colName: 'Idsno', value: completeMastData.Idsno },
                    { str_colName: 'CubicalNo', value: completeMastData.CubicalNo },
                    { str_colName: 'BalanceId', value: completeMastData.BalanceId },
                    //{ str_colName: 'BalanceNo', value: completeMastData.BalanceNo },
                    { str_colName: 'VernierId', value: completeMastData.VernierId },
                    //{ str_colName: 'VernierNo', value: completeMastData.VernierNo },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo },
                    { str_colName: 'UserId', value: completeMastData.UserId },
                    { str_colName: 'UserName', value: completeMastData.UserName },
                    { str_colName: 'PrDate', value: completeMastData.PrDate },
                    { str_colName: 'PrTime', value: completeMastData.PrTime },
                    { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                    { str_colName: 'Side', value: completeMastData.Side },
                    { str_colName: 'Unit', value: completeMastData.Unit },
                    // { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: completeMastData.WgmtModeNo },

                    { str_colName: 'Nom', value: completeMastData.Nom },
                    { str_colName: 'T1NegTol', value: completeMastData.T1NegTol },
                    { str_colName: 'T1PosTol', value: completeMastData.T1PosTol },
                    { str_colName: 'limitOn', value: completeMastData.limitOn },
                    { str_colName: 'CubicleType', value: completeMastData.CubicleType },
                    //{ str_colName: 'FriabilityID', value: completeMastData.FriabilityID },
                    { str_colName: 'ReportType', value: completeMastData.ReportType },
                    { str_colName: 'MachineCode', value: completeMastData.MachineCode },
                    { str_colName: 'BatchSize', value: completeMastData.BatchSize },

                    //  { str_colName: 'PrintNo', value: completeMastData.PrintNo },
                    { str_colName: 'HardnessID', value: completeMastData.HardnessID },
                    //{ str_colName: 'GraphType', value: completeMastData.GraphType },
                    //{ str_colName: 'BatchComplete', value: completeMastData.BatchComplete },
                    { str_colName: 'CubicleName', value: completeMastData.CubicleName },
                    { str_colName: 'CubicleLocation', value: completeMastData.CubicleLocation },
                    //  { str_colName: 'CheckedByID', value: completeMastData.CheckedByID },
                    //  { str_colName: 'CheckedByName', value: completeMastData.CheckedByName },
                    //  { str_colName: 'CheckedByDate', value: completeMastData.CheckedByDate },
                    //  { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'RepoLabel10', value: completeMastData.RepoLabel10 },
                    { str_colName: 'RepoLabel11', value: completeMastData.RepoLabel11 },

                    { str_colName: 'RepoLabel12', value: completeMastData.RepoLabel12 },
                    { str_colName: 'RepoLabel13', value: completeMastData.RepoLabel13 },
                    { str_colName: 'RepoLabel14', value: completeMastData.RepoLabel14 },
                    { str_colName: 'IsArchived', value: completeMastData.IsArchived },

                    { str_colName: 'GraphType', value: completeMastData.GraphType },
                    { str_colName: 'PVersion', value: completeMastData.PVersion },
                    { str_colName: 'Version', value: completeMastData.Version },

                    // { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'Lot', value: completeMastData.Lot },
                    { str_colName: 'Area', value: completeMastData.Area },
                    { str_colName: 'AppearanceDesc', value: completeMastData.AppearanceDesc },
                    { str_colName: 'MachineSpeed_Min', value: completeMastData.MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: completeMastData.MachineSpeed_Max },
                    { str_colName: 'GenericName', value: completeMastData.GenericName },
                    { str_colName: 'BMRNo', value: completeMastData.BMRNo }

                ]
            }
            //console.log(masterCompleteData);
            var masterSrno = await database.save(masterCompleteData)
            var lastInsertedId = masterSrno[0].insertId;
            const getIncompleteDetailData = {
                str_tableName: 'tbl_tab_detail7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                ]
            }
            var detailData = await database.select(getIncompleteDetailData)
            var completedetailData = detailData[0];
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {




                var remarkRes = await objBatch.saveBatchDataHardnessKraemer(completeMastData, completedetailData, idsNo);
            }

            for (const [i, v] of completedetailData.entries()) {
                const insertDetailObj = {
                    str_tableName: 'tbl_tab_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedId },
                        { str_colName: 'MstSerNo', value: mstSerNo },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValue', value: v.DataValue },
                        { str_colName: 'DecimalPoint', value: v.DecimalPoint }
                    ]
                }
                var res = await database.save(insertDetailObj);
            }


            const deleteIncompleteMasterData = {
                str_tableName: 'tbl_tab_master7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' }
                ]
            }
            var res = await database.delete(deleteIncompleteMasterData)
            const deleteIncompleteDetailData = {
                str_tableName: 'tbl_tab_detail7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                ]
            }
            await objRemarkInComplete.deleteEntry(idsNo);
            await clspowerbackup.deletePowerBackupData(idsNo);
            await database.delete(deleteIncompleteDetailData)
            Object.assign(responseObj, { status: 'success' })


            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);

            if (objPrinterName.Sys_PrinterName != 'NA' &&  globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {


                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedId;
                objIOnlinePrint.reportOption = "Hardness";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = completeMastData.UserId;
                objIOnlinePrint.username = completeMastData.UserName;
                objIOnlinePrint.idsNo = idsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);


                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                const Activity = {};
                Object.assign(Activity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + idsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);


                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
            }
            // on successfull insertion clear array
            var tempHardnessReadings = globalData.arrHardnessKramer.find(k => k.idsNo == idsNo)
            if (tempHardnessReadings == undefined) {
                const obj = {
                    idsNo: IdsNo,
                    sampleNo: 0,
                    masterEntryFlag: false,
                    hardnessVal: 0,
                    opNominal: NomValue,
                    opNegTol: lowerLimit,
                    opPosTol: upperLimit,
                    arr: []
                };
                globalData.arrHardnessKramer.push(obj);
            } else {
                tempHardnessReadings.sampleNo = 0,
                    tempHardnessReadings.masterEntryFlag = false,
                    tempHardnessReadings.hardnessVal = 0,
                    tempHardnessReadings.opNominal = 0,
                    tempHardnessReadings.opNegTol = 0,
                    tempHardnessReadings.arr = [],
                    tempHardnessReadings.opPosTol = 0
            }

            let insertedToPowerBackup = globalData.arrHardnessPowerbackupFlag.find(k => k.idsNo == idsNo);
            if (insertedToPowerBackup == undefined) {
                globalData.arrHardnessPowerbackupFlag.push({ idsNo: idsNo, IsinsertedToPowerBackup: false });
            }
            else {
                insertedToPowerBackup.IsinsertedToPowerBackup = false;
            }
            return remarkRes;

        } catch (err) {
            var tempHardnessReadings = globalData.arrHardnessKramer.find(k => k.idsNo == idsNo)
            if (tempHardnessReadings == undefined) {
                const obj = {
                    idsNo: IdsNo,
                    sampleNo: 0,
                    masterEntryFlag: false,
                    hardnessVal: 0,
                    opNominal: NomValue,
                    opNegTol: lowerLimit,
                    opPosTol: upperLimit,
                    arr: []
                };
                globalData.arrHardnessKramer.push(obj);
            } else {
                tempHardnessReadings.sampleNo = 0,
                    tempHardnessReadings.masterEntryFlag = false,
                    tempHardnessReadings.hardnessVal = 0,
                    tempHardnessReadings.opNominal = 0,
                    tempHardnessReadings.opNegTol = 0,
                    tempHardnessReadings.arr = [],
                    tempHardnessReadings.opPosTol = 0
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness Saving", err)
        }
    }

    async saveHardnessDataMT50(srno, idsNo) {
        try {

            let responseObj = {};
            const getIncompleteMasterData = {
                str_tableName: 'tbl_tab_master7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var masterData = await database.select(getIncompleteMasterData)
            var completeMastData = masterData[0][0];
            const checkMasterData = {
                str_tableName: 'tbl_tab_master7',
                data: 'MAX(MstSerNo) AS SeqNo',
                condition: [
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: completeMastData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: completeMastData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: completeMastData.Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: completeMastData.Idsno, comp: 'eq' },
                ]
            }
            var result = await database.select(checkMasterData)
            var intMstSerNo;

            if (result[0][0].SeqNo == null) {
                intMstSerNo = 1;
            } else {
                var newMstSerNo = result[0][0].SeqNo + 1;
                intMstSerNo = newMstSerNo;
            }
            now = new Date();
            var masterCompleteData = {
                str_tableName: 'tbl_tab_master7',
                data: [
                    { str_colName: 'MstSerNo', value: intMstSerNo },
                    { str_colName: 'InstruId', value: completeMastData.InstruId },
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode },
                    { str_colName: 'ProductName', value: completeMastData.ProductName },
                    { str_colName: 'ProductType', value: completeMastData.ProductType },
                    { str_colName: 'Qty', value: completeMastData.Qty },
                    //{ str_colName: 'GrpQty', value: completeMastData.GrpQty },
                    // { str_colName: 'GrpFreq', value: completeMastData.GrpFreq },
                    { str_colName: 'Idsno', value: completeMastData.Idsno },
                    { str_colName: 'CubicalNo', value: completeMastData.CubicalNo },
                    { str_colName: 'BalanceId', value: completeMastData.BalanceId },
                    //{ str_colName: 'BalanceNo', value: completeMastData.BalanceNo },
                    { str_colName: 'VernierId', value: completeMastData.VernierId },
                    //{ str_colName: 'VernierNo', value: completeMastData.VernierNo },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo },
                    { str_colName: 'UserId', value: completeMastData.UserId },
                    { str_colName: 'UserName', value: completeMastData.UserName },
                    { str_colName: 'PrDate', value: completeMastData.PrDate },
                    { str_colName: 'PrTime', value: completeMastData.PrTime },
                    { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                    { str_colName: 'Side', value: completeMastData.Side },
                    { str_colName: 'Unit', value: completeMastData.Unit },
                    // { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: completeMastData.WgmtModeNo },

                    { str_colName: 'Nom', value: completeMastData.Nom },
                    { str_colName: 'T1NegTol', value: completeMastData.T1NegTol },
                    { str_colName: 'T1PosTol', value: completeMastData.T1PosTol },
                    { str_colName: 'limitOn', value: completeMastData.limitOn },
                    { str_colName: 'CubicleType', value: completeMastData.CubicleType },
                    //{ str_colName: 'FriabilityID', value: completeMastData.FriabilityID },
                    { str_colName: 'ReportType', value: completeMastData.ReportType },
                    { str_colName: 'MachineCode', value: completeMastData.MachineCode },
                    { str_colName: 'BatchSize', value: completeMastData.BatchSize },

                    //  { str_colName: 'PrintNo', value: completeMastData.PrintNo },
                    { str_colName: 'HardnessID', value: completeMastData.HardnessID },
                    //{ str_colName: 'GraphType', value: completeMastData.GraphType },
                    //{ str_colName: 'BatchComplete', value: completeMastData.BatchComplete },
                    { str_colName: 'CubicleName', value: completeMastData.CubicleName },
                    { str_colName: 'CubicleLocation', value: completeMastData.CubicleLocation },
                    //  { str_colName: 'CheckedByID', value: completeMastData.CheckedByID },
                    //  { str_colName: 'CheckedByName', value: completeMastData.CheckedByName },
                    //  { str_colName: 'CheckedByDate', value: completeMastData.CheckedByDate },
                    //  { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'RepoLabel10', value: completeMastData.RepoLabel10 },
                    { str_colName: 'RepoLabel11', value: completeMastData.RepoLabel11 },

                    { str_colName: 'RepoLabel12', value: completeMastData.RepoLabel12 },
                    { str_colName: 'RepoLabel13', value: completeMastData.RepoLabel13 },
                    { str_colName: 'IsArchived', value: completeMastData.IsArchived },

                    { str_colName: 'GraphType', value: completeMastData.GraphType },
                    { str_colName: 'PVersion', value: completeMastData.PVersion },
                    { str_colName: 'Version', value: completeMastData.Version },

                    // { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'Lot', value: completeMastData.Lot },
                    { str_colName: 'Area', value: completeMastData.Area },
                    { str_colName: 'AppearanceDesc', value: completeMastData.AppearanceDesc },
                    { str_colName: 'MachineSpeed_Min', value: completeMastData.MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: completeMastData.MachineSpeed_Max },
                    { str_colName: 'GenericName', value: completeMastData.GenericName },
                    { str_colName: 'BMRNo', value: completeMastData.BMRNo },
                    { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                    // { str_colName: 'HTMake', value: completeMastData.HTMake },
                ]
            }
            //console.log(masterCompleteData);
            var masterSrno = await database.save(masterCompleteData)
            var lastInsertedId = masterSrno[0].insertId;
            const getIncompleteDetailData = {
                str_tableName: 'tbl_tab_detail7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                ]
            }
            var detailData = await database.select(getIncompleteDetailData)
            var completedetailData = detailData[0];
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                var remarkRes = await objBatch.saveBatchDataHardnessMT50(completeMastData, completedetailData, idsNo);
            }

            for (const [i, v] of completedetailData.entries()) {
                const insertDetailObj = {
                    str_tableName: 'tbl_tab_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedId },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValue', value: v.DataValue },
                        { str_colName: 'DecimalPoint', value: v.DecimalPoint }
                    ]
                }
                var res = await database.save(insertDetailObj);
            }


            const deleteIncompleteMasterData = {
                str_tableName: 'tbl_tab_master7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' }
                ]
            }
            var res = await database.delete(deleteIncompleteMasterData)
            const deleteIncompleteDetailData = {
                str_tableName: 'tbl_tab_detail7_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                ]
            }
            // await objRemarkInComplete.deleteEntry(idsNo);
            await database.delete(deleteIncompleteDetailData)
            Object.assign(responseObj, { status: 'success' })

            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (objPrinterName.Sys_PrinterName != 'NA' &&  globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {


                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedId;
                objIOnlinePrint.reportOption = "Hardness";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = completeMastData.UserId;
                objIOnlinePrint.username = completeMastData.UserName;
                objIOnlinePrint.idsNo = idsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);


                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                const Activity = {};
                Object.assign(Activity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + idsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);


                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
            }
            // on successfull insertion clear array
            var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == idsNo)
            if (tempHardnessReadings == undefined) {
                globalData.arrHardnessDRSCPharmatron.push({ idsNo: idsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
            } else {
                tempHardnessReadings.oc = 0;
                tempHardnessReadings.arr = [];
                tempHardnessReadings.capacityFlag = false;
                tempHardnessReadings.hardnessFlag = false;
                tempHardnessReadings.masterId = 0;
                tempHardnessReadings.masterEntryFlag = false;
            }
            return remarkRes;

        } catch (err) {
            var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == idsNo)
            if (tempHardnessReadings == undefined) {
                globalData.arrHardnessDRSCPharmatron.push({ idsNo: idsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
            } else {
                tempHardnessReadings.oc = 0;
                tempHardnessReadings.arr = [];
                tempHardnessReadings.capacityFlag = false;
                tempHardnessReadings.hardnessFlag = false;
                tempHardnessReadings.masterId = 0;
                tempHardnessReadings.masterEntryFlag = false;
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness Saving", err)
        }
    }

    async saveHardnessDataST50(srno, idsNo) {
        try {

            let responseObj = {};
            const getIncompleteMasterData = {
                str_tableName: 'tbl_tab_masterhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var masterData = await database.select(getIncompleteMasterData)
            var completeMastData = masterData[0][0];
            const checkMasterData = {
                str_tableName: 'tbl_tab_masterhtd',
                data: 'MAX(MstSerNo) AS SeqNo',
                condition: [
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: completeMastData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: completeMastData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: completeMastData.Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: completeMastData.Idsno, comp: 'eq' },
                ]
            }
            var result = await database.select(checkMasterData)
            var intMstSerNo;

            if (result[0][0].SeqNo == null) {
                intMstSerNo = 1;
            } else {
                var newMstSerNo = result[0][0].SeqNo + 1;
                intMstSerNo = newMstSerNo;
            }
            now = new Date();
            var masterCompleteData = {
                str_tableName: 'tbl_tab_masterhtd',
                data: [
                    { str_colName: 'MstSerNo', value: intMstSerNo },
                    { str_colName: 'InstruId', value: completeMastData.InstruId },
                    { str_colName: 'BFGCode', value: completeMastData.BFGCode },
                    { str_colName: 'ProductName', value: completeMastData.ProductName },
                    { str_colName: 'ProductType', value: completeMastData.ProductType },
                    //{ str_colName: 'Qty', value: completeMastData.Qty },
                    //{ str_colName: 'GrpQty', value: completeMastData.GrpQty },
                    // { str_colName: 'GrpFreq', value: completeMastData.GrpFreq },
                    { str_colName: 'Idsno', value: completeMastData.Idsno },
                    { str_colName: 'CubicalNo', value: completeMastData.CubicalNo },
                    { str_colName: 'BalanceId', value: completeMastData.BalanceId },
                    //{ str_colName: 'BalanceNo', value: completeMastData.BalanceNo },
                    { str_colName: 'VernierId', value: completeMastData.VernierId },
                    //{ str_colName: 'VernierNo', value: completeMastData.VernierNo },
                    { str_colName: 'BatchNo', value: completeMastData.BatchNo },
                    { str_colName: 'UserId', value: completeMastData.UserId },
                    { str_colName: 'UserName', value: completeMastData.UserName },
                    { str_colName: 'PrDate', value: completeMastData.PrDate },
                    { str_colName: 'PrTime', value: completeMastData.PrTime },
                    { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                    { str_colName: 'Side', value: completeMastData.Side },
                    { str_colName: 'Unit', value: completeMastData.Unit },
                    { str_colName: 'Qty', value: completeMastData.Qty },
                    { str_colName: 'DecimalPoint', value: completeMastData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: completeMastData.WgmtModeNo },

                    { str_colName: 'CubicleType', value: completeMastData.CubicleType },
                    { str_colName: 'ReportType', value: completeMastData.ReportType },
                    { str_colName: 'MachineCode', value: completeMastData.MachineCode },
                    { str_colName: 'MFGCode', value: completeMastData.MFGCode },
                    { str_colName: 'BatchSize', value: completeMastData.BatchSize },
                    //{ str_colName: 'FriabilityID', value: completeMastData.FriabilityID },
                    { str_colName: 'HardnessID', value: completeMastData.HardnessID },
                    { str_colName: 'CubicleName', value: completeMastData.CubicleName },
                    { str_colName: 'CubicleLocation', value: completeMastData.CubicleLocation },

                    //  { str_colName: 'PrintNo', value: completeMastData.PrintNo },
                    { str_colName: 'IsArchived', value: 0 },
                    //{ str_colName: 'GraphType', value: completeMastData.GraphType },
                    //{ str_colName: 'BatchComplete', value: completeMastData.BatchComplete },
                    { str_colName: 'PVersion', value: completeMastData.PVersion },
                    { str_colName: 'Version', value: completeMastData.Version },
                    //  { str_colName: 'CheckedByID', value: completeMastData.CheckedByID },
                    //  { str_colName: 'CheckedByName', value: completeMastData.CheckedByName },
                    //  { str_colName: 'CheckedByDate', value: completeMastData.CheckedByDate },
                    //  { str_colName: 'BRepSerNo', value: completeMastData.BRepSerNo },
                    { str_colName: 'Stage', value: completeMastData.Stage },
                    { str_colName: 'ColHeadDOLOBO', value: completeMastData.ColHeadDOLOBO },

                    { str_colName: 'NomThick', value: completeMastData.NomThick },
                    { str_colName: 'PosTolThick', value: completeMastData.PosTolThick },
                    { str_colName: 'NegTolThick', value: completeMastData.NegTolThick },

                    { str_colName: 'NomHard', value: completeMastData.NomHard },
                    { str_colName: 'PosTolHard', value: completeMastData.PosTolHard },
                    { str_colName: 'NegTolHard', value: completeMastData.NegTolHard },

                    { str_colName: 'NomDOLOBO', value: completeMastData.NomDOLOBO },
                    { str_colName: 'PosTolDOLOBO', value: completeMastData.PosTolDOLOBO },
                    { str_colName: 'NegTolDOLOBO', value: completeMastData.NegTolDOLOBO },

                    { str_colName: 'NomDiam', value: completeMastData.NomDiam },
                    { str_colName: 'PosTolDiam', value: completeMastData.PosTolDiam },
                    { str_colName: 'NegTolDiam', value: completeMastData.NegTolDiam },

                    { str_colName: 'GraphType', value: completeMastData.GraphType },
                    { str_colName: 'RepoLabel11', value: completeMastData.RepoLabel11 },
                    { str_colName: 'Lot', value: completeMastData.Lot },
                    { str_colName: 'Area', value: completeMastData.Area },
                    { str_colName: 'AppearanceDesc', value: completeMastData.AppearanceDesc },
                    { str_colName: 'MachineSpeed_Min', value: completeMastData.MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: completeMastData.MachineSpeed_Max },
                    { str_colName: 'GenericName', value: completeMastData.GenericName },
                    { str_colName: 'BMRNo', value: completeMastData.BMRNo },
                    { str_colName: 'HTMake', value: completeMastData.HTMake },
                ]
            }
            //console.log(masterCompleteData);
            var masterSrno = await database.save(masterCompleteData)
            var lastInsertedId = masterSrno[0].insertId;
            const getIncompleteDetailData = {
                str_tableName: 'tbl_tab_detailhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'idsno', value: idsNo, comp: 'eq' },
                ]
            }
            var detailData = await database.select(getIncompleteDetailData)
            var completedetailData = detailData[0];

            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {

                await objBatch.saveBatchDataHardnessST50(completeMastData, completedetailData, idsNo);

            }
            for (const [i, v] of completedetailData.entries()) {
                const insertDetailObj = {
                    str_tableName: 'tbl_tab_detailhtd',
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedId },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValueThick', value: v.DataValueThick },
                        { str_colName: 'DataValueDOLOBO', value: v.DataValueDOLOBO },
                        { str_colName: 'DataValueHard', value: v.DataValueHard },
                        { str_colName: 'DecimalPointThick', value: v.DecimalPointThick },
                        { str_colName: 'DecimalPointDOLOBO', value: v.DecimalPointDOLOBO },
                        { str_colName: 'DecimalPointHard', value: v.DecimalPointHard },
                        { str_colName: 'DataValueDiam', value: v.DataValueDiam },
                        { str_colName: 'DecimalPointDiam', value: v.DecimalPointDiam },
                    ]
                }
                var res = await database.save(insertDetailObj);
            }


            const deleteIncompleteMasterData = {
                str_tableName: 'tbl_tab_masterhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'Idsno', value: idsNo, comp: 'eq' }
                ]
            }
            var res = await database.delete(deleteIncompleteMasterData)
            const deleteIncompleteDetailData = {
                str_tableName: 'tbl_tab_detailhtd_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: srno, comp: 'eq' },
                    { str_colName: 'idsNo', value: idsNo, comp: 'eq' }
                ]
            }
            await objRemarkInComplete.deleteEntry(idsNo);
            await database.delete(deleteIncompleteDetailData)
            Object.assign(responseObj, { status: 'success' })

            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            if (objPrinterName.Sys_PrinterName != 'NA' &&  globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {


                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedId;
                objIOnlinePrint.reportOption = "Hardness";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = completeMastData.UserId;
                objIOnlinePrint.username = completeMastData.UserName;
                objIOnlinePrint.idsNo = idsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);

                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                const Activity = {};
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + idsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);

                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
            }
            return responseObj;

        } catch (err) {
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness", err)
        }
    }

    async chkHardnessDataCount(side, IdsNo, hardnessModel = '') {
        try {

            var objProductType = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            let strsql = '', strHardnessDataCount = '', strMstTblName = '', strDetTblName = '';
            if (hardnessModel == 'ST50') {
                strMstTblName = 'tbl_tab_masterhtd_incomplete';
                strDetTblName = 'tbl_tab_detailhtd_incomplete';
            }
            else {
                strMstTblName = 'tbl_tab_master7_incomplete';
                strDetTblName = 'tbl_tab_detail7_incomplete';
            }
            strsql = `select count(*) as reccount from ${strDetTblName} where RepSerNo =(SELECT MAX(RepSerNo) FROM ${strMstTblName} `
            strsql = strsql + `where BFGCode='${objProductType.Sys_BFGCode}' and ProductName= '${objProductType.Sys_ProductName}' and `
            strsql = strsql + `PVersion='${objProductType.Sys_PVersion}' and Version='${objProductType.Sys_Version}' `
            strsql = strsql + `and BatchNo = '${objProductType.Sys_Batch}' and Idsno='${IdsNo}' and side='${side}')`
            console.log('Query from chkHardnessDataCount=' + strsql)
            strHardnessDataCount = await database.execute(strsql)
            return strHardnessDataCount[0][0].reccount
        }
        catch (err) {
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            ErrorLog.addToErrorLog(logError);
            console.log("error from chkHardnessDataCount=", err)
        }
    }
}

module.exports = Hardness;


