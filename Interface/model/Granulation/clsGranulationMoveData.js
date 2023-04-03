const Database = require('../../database/clsQueryProcess');
const database = new Database();
const clsRemarkInComplete = require('../../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();
const IOnlinePrint = require('../../../Interfaces/IOnlinePrint.model');
const globalData = require('../../global/globalData');

const printReport = require('../Weighments/clsPrintReport');
const objPrintReport = new printReport();

const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();

const PowerBackup = require('../clsPowerBackupModel');
const clspowerbackup = new PowerBackup();
class MoveGranulationData {
    async moveGranulation(result, IdsNo) {
        var objArryaLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
        let responseObj = {};
        const checkData = {
            str_tableName: result.completeTableName,
            data: 'MAX(MstSerNo) AS SeqNo',
            condition: [
                { str_colName: 'BFGCode', value: result.incompleteData.BFGCode, comp: 'eq' },
                { str_colName: 'ProductName', value: result.incompleteData.ProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: result.incompleteData.PVersion, comp: 'eq' },
                { str_colName: 'Version', value: result.incompleteData.Version, comp: 'eq' },
                { str_colName: 'BatchNo', value: result.incompleteData.BatchNo, comp: 'eq' },
                { str_colName: 'Idsno', value: result.incompleteData.Idsno, comp: 'eq' },
            ]
        }
        let resultCompleteData = await database.select(checkData);
        var intMstSerNo;
        if (resultCompleteData[0][0].SeqNo == null) {
            intMstSerNo = 1;
        } else {
            var newMstSerNo = resultCompleteData[0][0].SeqNo + 1;
            intMstSerNo = newMstSerNo;
        }
        if (result.completeTableName == 'tbl_tab_master18' || result.completeTableName == 'tbl_cap_master18') {
            var masterCompleteDataPS = {
                str_tableName: result.completeTableName,
                data: [
                    { str_colName: 'MstSerNo', value: intMstSerNo },
                    { str_colName: 'InstruId', value: result.incompleteData.InstruId },
                    { str_colName: 'BFGCode', value: result.incompleteData.BFGCode },
                    { str_colName: 'ProductName', value: result.incompleteData.ProductName },
                    { str_colName: 'ProductType', value: result.incompleteData.ProductType },
                    { str_colName: 'Qty', value: result.incompleteData.Qty },
                    { str_colName: 'GrpQty', value: result.incompleteData.GrpQty },
                    { str_colName: 'GrpFreq', value: result.incompleteData.GrpFreq },
                    { str_colName: 'Idsno', value: result.incompleteData.Idsno },
                    { str_colName: 'CubicalNo', value: result.incompleteData.CubicalNo },
                    { str_colName: 'BalanceId', value: result.incompleteData.BalanceId },
                    { str_colName: 'BalanceNo', value: result.incompleteData.BalanceNo },
                    { str_colName: 'VernierId', value: result.incompleteData.VernierId },
                    { str_colName: 'VernierNo', value: result.incompleteData.VernierNo },
                    { str_colName: 'BatchNo', value: result.incompleteData.BatchNo },
                    { str_colName: 'UserId', value: result.incompleteData.UserId },
                    { str_colName: 'UserName', value: result.incompleteData.UserName },
                    { str_colName: 'PrDate', value: result.incompleteData.PrDate },
                    { str_colName: 'PrTime', value: result.incompleteData.PrTime },
                    { str_colName: 'PrEndDate', value: result.incompleteData.PrEndDate },
                    { str_colName: 'PrEndTime', value: result.incompleteData.PrEndTime },
                    { str_colName: 'Side', value: result.incompleteData.Side },
                    { str_colName: 'Unit', value: result.incompleteData.Unit },
                    { str_colName: 'DecimalPoint', value: result.incompleteData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: result.incompleteData.WgmtModeNo },
                    { str_colName: 'Nom', value: result.incompleteData.Nom },
                    { str_colName: 'T1NegTol', value: result.incompleteData.T1NegTol },
                    { str_colName: 'T1PosTol', value: result.incompleteData.T1PosTol },
                    { str_colName: 'T2NegTol', value: result.incompleteData.T2NegTol },
                    { str_colName: 'T2PosTol', value: result.incompleteData.T2PosTol },
                    { str_colName: 'limitOn', value: result.incompleteData.limitOn },
                    { str_colName: 'NomEmpty', value: result.incompleteData.NomEmpty },
                    { str_colName: 'T1NegEmpty', value: result.incompleteData.T1NegEmpty },
                    { str_colName: 'T1PosEmpty', value: result.incompleteData.T1PosEmpty },
                    { str_colName: 'T2NegEmpty', value: result.incompleteData.T2NegEmpty },
                    { str_colName: 'T2PosEmpty', value: result.incompleteData.T2PosEmpty },
                    { str_colName: 'NomNet', value: result.incompleteData.NomNet },
                    { str_colName: 'T1NegNet', value: result.incompleteData.T1NegNet },
                    { str_colName: 'T1PosNet', value: result.incompleteData.T1PosNet },
                    { str_colName: 'T2NegNet', value: result.incompleteData.T2NegNet },
                    { str_colName: 'T2PosNet', value: result.incompleteData.T2PosNet },
                    { str_colName: 'CubicleType', value: result.incompleteData.CubicleType },
                    { str_colName: 'ReportType', value: result.incompleteData.ReportType },
                    { str_colName: 'MachineCode', value: result.incompleteData.MachineCode },
                    { str_colName: 'MFGCode', value: result.incompleteData.MFGCode },
                    { str_colName: 'BatchSize', value: result.incompleteData.BatchSize },
                    { str_colName: 'FriabilityID', value: result.incompleteData.FriabilityID },
                    { str_colName: 'HardnessID', value: result.incompleteData.HardnessID },
                    { str_colName: 'CubicleName', value: result.incompleteData.CubicleName },
                    { str_colName: 'CubicleLocation', value: result.incompleteData.CubicleLocation },
                    { str_colName: 'RepoLabel10', value: result.incompleteData.RepoLabel10 },
                    { str_colName: 'RepoLabel11', value: result.incompleteData.RepoLabel11 },
                    { str_colName: 'RepoLabel12', value: result.incompleteData.RepoLabel12 },
                    { str_colName: 'RepoLabel13', value: result.incompleteData.RepoLabel13 },
                    { str_colName: 'PrintNo', value: result.incompleteData.PrintNo },
                    { str_colName: 'IsArchived', value: result.incompleteData.IsArchived },
                    { str_colName: 'GraphType', value: result.incompleteData.GraphType },
                    { str_colName: 'BatchComplete', value: result.incompleteData.BatchComplete },
                    { str_colName: 'PVersion', value: result.incompleteData.PVersion },
                    { str_colName: 'Version', value: result.incompleteData.Version },
                    { str_colName: 'CheckedByID', value: result.incompleteData.CheckedByID },
                    { str_colName: 'CheckedByName', value: result.incompleteData.CheckedByName },
                    { str_colName: 'CheckedByDate', value: result.incompleteData.CheckedByDate },
                    { str_colName: 'BRepSerNo', value: result.incompleteData.BRepSerNo },
                    { str_colName: 'Lot', value: result.incompleteData.Lot },
                    { str_colName: 'AppearanceDesc', value: result.incompleteData.AppearanceDesc },
                    { str_colName: 'MachineSpeed_Min', value: result.incompleteData.MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: result.incompleteData.MachineSpeed_Max },
                    { str_colName: 'GenericName', value: result.incompleteData.GenericName },
                    { str_colName: 'BMRNo', value: result.incompleteData.BMRNo }

                ]
            }
            let resultMasData = await database.save(masterCompleteDataPS);
            var lastInsertedID = resultMasData[0].insertId;

            for (const [i, v] of result.detailData.entries()) {
                const insertDetailObj = {
                    str_tableName: result.detailTableName,
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedID },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValue', value: v.DataValue },
                        { str_colName: 'DecimalPoint', value: v.DecimalPoint }
                    ]
                }

                let res = await database.save(insertDetailObj)

            }
            if (objArryaLimits['PerFine'] != undefined) {
                var str_tableName = "tbl_tab_master17";
                if (result.incompleteData.ProductType == 2) {
                    str_tableName = "tbl_cap_master17";
                }

                var masterCompleteDataFine = {
                    str_tableName: str_tableName,
                    data: [
                        { str_colName: 'MstSerNo', value: intMstSerNo },
                        { str_colName: 'InstruId', value: result.incompleteData.InstruId },
                        { str_colName: 'BFGCode', value: result.incompleteData.BFGCode },
                        { str_colName: 'ProductName', value: result.incompleteData.ProductName },
                        { str_colName: 'ProductType', value: result.incompleteData.ProductType },
                        { str_colName: 'Qty', value: result.incompleteData.Qty },
                        { str_colName: 'GrpQty', value: result.incompleteData.GrpQty },
                        { str_colName: 'GrpFreq', value: result.incompleteData.GrpFreq },
                        { str_colName: 'Idsno', value: result.incompleteData.Idsno },
                        { str_colName: 'CubicalNo', value: result.incompleteData.CubicalNo },
                        { str_colName: 'BalanceId', value: result.incompleteData.BalanceId },
                        { str_colName: 'BalanceNo', value: result.incompleteData.BalanceNo },
                        { str_colName: 'VernierId', value: result.incompleteData.VernierId },
                        { str_colName: 'VernierNo', value: result.incompleteData.VernierNo },
                        { str_colName: 'BatchNo', value: result.incompleteData.BatchNo },
                        { str_colName: 'UserId', value: result.incompleteData.UserId },
                        { str_colName: 'UserName', value: result.incompleteData.UserName },
                        { str_colName: 'PrDate', value: result.incompleteData.PrDate },
                        { str_colName: 'PrTime', value: result.incompleteData.PrTime },
                        { str_colName: 'PrEndDate', value: result.incompleteData.PrEndDate },
                        { str_colName: 'PrEndTime', value: result.incompleteData.PrEndTime },
                        { str_colName: 'Side', value: result.incompleteData.Side },
                        { str_colName: 'Unit', value: result.incompleteData.Unit },
                        { str_colName: 'DecimalPoint', value: result.incompleteData.DecimalPoint },
                        { str_colName: 'WgmtModeNo', value: result.incompleteData.WgmtModeNo },
                        { str_colName: 'Nom', value: result.incompleteData.Nom },
                        { str_colName: 'T1NegTol', value: result.incompleteData.T1NegTol },
                        { str_colName: 'T1PosTol', value: result.incompleteData.T1PosTol },
                        { str_colName: 'T2NegTol', value: result.incompleteData.T2NegTol },
                        { str_colName: 'T2PosTol', value: result.incompleteData.T2PosTol },
                        { str_colName: 'limitOn', value: result.incompleteData.limitOn },
                        { str_colName: 'NomEmpty', value: result.incompleteData.NomEmpty },
                        { str_colName: 'T1NegEmpty', value: result.incompleteData.T1NegEmpty },
                        { str_colName: 'T1PosEmpty', value: result.incompleteData.T1PosEmpty },
                        { str_colName: 'T2NegEmpty', value: result.incompleteData.T2NegEmpty },
                        { str_colName: 'T2PosEmpty', value: result.incompleteData.T2PosEmpty },
                        { str_colName: 'NomNet', value: result.incompleteData.NomNet },
                        { str_colName: 'T1NegNet', value: result.incompleteData.T1NegNet },
                        { str_colName: 'T1PosNet', value: result.incompleteData.T1PosNet },
                        { str_colName: 'T2NegNet', value: result.incompleteData.T2NegNet },
                        { str_colName: 'T2PosNet', value: result.incompleteData.T2PosNet },
                        { str_colName: 'CubicleType', value: result.incompleteData.CubicleType },
                        { str_colName: 'ReportType', value: result.incompleteData.ReportType },
                        { str_colName: 'MachineCode', value: result.incompleteData.MachineCode },
                        { str_colName: 'MFGCode', value: result.incompleteData.MFGCode },
                        { str_colName: 'BatchSize', value: result.incompleteData.BatchSize },
                        { str_colName: 'FriabilityID', value: result.incompleteData.FriabilityID },
                        { str_colName: 'HardnessID', value: result.incompleteData.HardnessID },
                        { str_colName: 'CubicleName', value: result.incompleteData.CubicleName },
                        { str_colName: 'CubicleLocation', value: result.incompleteData.CubicleLocation },
                        { str_colName: 'RepoLabel10', value: result.incompleteData.RepoLabel10 },
                        { str_colName: 'RepoLabel11', value: result.incompleteData.RepoLabel11 },
                        { str_colName: 'RepoLabel12', value: result.incompleteData.RepoLabel12 },
                        { str_colName: 'RepoLabel13', value: result.incompleteData.RepoLabel13 },
                        { str_colName: 'PrintNo', value: result.incompleteData.PrintNo },
                        { str_colName: 'IsArchived', value: result.incompleteData.IsArchived },
                        { str_colName: 'GraphType', value: result.incompleteData.GraphType },
                        { str_colName: 'BatchComplete', value: result.incompleteData.BatchComplete },
                        { str_colName: 'PVersion', value: result.incompleteData.PVersion },
                        { str_colName: 'Version', value: result.incompleteData.Version },
                        { str_colName: 'CheckedByID', value: result.incompleteData.CheckedByID },
                        { str_colName: 'CheckedByName', value: result.incompleteData.CheckedByName },
                        { str_colName: 'CheckedByDate', value: result.incompleteData.CheckedByDate },
                        { str_colName: 'BRepSerNo', value: result.incompleteData.BRepSerNo },
                        { str_colName: 'Lot', value: result.incompleteData.Lot }

                    ]
                }
                let resultFine = await database.save(masterCompleteDataFine);
                var lastInsertedFineID = resultFine[0].insertId;
                var maindata, decimaldata, k;
                //console.log(result.detailData);
                var str_tableName = "tbl_tab_detail17";
                if (result.incompleteData.ProductType == 2) {
                    str_tableName = "tbl_cap_detail17";
                }
                for (const [i, v] of result.detailData.entries()) {
                    if (v.RecSeqNo == 1) {
                        k = 1;
                        maindata = v.DataValue;
                        decimaldata = v.DecimalPoint;
                        const insertFineDetailObj = {
                            str_tableName: str_tableName,
                            data: [
                                { str_colName: 'RepSerNo', value: lastInsertedFineID },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: k },
                                { str_colName: 'DataValue', value: maindata },
                                { str_colName: 'DecimalPoint', value: decimaldata }
                            ]
                        }
                        await database.save(insertFineDetailObj);
                    }
                    else if (v.RecSeqNo == 4) {
                        k = 2;
                        maindata = v.DataValue;
                        decimaldata = v.DecimalPoint;
                        const insertFineDetailObj = {
                            str_tableName: str_tableName,
                            data: [
                                { str_colName: 'RepSerNo', value: lastInsertedFineID },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: k },
                                { str_colName: 'DataValue', value: maindata },
                                { str_colName: 'DecimalPoint', value: decimaldata }
                            ]
                        }
                        await database.save(insertFineDetailObj);
                    }


                }
            }
            const deleteIncompleteData = {
                str_tableName: result.incompleteTableName,
                condition: [
                    // { str_colName: 'BFGCode', value: result.incompleteData.BFGCode, comp: 'eq' },
                    // { str_colName: 'ProductName', value: result.incompleteData.ProductName, comp: 'eq' },
                    // { str_colName: 'PVersion', value: result.incompleteData.PVersion, comp: 'eq' },
                    // { str_colName: 'Version', value: result.incompleteData.Version, comp: 'eq' },
                    // { str_colName: 'BatchNo', value: result.incompleteData.BatchNo, comp: 'eq' },
                    // { str_colName: 'Idsno', value: result.incompleteData.Idsno, comp: 'eq' },
                    { str_colName: 'RepSerNo', value: result.incompleteData.RepSerNo, comp: 'eq' },
                ]
            }
            await database.delete(deleteIncompleteData);
            const deleteIncompleteDetailData = {
                str_tableName: result.incompletedetailTableName,
                condition: [
                    { str_colName: 'RepSerNo', value: result.incompleteData.RepSerNo, comp: 'eq' },
                ]
            }
            await objRemarkInComplete.deleteEntry(IdsNo)
            await clspowerbackup.deletePowerBackupData(IdsNo);
            await database.delete(deleteIncompleteDetailData);
            Object.assign(responseObj, { status: 'success' });


            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            if (objPrinterName.Sys_PrinterName != 'NA' && globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {
                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedID;
                objIOnlinePrint.reportOption = "Particle Size";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = result.incompleteData.UserId;
                objIOnlinePrint.username = result.incompleteData.UserName;
                objIOnlinePrint.idsNo = IdsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);


                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
                const Activity = {};
                Object.assign(Activity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + IdsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);



                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
            }

            var objUpdateValidation = {
                str_tableName: "tbl_cubical",
                data: [
                    { str_colName: 'Sys_Validation', value: 0 },
                ],
                condition: [
                    { str_colName: 'Sys_IDSNo', value: IdsNo },
                ]
            }

            await database.update(objUpdateValidation);
            return responseObj;




        }
        else {
            var masterCompleteData = {
                str_tableName: result.completeTableName,
                data: [
                    { str_colName: 'MstSerNo', value: intMstSerNo },
                    { str_colName: 'InstruId', value: result.incompleteData.InstruId },
                    { str_colName: 'BFGCode', value: result.incompleteData.BFGCode },
                    { str_colName: 'ProductName', value: result.incompleteData.ProductName },
                    { str_colName: 'ProductType', value: result.incompleteData.ProductType },
                    { str_colName: 'Qty', value: result.incompleteData.Qty },
                    { str_colName: 'GrpQty', value: result.incompleteData.GrpQty },
                    { str_colName: 'GrpFreq', value: result.incompleteData.GrpFreq },
                    { str_colName: 'Idsno', value: result.incompleteData.Idsno },
                    { str_colName: 'CubicalNo', value: result.incompleteData.CubicalNo },
                    { str_colName: 'BalanceId', value: result.incompleteData.BalanceId },
                    { str_colName: 'BalanceNo', value: result.incompleteData.BalanceNo },
                    { str_colName: 'VernierId', value: result.incompleteData.VernierId },
                    { str_colName: 'VernierNo', value: result.incompleteData.VernierNo },
                    { str_colName: 'BatchNo', value: result.incompleteData.BatchNo },
                    { str_colName: 'UserId', value: result.incompleteData.UserId },
                    { str_colName: 'UserName', value: result.incompleteData.UserName },
                    { str_colName: 'PrDate', value: result.incompleteData.PrDate },
                    { str_colName: 'PrTime', value: result.incompleteData.PrTime },
                    { str_colName: 'PrEndDate', value: result.incompleteData.PrEndDate },
                    { str_colName: 'PrEndTime', value: result.incompleteData.PrEndTime },
                    { str_colName: 'Side', value: result.incompleteData.Side },
                    { str_colName: 'Unit', value: result.incompleteData.Unit },
                    { str_colName: 'DecimalPoint', value: result.incompleteData.DecimalPoint },
                    { str_colName: 'WgmtModeNo', value: result.incompleteData.WgmtModeNo },
                    { str_colName: 'Nom', value: result.incompleteData.Nom },
                    { str_colName: 'T1NegTol', value: result.incompleteData.T1NegTol },
                    { str_colName: 'T1PosTol', value: result.incompleteData.T1PosTol },
                    { str_colName: 'T2NegTol', value: result.incompleteData.T2NegTol },
                    { str_colName: 'T2PosTol', value: result.incompleteData.T2PosTol },
                    { str_colName: 'limitOn', value: result.incompleteData.limitOn },
                    { str_colName: 'NomEmpty', value: result.incompleteData.NomEmpty },
                    { str_colName: 'T1NegEmpty', value: result.incompleteData.T1NegEmpty },
                    { str_colName: 'T1PosEmpty', value: result.incompleteData.T1PosEmpty },
                    { str_colName: 'T2NegEmpty', value: result.incompleteData.T2NegEmpty },
                    { str_colName: 'T2PosEmpty', value: result.incompleteData.T2PosEmpty },
                    { str_colName: 'NomNet', value: result.incompleteData.NomNet },
                    { str_colName: 'T1NegNet', value: result.incompleteData.T1NegNet },
                    { str_colName: 'T1PosNet', value: result.incompleteData.T1PosNet },
                    { str_colName: 'T2NegNet', value: result.incompleteData.T2NegNet },
                    { str_colName: 'T2PosNet', value: result.incompleteData.T2PosNet },
                    { str_colName: 'CubicleType', value: result.incompleteData.CubicleType },
                    { str_colName: 'ReportType', value: result.incompleteData.ReportType },
                    { str_colName: 'MachineCode', value: result.incompleteData.MachineCode },
                    { str_colName: 'MFGCode', value: result.incompleteData.MFGCode },
                    { str_colName: 'BatchSize', value: result.incompleteData.BatchSize },
                    { str_colName: 'FriabilityID', value: result.incompleteData.FriabilityID },
                    { str_colName: 'HardnessID', value: result.incompleteData.HardnessID },
                    { str_colName: 'CubicleName', value: result.incompleteData.CubicleName },
                    { str_colName: 'CubicleLocation', value: result.incompleteData.CubicleLocation },
                    { str_colName: 'RepoLabel10', value: result.incompleteData.RepoLabel10 },
                    { str_colName: 'RepoLabel11', value: result.incompleteData.RepoLabel11 },
                    { str_colName: 'RepoLabel12', value: result.incompleteData.RepoLabel12 },
                    { str_colName: 'RepoLabel13', value: result.incompleteData.RepoLabel13 },
                    { str_colName: 'PrintNo', value: result.incompleteData.PrintNo },
                    { str_colName: 'IsArchived', value: result.incompleteData.IsArchived },
                    { str_colName: 'GraphType', value: result.incompleteData.GraphType },
                    { str_colName: 'BatchComplete', value: result.incompleteData.BatchComplete },
                    { str_colName: 'PVersion', value: result.incompleteData.PVersion },
                    { str_colName: 'Version', value: result.incompleteData.Version },
                    { str_colName: 'CheckedByID', value: result.incompleteData.CheckedByID },
                    { str_colName: 'CheckedByName', value: result.incompleteData.CheckedByName },
                    { str_colName: 'CheckedByDate', value: result.incompleteData.CheckedByDate },
                    { str_colName: 'BRepSerNo', value: result.incompleteData.BRepSerNo },
                    { str_colName: 'Lot', value: result.incompleteData.Lot }

                ]
            }
            let resultMasData = await database.save(masterCompleteData);
            var lastInsertedID = resultMasData[0].insertId;

            for (const [i, v] of result.detailData.entries()) {
                const insertDetailObj = {
                    str_tableName: result.detailTableName,
                    data: [
                        { str_colName: 'RepSerNo', value: lastInsertedID },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: i + 1 },
                        { str_colName: 'DataValue', value: v.DataValue },
                        { str_colName: 'DecimalPoint', value: v.DecimalPoint }
                    ]
                }
                await database.save(insertDetailObj);
            }

            const deleteIncompleteData = {
                str_tableName: result.incompleteTableName,
                condition: [
                    // { str_colName: 'BFGCode', value: result.incompleteData.BFGCode, comp: 'eq' },
                    // { str_colName: 'ProductName', value: result.incompleteData.ProductName, comp: 'eq' },
                    // { str_colName: 'PVersion', value: result.incompleteData.PVersion, comp: 'eq' },
                    // { str_colName: 'Version', value: result.incompleteData.Version, comp: 'eq' },
                    // { str_colName: 'BatchNo', value: result.incompleteData.BatchNo, comp: 'eq' },
                    // { str_colName: 'Idsno', value: result.incompleteData.Idsno, comp: 'eq' },
                    { str_colName: 'RepSerNo', value: result.incompleteData.RepSerNo, comp: 'eq' },
                ]
            }
            await database.delete(deleteIncompleteData);
            const deleteIncompleteDetailData = {
                str_tableName: result.incompletedetailTableName,
                condition: [
                    { str_colName: 'RepSerNo', value: result.incompleteData.RepSerNo, comp: 'eq' },
                ]
            }
            await database.delete(deleteIncompleteDetailData);
            // Update Weighment is Completed
            objRemarkInComplete.deleteEntry(IdsNo)
            await clspowerbackup.deletePowerBackupData(IdsNo);
            Object.assign(responseObj, { status: 'success' });


            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            if (objPrinterName.Sys_PrinterName != 'NA' &&  globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {
                //Online Printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = lastInsertedID;
                objIOnlinePrint.reportOption = "Fine %";
                objIOnlinePrint.testType = "Regular";
                objIOnlinePrint.userId = result.incompleteData.UserId;
                objIOnlinePrint.username = result.incompleteData.UserName;
                objIOnlinePrint.idsNo = IdsNo
                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);


                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
                const Activity = {};
                Object.assign(Activity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'IDS ' + IdsNo + 'Auto Print initiated' });
                await objActivityLog.ActivityLogEntry(Activity);


                await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
            }
            var objUpdateValidation = {
                str_tableName: "tbl_cubical",
                data: [
                    { str_colName: 'Sys_Validation', value: 0 },
                ],
                condition: [
                    { str_colName: 'Sys_IDSNo', value: IdsNo },
                ]
            }
            await database.update(objUpdateValidation);
            return responseObj;


        }




    }
}
module.exports = MoveGranulationData;