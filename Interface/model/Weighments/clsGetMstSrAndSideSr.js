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

class GetMstSrNoAndSideSr {

    async getRegularSpaceMstSerialNo(tableName, ReportType, BFGCode, ProductName, PVersion, Version, BatchNo, Idsno) {
        try {
            const checkMasterData = {
                str_tableName: tableName,
                data: 'MAX(MstSerNo) AS MstSerNo',
                condition: [
                    { str_colName: 'BFGCode', value: BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: BatchNo, comp: 'eq' },
                    { str_colName: 'Idsno', value: Idsno, comp: 'eq' },
                    { str_colName: 'ReportType', value: ReportType, comp: 'eq' },
                ]
            }

            var objcheckMasterData = await database.select(checkMasterData)
            if (objcheckMasterData[0][0].MstSerNo != null) {
                return objcheckMasterData[0][0].MstSerNo
            }
            else {
                return 1
            }
        }
        catch (error) {
            console.log('error in getRegularSpaceMstSerialNo=' + error)
            throw new Error(error);
        }

    }

    async getRegularSpaceSideNo(tableName, ReportType, BFGCode, ProductName, PVersion, Version, BatchNo, Idsno) {

        try {
            var sqlquery = `select Max(SideNo) as SideNo from ${tableName} where BFGCode='${BFGCode}'  and `
            sqlquery = sqlquery + `ProductName='${ProductName}' and PVersion='${PVersion}' and Version='${Version}' and `
            sqlquery = sqlquery + `BatchNo='${BatchNo}' and Idsno='${Idsno}' and ReportType='${ReportType}' and MstSerNo=(`
            sqlquery = sqlquery + `select Max(MstSerNo) from ${tableName} where BFGCode='${BFGCode}'  and `
            sqlquery = sqlquery + `ProductName='${ProductName}' and PVersion='${PVersion}' and Version='${Version}' and `
            sqlquery = sqlquery + `BatchNo='${BatchNo}' and Idsno='${Idsno}' and ReportType='${ReportType}')`


            console.log(sqlquery)
            
            var objcheckSideNO = await database.execute(sqlquery)
            if (objcheckSideNO[0][0].SideNo != null) {
                return objcheckSideNO[0][0].SideNo
            }
            else {
                return 0
            }
        }
        catch (error) {
            console.log('error in getRegularSpaceSideNo=' + error)
            throw new Error(error);
        }
    }

    async getRegularLRMstSerialNo(tableName, ReportType, Side, BFGCode, ProductName, PVersion, Version, BatchNo, Idsno) {
        try {
            var selectedIds;
            // here we are selecting IDS functionality for that cubicle 
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == Idsno);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds
            } else {
                selectedIds = Idsno; // for compression and coating
            };
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

            const checkMasterData = {
                str_tableName: tableName,
                data: 'MAX(MstSerNo) AS MstSerNo',
                condition: [
                    { str_colName: 'BFGCode', value: BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: BatchNo, comp: 'eq' },
                   //{ str_colName: 'Idsno', value: Idsno, comp: 'eq' },
                    { str_colName: 'ReportType', value: ReportType, comp: 'eq' },
                    { str_colName: 'Side', value: Side, comp: 'eq' },
                    { str_colName: 'Repolabel14', value: cubicalObj.Sys_IPQCType, comp: 'eq' },//to check IPQC type
                    { str_colName: 'CubicleType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                ]
            }

            var objcheckMasterData = await database.select(checkMasterData)
            if (objcheckMasterData[0][0].MstSerNo != null) {
                return objcheckMasterData[0][0].MstSerNo
            }
            else {
                return 1
            }
        }
        catch (error) {
            console.log('error in getRegularSpaceMstSerialNo=' + error)
            throw new Error(error);
        }

    }
 
    async getRegularLRSideNo(tableName, ReportType, Side , BFGCode, ProductName, PVersion, Version, BatchNo, Idsno) {

        try {
            var selectedIds;
            // here we are selecting IDS functionality for that cubicle 
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == Idsno);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds
            } else {
                selectedIds = Idsno; // for compression and coating
            };
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

            var sqlquery = `select Max(SideNo) as SideNo from ${tableName} where BFGCode='${BFGCode}'  and `
            sqlquery = sqlquery + `ProductName='${ProductName}' and PVersion='${PVersion}' and Version='${Version}' and `
            sqlquery = sqlquery + `BatchNo='${BatchNo}' and ReportType='${ReportType}' and Side='${Side}' and Repolabel14 = '${cubicalObj.Sys_IPQCType}'`
            sqlquery = sqlquery + `and  CubicleType='${cubicalObj.Sys_CubType}' and MstSerNo=(`
            sqlquery = sqlquery + `select Max(MstSerNo) from ${tableName} where BFGCode='${BFGCode}'  and `
            sqlquery = sqlquery + `ProductName='${ProductName}' and PVersion='${PVersion}' and Version='${Version}' and `
            sqlquery = sqlquery + `BatchNo='${BatchNo}' and ReportType='${ReportType}' and Side='${Side}' and Repolabel14 = '${cubicalObj.Sys_IPQCType}' and  CubicleType='${cubicalObj.Sys_CubType}')`
            
            var objcheckSideNO = await database.execute(sqlquery)
            if (objcheckSideNO[0][0].SideNo != null) {
                return objcheckSideNO[0][0].SideNo
            }
            else {
                return 0
            }
        }
        catch (error) {
            console.log('error in getRegularSpaceSideNo=' + error)
            throw new Error(error);
        }
    }
}

module.exports = GetMstSrNoAndSideSr