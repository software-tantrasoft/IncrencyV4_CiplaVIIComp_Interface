const Database = require('../../database/clsQueryProcess');
const clsIncompleteDataSave = require('../Weighments/clsIncompleteDataSave');
const clsIncompleteDataSaveDiff = require('../Weighments/clsIncompleteDataSaveForDiff');
const IncompleteReport = require('./clsIncompleteReport');
const WeighmentDataTransfer = require('./clsWeighmentDataTransfer');
const database = new Database();
const BatchSummaryDataTransfer = require('./clsBatchSummaryDataTransfer');
const BalanceOPCInterface = require('../OPC/balance.interface');
const OPC = require('../OPC/opc.model');
const clsRemarkInComplete = require('../../model/clsRemarkIncomplete');
const clsFormulafnc = require('../Product/clsformulaFun')
const objRemarkInComplete = new clsRemarkInComplete();
const objBatchSummaryDataTransfer = new BatchSummaryDataTransfer();
const date = require('date-and-time')
const printReport = require('./clsPrintReport');
const serverConfig = require('../../global/severConfig')
let now = new Date();
const objIncompleteReport = new IncompleteReport();
const objWeighmentDataTransfer = new WeighmentDataTransfer();
const objFormula = new clsFormulafnc();
const objDiffSave = new clsIncompleteDataSaveDiff()
const globalData = require('../../global/globalData');
const clsstoredProcsdure = require('../../../Interface/model/clsStoreProcedure');
const PowerBackup = require('../clsPowerBackupModel');
const objPowerbackup = new PowerBackup();
const objclsstoredProcsdure = new clsstoredProcsdure();
const objOPC = new OPC();
const MathRound = require('../../middleware/clsMathJS');
const objMathRound = new MathRound();

class Individual extends clsIncompleteDataSave {

    async saveIncompleteData(productObj, wt, intNos, typeValue, tempUserObject, IdsNo, DiffType = "NA") {
        var masterTable;
        var detailTable;
        var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)

        if (typeValue == 8) {
            masterTable = 'tbl_tab_master9_incomplete';
            detailTable = 'tbl_tab_detail9_incomplete';
        }
        else if (typeValue == 'L') {
            masterTable = 'tbl_tab_master11_incomplete';
            detailTable = 'tbl_tab_detail11_incomplete';
        }
        else if (typeValue == 'P') {
            if (objProductType.productType == 1) {
                masterTable = 'tbl_tab_master18_incomplete';
                detailTable = 'tbl_tab_detail18_incomplete';
            } else {
                masterTable = 'tbl_cap_master18_incomplete';
                detailTable = 'tbl_cap_detail18_incomplete';
            }
        }
        else {
            if (objProductType.productType == 1) {
                masterTable = 'tbl_tab_master' + typeValue + '_incomplete';
                detailTable = 'tbl_tab_detail' + typeValue + '_incomplete';
            }
            else if (objProductType.productType == 2 || objProductType.productType == 4) {
                if (typeValue == "D") {
                    masterTable = 'tbl_cap_master3_incomplete';
                    detailTable = 'tbl_cap_detail3_incomplete';
                } else {
                    masterTable = 'tbl_cap_master' + typeValue + '_incomplete';
                    detailTable = 'tbl_cap_detail' + typeValue + '_incomplete';
                }
            } else if (objProductType.productType == 5) {
                masterTable = 'tbl_tab_master19_incomplete';
                detailTable = 'tbl_tab_detail19_incomplete';
            }
        }
        if (typeValue != "D") {
            const saveRes = await this.saveData(productObj, wt, intNos, typeValue, tempUserObject, masterTable, detailTable, IdsNo, DiffType);
            return saveRes;
        } else {
            if (serverConfig.ProjectName == 'SunHalolGuj1') {
                const saveResForDiff = await objDiffSave.saveDataDiffSoftShell(productObj, wt, intNos, typeValue, tempUserObject, masterTable, detailTable, IdsNo, DiffType);
                return saveResForDiff;
            } else {
                const saveResForDiff = await objDiffSave.saveDataDiff(productObj, wt, intNos, typeValue, tempUserObject, masterTable, detailTable, IdsNo, DiffType);
                return saveResForDiff;
            }
            //saveDataDiffSoftShell

        }

    }

    async saveCompleteData(objWeighment, typeValue, IdsNo) {
        try {
            var masterTable;
            var detailTable;
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)

            if (typeValue == 8) {
                masterTable = 'tbl_tab_master9';
                detailTable = 'tbl_tab_detail9';
            }
            else if (typeValue == 'L') {
                masterTable = 'tbl_tab_master11';
                detailTable = 'tbl_tab_detail11';
            }
            else if (typeValue == 'D') {
                masterTable = 'tbl_cap_master3';
                detailTable = 'tbl_cap_detail3';
            }
            else {
                if (objProductType.productType == 1) {
                    masterTable = 'tbl_tab_master' + typeValue;
                    detailTable = 'tbl_tab_detail' + typeValue;
                }
                else if (objProductType.productType == 2 || objProductType.productType == 4) {
                    masterTable = 'tbl_cap_master' + typeValue;
                    detailTable = 'tbl_cap_detail' + typeValue;
                } else if (objProductType.productType == 5) {
                    masterTable = 'tbl_tab_master19';
                    detailTable = 'tbl_tab_detail19';
                }
            }
            let result = await objIncompleteReport.getIncomepleteData(objWeighment, masterTable, detailTable, IdsNo);
            /** beginning Code for Calculationg the Limits Based on T1 and T2 Limits*/

            if (typeValue != 'D') { // done for testing removed it afterward
                const valuesForAvg = [];
                let sum = 0;
                var ResultOfReport = `LE0`;
                var nosOfTabletForT1 = result.incompleteData.T1NMTTab;
                if (result.incompleteData.GraphType == "1") {
                    for (const val of result.detailData) {
                        valuesForAvg.push(val.DataValue);
                        sum += parseFloat(val.DataValue);
                    }

                    let avg = sum / valuesForAvg.length;
                    var dbl_lowerLimit = objFormula.lowerLimitForRemark(result.incompleteData, avg);
                    var dbl_upperLimit = objFormula.upperLimitForRemark(result.incompleteData, avg);
                } else {
                    var dbl_lowerLimit = objFormula.lowerLimitForRemark(result.incompleteData);
                    var dbl_upperLimit = objFormula.upperLimitForRemark(result.incompleteData);
                }
                var outOfLimitCount = 0;
                //For T2 calculations 
                var objForLimit = globalData.arrVernierData.find(k => k.IdsNum == IdsNo);
                var arrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                var T1Pos; // Here if in Product master T1 tolerance are not set then for REmark check only for T2 tolerances 
                switch (typeValue) {
                    case "1":
                        T1Pos = arrLimits.Individual.T1Pos;
                        break;
                    case "8":
                        var paramName = 'Ind_Layer';
                        if (serverConfig.ProjectName == "RBH") {
                            paramName = 'Ind_Empty';
                        }
                        T1Pos = arrLimits[paramName].T1Pos;
                        break;
                    case "L":
                        T1Pos = arrLimits.Ind_Layer1.T1Pos;
                        break;
                    case "3":
                        T1Pos = arrLimits.Thickness.T1Pos;
                        break;
                    case "4":
                        if (objProductType.productType == 1) {
                            T1Pos = arrLimits.Breadth.T1Pos;
                        } else {
                            T1Pos = arrLimits.Diameter.T1Pos;
                        }
                        break;
                    case "5":
                        T1Pos = arrLimits.Length.T1Pos;
                        break;
                    case "6":
                        T1Pos = arrLimits.Diameter.T1Pos;
                        break;
                    default:
                        T1Pos = 1
                }
                for (const val of result.detailData) {

                    let element = await objMathRound.roundUp(val.DataValue, result.incompleteData.DecimalPoint);
                    console.log(element);
                    if (parseFloat(element) > objMathRound.roundUp(parseFloat(dbl_upperLimit.upperLimit2), result.incompleteData.DecimalPoint) || parseFloat(element) < objMathRound.roundUp(parseFloat(dbl_lowerLimit.lowerLimit2), result.incompleteData.DecimalPoint)) {
                        outOfLimitCount += 1;
                    }
                }
                if (outOfLimitCount > 0) {
                    ResultOfReport = `LE1`;
                    objForLimit.flag = true
                    console.log("Out of Limit FROm T2")
                }

                //For T1 calculations for balance related parameter only
                // if NMT is apllicable or not i-e globalData.objNominclature.IsNMT
                if (outOfLimitCount == 0 && parseFloat(T1Pos) != 0 && globalData.objNominclature.IsNMT == 1) {
                    for (const val of result.detailData) {
                        let element = await objMathRound.roundUp(val.DataValue, result.incompleteData.DecimalPoint);
                        if (parseFloat(element) > objMathRound.roundUp(parseFloat(dbl_upperLimit.upperLimit1), result.incompleteData.DecimalPoint) ||
                            parseFloat(element) < objMathRound.roundUp(parseFloat(dbl_lowerLimit.lowerLimit1), result.incompleteData.DecimalPoint)) {
                            outOfLimitCount += 1;
                        }
                    }
                    if (outOfLimitCount > nosOfTabletForT1) {
                        ResultOfReport = `LE1`;
                        objForLimit.flag = true
                        console.log("Out of Limit FROm T1")
                    }
                }




                /** ending Code for Calculationg the Limits Based on T1 and T2 Limits*/
                if (objProductType.productType == 5) {
                    let isBatchSummary = await objBatchSummaryDataTransfer.saveBatchDosaDryData(objWeighment, typeValue, result, IdsNo);
                } else {
                    var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                    if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                        let isBatchSummary = await objBatchSummaryDataTransfer.saveBatchData(objWeighment, typeValue, result, IdsNo);
                    }




                }
            }
            else {
                // calculations for differential report
                const valuesForAvg = [];
                let sum = 0;
                var ResultOfReport = `LE0`;
                var nosOfTabletForT1 = result.incompleteData.NMTTabNet;
                if (result.incompleteData.GraphType == "1") {
                    for (const val of result.detailData) {
                        valuesForAvg.push(val.NetWeight);
                        sum += parseFloat(val.NetWeight);
                    }

                    let avg = sum / valuesForAvg.length;
                    var dbl_lowerLimit = objFormula.lowerLimitForRemarkForDiff(result.incompleteData, avg);
                    var dbl_upperLimit = objFormula.upperLimitForRemarkForDiff(result.incompleteData, avg);
                } else {
                    var dbl_lowerLimit = objFormula.lowerLimitForRemarkForDiff(result.incompleteData);
                    var dbl_upperLimit = objFormula.upperLimitForRemarkForDiff(result.incompleteData);
                }
                var outOfLimitCount = 0;
                //For T2 calculations 
                var objForLimit = globalData.arrVernierData.find(k => k.IdsNum == IdsNo);
                var arrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                var T1Pos; // Here if in Product master T1 tolerance are not set then for REmark check only for T2 tolerances 
                switch (typeValue) {
                    case "1":
                        T1Pos = arrLimits.Individual.T1Pos;
                        break;
                    case "8":
                        T1Pos = arrLimits.Ind_Layer.T1Pos;
                        break;
                    case "L":
                        T1Pos = arrLimits.Ind_Layer1.T1Pos;
                        break;
                    case "3":
                        T1Pos = arrLimits.Thickness.T1Pos;
                        break;
                    case "4":
                        T1Pos = arrLimits.Breadth.T1Pos;
                        break;
                    case "5":
                        T1Pos = arrLimits.Length.T1Pos;
                        break;
                    case "6":
                        T1Pos = arrLimits.Diameter.T1Pos;
                    case "D":
                        if (serverConfig.ProjectName == 'SunHalolGuj1') {
                            T1Pos = arrLimits.Differential.T1Pos;
                        } else {
                            T1Pos = arrLimits.Net.T1Pos;
                        }
                        break;
                    default:
                        T1Pos = 1
                }

                for (const val of result.detailData) {
                    if (parseFloat(val.NetWeight) > parseFloat(dbl_upperLimit.upperLimit2) || parseFloat(val.NetWeight) < parseFloat(dbl_lowerLimit.lowerLimit2)) {
                        outOfLimitCount += 1;
                    }
                }
                if (outOfLimitCount > 0) {
                    ResultOfReport = `LE1`;
                    objForLimit.flag = true
                    console.log("Out of Limit FROm T2")
                }

                //For T1 calculations for balance related parameter only
                if (outOfLimitCount == 0 && parseFloat(T1Pos) != 0 && globalData.objNominclature.IsNMT == 1 && serverConfig.ProjectName != 'SunHalolGuj1') {
                    for (const val of result.detailData) {
                        if (parseFloat(val.NetWeight) > parseFloat(dbl_upperLimit.upperLimit1) || parseFloat(val.NetWeight) < parseFloat(dbl_lowerLimit.lowerLimit1)) {
                            outOfLimitCount += 1;
                        }
                    }
                    if (outOfLimitCount > nosOfTabletForT1) {
                        ResultOfReport = `LE1`;
                        objForLimit.flag = true
                        console.log("Out of Limit FROm T1")
                    }
                }

                //here we are using store pprocesdure to calculate final remark of the report************
                if (serverConfig.ProjectName == 'SunHalolGuj1') {
                    var strResulCalculateRemarkForSoftShellt = await objclsstoredProcsdure.CalculateRptRemarkForSoftShell(result.incompleteData.RepSerNo, 'tbl_cap_master3_incomplete', 'tbl_cap_detail3_incomplete')
                    strResulCalculateRemarkForSoftShellt = strResulCalculateRemarkForSoftShellt[1][0]['@result']
                    if (strResulCalculateRemarkForSoftShellt != 'Complies') {
                        ResultOfReport = `LE1`;
                        objForLimit.flag = true
                        console.log("SunHalolGuj1 Out of Limit remark using SP reportCalculationForSoftshellNet")
                    } else {
                        ResultOfReport = `LE0`;
                    }
                }
                //************************************************************************************* */

                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                    let isBatchSummary = await objBatchSummaryDataTransfer.saveBatchDataDiff(objWeighment, typeValue, result, IdsNo, ResultOfReport);
                    /** ending Code for Calculationg the Limits Based on T1 and T2 Limits*/
                }
            }


            let isWTTrfr = await objWeighmentDataTransfer.saveCommonDataToComplete(result, typeValue, IdsNo);



            const IBalanceOPC = new BalanceOPCInterface();
            await objRemarkInComplete.deleteEntry(IdsNo);
            // Deleting Power Backup
            await objPowerbackup.deletePowerBackupData(IdsNo);
            // Here at this moment OPC only for Indivisual


            if (typeValue == 1 && serverConfig.ProjectName == "PTG") {
                IBalanceOPC.BalanceTags.strTest = typeValue == 1 ? "Individual" : "";
                IBalanceOPC.BalanceTags.strProductName = result.incompleteData.ProductName;
                IBalanceOPC.BalanceTags.strDate = result.incompleteData.PrDate;
                IBalanceOPC.BalanceTags.strStartTime = result.incompleteData.PrTime;
                IBalanceOPC.BalanceTags.intNos = result.incompleteData.Qty;
                IBalanceOPC.BalanceTags.strBatchNo = result.incompleteData.BatchNo;
                IBalanceOPC.BalanceTags.strSide = result.incompleteData.Side;

                const values = [];
                var Result = "Pass";
                var aboveBelowT1 = 0;
                // var sum = 0;
                for (const val of result.detailData) {
                    values.push(val.DataValue);
                    if ((val.DataValue > result.incompleteData.T1PosTol && val.DataValue < result.incompleteData.T2PosTol)
                        || (val.DataValue < result.incompleteData.T1NegTol && val.DataValue > result.incompleteData.T2NegTol)) {
                        aboveBelowT1 = aboveBelowT1 + 1;
                    }

                    if (val.DataValue > result.incompleteData.T2PosTol || val.DataValue < result.incompleteData.T2NegTol) {
                        Result = "Fail";
                    }
                }

                if (aboveBelowT1 > 3) {
                    Result = "Fail";
                }


                let sum = values.reduce((previous, current) => current += previous);
                let avg = sum / values.length;

                IBalanceOPC.BalanceTags.intMaximumInd = Math.min(...values);
                IBalanceOPC.BalanceTags.intMinimumInd = Math.max(...values);
                IBalanceOPC.BalanceTags.intAverage = avg;
                IBalanceOPC.BalanceTags.strResult = Result;
                //IBalanceOPC.BalanceTags.intValue = values;
                IBalanceOPC.BalanceTags.strEndTime = result.incompleteData.PrEndTime;
                IBalanceOPC.BalanceTags.strLot = result.incompleteData.Lot;

                //result.incompleteData.BalanceId
                objOPC.exportToOPC_Balance("24018", IBalanceOPC.BalanceTags);
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
            // return 'success';
            return ResultOfReport;

        } catch (error) {
            return error
        }
    }



}
module.exports = Individual;