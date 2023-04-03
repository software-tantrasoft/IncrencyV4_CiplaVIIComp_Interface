const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time')
const ClsProduct = require('../clsProductDetailModel');
const globalData = require('../../global/globalData');
const Decimal = require('../../middleware/calculateDP');
const IncompleteReport = require('../Weighments/clsIncompleteReport');
const WeighmentTransfer = require('../Weighments/clsWeighmentDataTransfer');
const objWeighmentTransfer = new WeighmentTransfer();
const objIncompleteReport = new IncompleteReport();
const WeighmentModel = require('../../../Interfaces/clsWeighment.model');
const objDecimal = new Decimal();
const FormulaFun = require('../Product/clsformulaFun');
const clsRemarkInComplete = require('../../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();
// Batch Summary imports
const BatchSummary = require('../Weighments/clsBatchSummaryDataTransfer');
const objBatcSummary = new BatchSummary();
const formulaFun = new FormulaFun();
const proObj = new ClsProduct();
/**
 * @class Multihaler
 */
class Multihaler {
    async saveSealedCartriage(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, maxLimit, minLimit, groupWeightVal) {
        var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
        var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
        var now = new Date();
        var actualWt = protocol.split(" ");
        var unit = actualWt[3].split("");
        var unitVal = 'gm';//unit[0];
        var newWeight = actualWt[2];
        var remark = "Complies";
        if (minLimit > parseFloat(groupWeightVal) || parseFloat(groupWeightVal) > maxLimit) {
            remark = "Not Complies";
        } else {
            remark = "Complies";
        }
        var decimalValue = await objDecimal.precision(groupWeightVal);
        var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
        var masterTable, detailTable, sideVal;
        masterTable = 'tbl_cap_master8';
        detailTable = 'tbl_cap_detail8';
        var side = actualWt[0].substring(3, 4);
        if (side == 'N') {
            sideVal = 'NA';
        }
        else if (side == 'L') {
            sideVal = 'LHS';
        }
        else if (side == 'R') {
            sideVal = 'RHS';
        }
        var res = await proObj.productData(cubicalObj);
        var paramNom = `Param2_Nom`;
        var paramT1Neg = `Param2_T1Neg`;
        var paramT1Pos = `Param2_T1Pos`;
        var paramT2Neg = `Param2_T2Neg`;
        var paramT2Pos = `Param2_T2Pos`;
        var limitNo = `Param2_LimitOn`;
        const checkData = {
            str_tableName: masterTable,
            data: 'RepSerNo,MAX(MstSerNo) AS serialNo',
            condition: [
                { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                { str_colName: 'Idsno', value: cubicalObj.Sys_IDSNo, comp: 'eq' },
            ]
        }
        let resultCompleteData = await database.select(checkData);
        var intMstSerNo;
        var noOfSample = intNos;
        var RepSerno = resultCompleteData[0][0].RepSerNo;
        if (resultCompleteData[0][0].serialNo == null) {
            intMstSerNo = 1;
        }
        else {
            var newMstSerNo = resultCompleteData[0][0].serialNo + 1;
            intMstSerNo = newMstSerNo;
        }
        if (intMstSerNo != 1) {
            var lastInsertedID = intMstSerNo;
            const checkTabDetails = {
                str_tableName: detailTable,
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: RepSerno, comp: 'eq' }
                ]
            }
            database.select(checkTabDetails).then((tabDetails) => {
                if (tabDetails[0].length > 0) {
                    const insertIncompleteDetailObj = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: RepSerno },
                            { str_colName: 'MstSerNo', value: 0 },
                            { str_colName: 'RecSeqNo', value: tabDetails[0][tabDetails[0].length - 1].RecSeqNo + 1 },
                            { str_colName: 'DataValue', value: groupWeightVal },
                            { str_colName: 'Remark', value: remark },
                            { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
                            { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
                            { str_colName: 'UserID', value: tempUserObject.UserId },
                            { str_colName: 'UserName', value: tempUserObject.UserName },
                            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'DecimalPoint', value: decimalValue },
                            { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                            { str_colName: 'Version', value: cubicalObj.Sys_Version },
                            //{ str_colName: 'Gavg', value: cubicalObj.Sys_Batch }
                        ]
                    }
                    database.save(insertIncompleteDetailObj).catch(err => console.log(err));

                    //update end date
                    const updateEndDate = {
                        str_tableName: masterTable,
                        data: [
                            { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') }
                        ],
                        condition: [
                            { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                            { str_colName: 'Idsno', value: cubicalObj.Sys_IDSNo, comp: 'eq' },
                        ]
                    }
                    database.update(updateEndDate).catch(err => console.log(err));
                }
            }).catch(err => console.log(err));
        }
        else {
            var masterCompleteData = {
                str_tableName: masterTable,
                data: [
                    { str_colName: 'MstSerNo', value: intMstSerNo },
                    { str_colName: 'InstruId', value: 1 },
                    { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
                    { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName },
                    { str_colName: 'ProductType', value: ProductType.productType },
                    { str_colName: 'Qty', value: 0 },
                    { str_colName: 'GrpQty', value: noOfSample },
                    { str_colName: 'GrpFreq', value: 0 },
                    { str_colName: 'Idsno', value: cubicalObj.Sys_IDSNo },
                    { str_colName: 'CubicalNo', value: cubicalObj.Sys_CubicNo },
                    { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                    //{ str_colName: 'BalanceNo', value: resultdata.incompleteData.BalanceNo },
                    { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                    //{ str_colName: 'VernierNo', value: resultdata.incompleteData.VernierNo },
                    { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
                    { str_colName: 'UserId', value: tempUserObject.UserId },
                    { str_colName: 'UserName', value: tempUserObject.UserName },
                    { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                    { str_colName: 'Side', value: sideVal },
                    { str_colName: 'Unit', value: unitVal },
                    { str_colName: 'DecimalPoint', value: decimalValue },
                    { str_colName: 'WgmtModeNo', value: 8 },
                    { str_colName: 'NomNet', value: res[1][paramNom] },
                    { str_colName: 'T1NegNet', value: res[1][paramT1Neg] },
                    { str_colName: 'T1PosNet', value: res[1][paramT1Pos] },
                    { str_colName: 'T2NegNet', value: res[1][paramT2Neg] },
                    { str_colName: 'T2PosNet', value: res[1][paramT2Pos] },
                    { str_colName: 'limitOn', value: res[1][limitNo].readUIntLE() },
                    // { str_colName: 'NomEmpty', value: resultdata.incompleteData.NomEmpty },
                    // { str_colName: 'T1NegEmpty', value: resultdata.incompleteData.T1NegEmpty },
                    // { str_colName: 'T1PosEmpty', value: resultdata.incompleteData.T1PosEmpty },
                    //{ str_colName: 'T2NegEmpty', value: resultdata.incompleteData.T2NegEmpty },
                    //{ str_colName: 'T2PosEmpty', value: resultdata.incompleteData.T2PosEmpty },
                    //{ str_colName: 'NomNet', value: resultdata.incompleteData.NomNet },
                    // { str_colName: 'T1NegNet', value: resultdata.incompleteData.T1NegNet },
                    // { str_colName: 'T1PosNet', value: resultdata.incompleteData.T1PosNet },
                    // { str_colName: 'T2NegNet', value: resultdata.incompleteData.T2NegNet },
                    // { str_colName: 'T2PosNet', value: resultdata.incompleteData.T2PosNet },
                    { str_colName: 'CubicleType', value: cubicalObj.Sys_CubType },
                    { str_colName: 'ReportType', value: cubicalObj.Sys_RptType },
                    { str_colName: 'MachineCode', value: cubicalObj.Sys_MachineCode },
                    { str_colName: 'MFGCode', value: cubicalObj.Sys_MfgCode },
                    { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                    { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                    { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                    { str_colName: 'CubicleName', value: cubicalObj.Sys_CubicName },
                    { str_colName: 'CubicleLocation', value: cubicalObj.Sys_dept },
                    // { str_colName: 'RepoLabel10', value: resultdata.incompleteData.RepoLabel10 },
                    // { str_colName: 'RepoLabel11', value: resultdata.incompleteData.RepoLabel11 },
                    // { str_colName: 'RepoLabel12', value: resultdata.incompleteData.RepoLabel12 },
                    // { str_colName: 'RepoLabel13', value: resultdata.incompleteData.RepoLabel13 },
                    { str_colName: 'PrintNo', value: 0 },
                    { str_colName: 'IsArchived', value: 0 },
                    // { str_colName: 'GraphType', value: res[1]['Param2_IsOnStd'].readUIntLE() },
                    { str_colName: 'BatchComplete', value: 0 },
                    { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                    { str_colName: 'Version', value: cubicalObj.Sys_Version },
                    { str_colName: 'Lot', value: objLotData.LotNo },
                    { str_colName: 'Area', value: cubicalObj.Sys_Area },
                    { str_colName: 'AppearanceDesc', value: cubicalObj.Sys_Appearance },
                    { str_colName: 'MachineSpeed_Min', value: cubicalObj.Sys_MachineSpeed_Min },
                    { str_colName: 'MachineSpeed_Max', value: cubicalObj.Sys_MachineSpeed_Max },
                    { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                    { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo }

                ]
            }
            //console.log(masterCompleteData);
            database.save(masterCompleteData).then((resultincomplete) => {
                var lastInsertedID = resultincomplete[0].insertId;
                const checkTabDetails = {
                    str_tableName: detailTable,
                    data: '*',
                    condition: [
                        { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
                    ]
                }
                database.select(checkTabDetails).then((tabDetails) => {
                    if (tabDetails[0].length == 0) {
                        const insertIncompleteDetailObj = {
                            str_tableName: detailTable,
                            data: [
                                { str_colName: 'RepSerNo', value: lastInsertedID },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: 1 },
                                { str_colName: 'DataValue', value: groupWeightVal },
                                { str_colName: 'Remark', value: remark },
                                { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
                                { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
                                { str_colName: 'UserID', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Side', value: sideVal },
                                { str_colName: 'DecimalPoint', value: decimalValue },
                                { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                                { str_colName: 'Version', value: cubicalObj.Sys_Version },
                                //{ str_colName: 'Gavg', value: cubicalObj.Sys_Batch }
                            ]
                        }
                        database.save(insertIncompleteDetailObj).catch(err => console.log(err));

                        //update end date
                        const updateEndDate = {
                            str_tableName: masterTable,
                            data: [
                                { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') }
                            ],
                            condition: [
                                { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                                { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                                { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                                { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                                { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                                { str_colName: 'Idsno', value: cubicalObj.Sys_IDSNo, comp: 'eq' },
                            ]
                        }
                        database.update(updateEndDate).catch(err => console.log(err));
                    }
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }
        return true;
    }
    async saveInCompleteMLTHR(cubicalObj, wt, intNos, typeValue, tempUserObject, IdsNo, maxLimit, minLimit) {
        var masterTable = 'tbl_cap_master7_incomplete';
        var detailTable = 'tbl_cap_detail7_incomplete';
        var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
        var objTempMultiHalerCal = globalData.arrMultiHealerCal.find(m => m.idsNo == IdsNo);
        // CALCULATION OF NET VALUE
        var netWt = objTempMultiHalerCal.dataValue2 - objTempMultiHalerCal.dataValue1;
        objTempMultiHalerCal.netWt = Number(Math.abs(netWt).toFixed(4));
        // return '+';
        var remark = "Pass";
        if (minLimit > objTempMultiHalerCal.netWt || objTempMultiHalerCal.netWt > maxLimit) {
            remark = "Fail";
        } else {
            remark = "Pass";
        }
        var objMLHRMenu = globalData.arrMultihealerMS.find(k => k.idsNo == IdsNo);
        let now = new Date();
        var actualWt = wt.split(" ");
        var side = actualWt[0].substring(4, 3);
        var actualSampleValue = actualWt[1].substring(1, 4);
        var sideValue, weight, decimalValue, actualUnit, newWeight;
        var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
        if (side == 'N') {
            sideValue = 'NA';
        } else if (side == 'L') {
            sideValue = 'LHS';
        } else if (side == 'R') {
            sideValue = 'RHS';
        }

        actualUnit = 'mg';
        var responseType = actualWt[3].split("");
        var actualResponseType = responseType[1];//here weight is check, R = repeat and N = new
        var wgt = actualWt[2];
        //to string is integer


        //below code done for individual layer 1 and layer 2
        var typeVal = typeValue;


        var noOfSample = intNos;

        if (actualSampleValue <= noOfSample) {

            var res = await proObj.productData(cubicalObj);
            var spNo = '1';
            // if (objMLHRMenu.menu == 'Net Content') {
            //     spNo = '2';
            // } else {
            //     spNo = '1';
            // }
            var paramNom = `Param${spNo}_Nom`;
            var paramT1Neg = `Param${spNo}_T1Neg`;
            var paramT1Pos = `Param${spNo}_T1Pos`;
            var paramT2Neg = `Param${spNo}_T2Neg`;
            var paramT2Pos = `Param${spNo}_T2Pos`;
            var limitNo = `Param${spNo}_LimitOn`;
            var paramNMT = `Param${spNo}_NMTTab`;
            var reportOn = `Param${spNo}_IsOnStd`;
            var paramUnit = `Param${spNo}_Unit`;
            let incomingUnit = actualWt[3].split(/N|R|r|n/)[0].toLowerCase();
            actualUnit = incomingUnit;
            let productUnit = 'mg'
            let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
            if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                    wgt = wgt / 1000; // mg->gm
                } else {
                    wgt = wgt * 1000; // mg -> gm
                }
            }

            if (wgt.toString().match(/^\d+$/)) {
                decimalValue = 0;
            }
            else {
                decimalValue = wgt[1].length
            }
            //console.log(limitNo);
            const productDetailObj = {
                str_tableName: masterTable,
                data: 'MAX(RepSerNo) AS serialNo',
                condition: [
                    { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                    { str_colName: 'TestType', value: objMLHRMenu.menu, comp: 'eq' },
                    { str_colName: 'Idsno', value: IdsNo, comp: 'eq' }
                ]
            }

            var result = await database.select(productDetailObj);
            if (result[0][0].serialNo == null || actualSampleValue == 1) {
                const insertIncompleteObj = {
                    str_tableName: masterTable,
                    data: [
                        { str_colName: 'MstSerNo', value: 1 },
                        { str_colName: 'InstruId', value: 1 },
                        { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
                        { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName },
                        { str_colName: 'ProductType', value: objProductType.productType },
                        { str_colName: 'Qty', value: noOfSample },
                        { str_colName: 'GrpQty', value: noOfSample },
                        { str_colName: 'GrpFreq', value: noOfSample },
                        { str_colName: 'Idsno', value: IdsNo },
                        { str_colName: 'CubicalNo', value: cubicalObj.Sys_CubicNo },
                        { str_colName: 'BalanceId', value: cubicalObj.Sys_BalID },
                        //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                        { str_colName: 'VernierId', value: cubicalObj.Sys_VernierID },
                        //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                        { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
                        { str_colName: 'UserId', value: tempUserObject.UserId },
                        { str_colName: 'UserName', value: tempUserObject.UserName },
                        { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                        { str_colName: 'Side', value: sideValue },
                        { str_colName: 'Unit', value: productUnit },
                        { str_colName: 'DecimalPoint', value: decimalValue },
                        { str_colName: 'WgmtModeNo', value: 7 },
                        { str_colName: 'NomNet', value: res[1][paramNom] },
                        { str_colName: 'T1NegNet', value: res[1][paramT1Neg] },
                        { str_colName: 'T1PosNet', value: res[1][paramT1Pos] },
                        { str_colName: 'T2NegNet', value: res[1][paramT2Neg] },
                        { str_colName: 'T2PosNet', value: res[1][paramT2Pos] },
                        { str_colName: 'limitOn', value: res[1][limitNo].readUIntLE() },
                        { str_colName: 'T1NMTTab', value: res[1][paramNMT] },
                        // { str_colName: 'T1NegEmpty', value:  },
                        // { str_colName: 'T1PosEmpty', value:  },
                        // { str_colName: 'T2NegEmpty', value:  },
                        // { str_colName: 'T2PosEmpty', value:  },
                        // { str_colName: 'NomNet', value:  },
                        // { str_colName: 'T1NegNet', value:  },
                        // { str_colName: 'T1PosNet', value:  },
                        // { str_colName: 'T2NegNet', value:  },
                        // { str_colName: 'T2PosNet', value:  },
                        { str_colName: 'CubicleType', value: cubicalObj.Sys_CubType },
                        { str_colName: 'ReportType', value: cubicalObj.Sys_RptType },
                        { str_colName: 'MachineCode', value: cubicalObj.Sys_MachineCode },
                        { str_colName: 'MFGCode', value: cubicalObj.Sys_MfgCode },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                        { str_colName: 'FriabilityID', value: cubicalObj.Sys_FriabID },
                        { str_colName: 'HardnessID', value: cubicalObj.Sys_HardID },
                        { str_colName: 'CubicleName', value: cubicalObj.Sys_CubicName },
                        { str_colName: 'CubicleLocation', value: cubicalObj.Sys_dept },
                        { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                        { str_colName: 'RepoLabel11', value: cubicalObj.Sys_Validation }, // this will store wether the test is validation or not 
                        { str_colName: 'PrintNo', value: 0 },
                        { str_colName: 'IsArchived', value: 0 },
                        //  { str_colName: 'GraphType', value: res[1][reportOn].readUIntLE() },
                        { str_colName: 'BatchComplete', value: 0 },
                        { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                        { str_colName: 'Version', value: cubicalObj.Sys_Version },
                        { str_colName: 'Lot', value: objLotData.LotNo },
                        { str_colName: 'TestType', value: objMLHRMenu.menu },
                        { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'AppearanceDesc', value: cubicalObj.Sys_Appearance },
                        { str_colName: 'MachineSpeed_Min', value: cubicalObj.Sys_MachineSpeed_Min },
                        { str_colName: 'MachineSpeed_Max', value: cubicalObj.Sys_MachineSpeed_Max },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },

                    ]

                }
                //console.log(insertIncompleteObj);
                var resultincomplete = await database.save(insertIncompleteObj);
                var lastInsertedID = resultincomplete[0].insertId;
                const checkTabDetails = {
                    str_tableName: detailTable,
                    data: '*',
                    condition: [
                        { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
                    ]
                }
                var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == IdsNo);
                if (tempObj == undefined) {
                    globalData.arrIncompleteRemark.push({ weighment: true, RepoSr: lastInsertedID, Type: typeVal, IdsNo: IdsNo });
                }
                else {
                    tempObj.weighment = true;
                    tempObj.RepoSr = lastInsertedID;
                    tempObj.Type = typeVal;
                    //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                }
                var tabDetails = await database.select(checkTabDetails);
                if (tabDetails[0].length == 0) {
                    const insertIncompleteDetailObj = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: lastInsertedID },
                            //  { str_colName: 'MstSerNo', value: 0 },
                            { str_colName: 'RecSeqNo', value: 1 },
                            { str_colName: 'DataValue', value: objTempMultiHalerCal.dataValue1 },
                            { str_colName: 'DataValue1', value: objTempMultiHalerCal.dataValue2 },
                            { str_colName: 'NetWeight', value: objTempMultiHalerCal.netWt },
                            { str_colName: 'DecimalPoint', value: decimalValue },
                            { str_colName: 'Remark', value: remark }
                        ]
                    }
                    var res = await database.save(insertIncompleteDetailObj);
                    return res;

                }


            } else {
                var masterSrNo = result[0][0].serialNo;
                const checkTabDetails = {
                    str_tableName: detailTable,
                    data: 'MAX(RecSeqNo) AS SeqNo',
                    condition: [
                        { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                    ]
                }
                var tabDetails = await database.select(checkTabDetails);
                var recSeqNo = tabDetails[0][0].SeqNo + 1;
                const insertIncompleteDetailObj = {
                    str_tableName: detailTable,
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        //  { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'DataValue', value: objTempMultiHalerCal.dataValue1 },
                        { str_colName: 'DataValue1', value: objTempMultiHalerCal.dataValue2 },
                        { str_colName: 'NetWeight', value: objTempMultiHalerCal.netWt },
                        { str_colName: 'DecimalPoint', value: decimalValue },
                        { str_colName: 'Remark', value: remark }
                    ]
                }
                let res = await database.save(insertIncompleteDetailObj);
                return res;

            }


        }


    }
    async saveCompleteData(intWeighmentNo, cubicalObj, typeValue, tempUserObject, IdsNo, tempLimObj, IsBalOrVer = "Balance") {
        const objWeighmentModel = new WeighmentModel();
        objWeighmentModel.strProductId = cubicalObj.Sys_BFGCode;
        objWeighmentModel.strProductName = cubicalObj.Sys_ProductName;
        objWeighmentModel.strProductVersion = cubicalObj.Sys_PVersion;
        objWeighmentModel.strVersion = cubicalObj.Sys_Version;
        objWeighmentModel.strBatch = cubicalObj.Sys_Batch;
        objWeighmentModel.intIdsNo = IdsNo;
        var inCompleteDataObj = await objIncompleteReport.getIncomepleteData(objWeighmentModel, 'tbl_cap_master7', 'tbl_cap_detail7', IdsNo);
        await objWeighmentTransfer.saveCommonDataToComplete(inCompleteDataObj, typeValue, IdsNo);
        var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
        if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
            await objBatcSummary.saveBatchDataMutlihailer(objWeighmentModel, typeValue, inCompleteDataObj, IdsNo)
        }
        await objRemarkInComplete.deleteEntry(IdsNo);
        let objMLHMenu = globalData.arrMultihealerMS.find(k => k.idsNo == IdsNo);
        let menu = objMLHMenu.menu;
        var WTGORT;
        var limitObj;
        if (menu == 'Dry Cartridge') {
            WTGORT = 'TARE WT';
            limitObj = 'DryCart';
        } else if (menu == 'Dry Powder') {
            WTGORT = 'TARE WT';
            limitObj = 'DryPwd';
        } else {
            WTGORT = 'GROSS WT';
            limitObj = 'NetCart';
        }
        // Here check for report status 
        var NMTT2 = 0;
        var NMTT1 = 0;
        var maxLimit = formulaFun.upperLimit(tempLimObj[limitObj]);
        var minLimit = formulaFun.lowerLimit(tempLimObj[limitObj]);
        for (let dobj of inCompleteDataObj.detailData) {
            if (parseFloat(minLimit) > parseFloat(dobj.NetWeight) || parseFloat(dobj.NetWeight) > parseFloat(maxLimit)) {
                NMTT2 = NMTT2 + 1;
            }
        }
        if (NMTT2 == 0 && parseFloat(tempLimObj[limitObj].T1Neg) != 0) {
            maxLimit = formulaFun.upperLimit(tempLimObj[limitObj], 'T1');
            minLimit = formulaFun.lowerLimit(tempLimObj[limitObj], 'T1');
            for (let dobj of inCompleteDataObj.detailData) {
                if (parseFloat(minLimit) > parseFloat(dobj.NetWeight) || parseFloat(dobj.NetWeight) > parseFloat(maxLimit)) {
                    NMTT1 = NMTT1 + 1;
                }
            }
        }
        if (NMTT2 != 0 || NMTT1 > tempLimObj[limitObj].NMTT1) {
            return 'LE1';
        } else {
            return 'LE0'
        }
    }
}
module.exports = Multihaler;