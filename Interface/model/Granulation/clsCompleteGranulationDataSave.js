const Database = require('../../database/clsQueryProcess');
const database = new Database();
var globalData = require('../../global/globalData')
class CompleteGranulationData {
    async saveCompleteData(cubicalObj, typeValue, tempUserObject, IdsNo) {

        //console.log('here');
        var productType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
        let responseObj = {};
        var masterTable, detailTable;
        if (typeValue == 'P') {
            if (productType.productType == 1) {
                masterTable = "tbl_tab_master18";
                detailTable = "tbl_tab_detail18";
            } else {
                masterTable = "tbl_cap_master18";
                detailTable = "tbl_cap_detail18";
            }
        }
        else {
            if (productType.productType == 1) {
                masterTable = "tbl_tab_master17";
                detailTable = "tbl_tab_detail17";
            } else {
                masterTable = "tbl_cap_master17";
                detailTable = "tbl_cap_detail17";
            }
        }
        const masterObj = {
            str_tableName: masterTable + '_incomplete',
            data: 'MAX(RepSerNo) AS serialNo',
            condition: [
                { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
            ]
        }
        //console.log("CompleteGranulationData" , cubicalObj);           
        const masterResult = await database.select(masterObj)
        var masterSrNo = masterResult[0][0].serialNo;
        const masterData = {
            str_tableName: masterTable + '_incomplete',
            data: '*',
            condition: [
                { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
            ]
        }
        let masterResultData = await database.select(masterData)
        var masterRecord = masterResultData[0][0];

        const detailData = {
            str_tableName: detailTable + '_incomplete',
            data: '*',
            condition: [
                { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
            ]
        }
        let detailResultData = await database.select(detailData)
        var detailRecord = detailResultData[0];

        Object.assign(responseObj,
            { incompleteData: masterRecord },
            { detailData: detailRecord },
            { completeTableName: masterTable },
            { detailTableName: detailTable },
            { incompleteTableName: masterTable + '_incomplete' },
            { incompletedetailTableName: detailTable + '_incomplete' })
        return responseObj;
    }
}
module.exports = CompleteGranulationData;