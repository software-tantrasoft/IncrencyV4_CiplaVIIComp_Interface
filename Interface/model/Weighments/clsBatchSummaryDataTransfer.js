const Database = require('../../database/clsQueryProcess');
const database = new Database();
const ClsProduct = require('../../model/clsProductDetailModel');
const proObj = new ClsProduct();
const globalData = require('../../global/globalData');
const date = require('date-and-time')
const CalculateDP = require('../../middleware/calculateDP');
const objDP = new CalculateDP();
const FormulaFun = require('../Product/clsformulaFun');
const formulaFun = new FormulaFun();
const clsStoreProcedure = require("../clsStoreProcedure")
const objStoreProcedure = new clsStoreProcedure()
const serverConfig = require('../../global/severConfig')
const ErrorLog = require('../../model/clsErrorLog');
const clsMathJS = require('../../middleware/clsMathJS');
const math = new clsMathJS();

/**
 * @description this class is use save batch summary data.
 */

class BatchDataTransfer {
    /**
     * 
     * @param {*} objWeighment 
     * @param {*} typeValue 
     * @param {*} resultdata 
     * @description `saveBatchData` Is Method for saving batch summary for Balance and vernier
     */
    async saveBatchData(objWeighment, typeValue, resultdata, IdsNo) {
        try {
            var now = new Date();
            var responseObj = {};
            var now = new Date();
            var arrDetail = [];
            let strInstrumentId = "";
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)


            if ((typeValue == 1) || (typeValue == 3) || (typeValue == 4) || (typeValue == 5) || (typeValue == 6)
                || (typeValue == 8) || (typeValue == 'L')) {

                var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objWeighment.intIdsNo);
                var masterTable, detailTable, finalSum;
                var sum = 0;
                if (typeValue == 8) {
                    masterTable = 'tbl_batchsummary_master9';
                    detailTable = 'tbl_batchsummary_detail9';
                }
                else if (typeValue == 'L') {
                    masterTable = 'tbl_batchsummary_master11';
                    detailTable = 'tbl_batchsummary_detail11';
                }
                else {
                    if (objProductType.productType == 2) {
                        if (typeValue == 4) {
                            masterTable = 'tbl_batchsummary_master6';
                            detailTable = 'tbl_batchsummary_detail6';
                        }
                        else {
                            masterTable = 'tbl_batchsummary_master' + typeValue;
                            detailTable = 'tbl_batchsummary_detail' + typeValue;
                        }

                    }
                    else {
                        if (cubicalObj.Sys_Area == 'Dosa Dry Syrup') {
                            masterTable = 'tbl_batchsummary_master19';
                            detailTable = 'tbl_batchsummary_detail19';
                        } else {
                            masterTable = 'tbl_batchsummary_master' + typeValue;
                            detailTable = 'tbl_batchsummary_detail' + typeValue;
                        }
                    }

                }
                for (var i = 0; i < resultdata.detailData.length; i++) {
                    var dataVal = resultdata.detailData[i].DataValue;
                    arrDetail.push(dataVal);
                }
                for (var j = 0; j < arrDetail.length; j++) {
                    sum = sum + parseFloat(arrDetail[j]);
                }



                finalSum = sum;
                var count = arrDetail.length;
                var typeVal;
                if (typeValue == 8) {
                    typeVal = 9;
                }
                else if (typeValue == 'L') {
                    typeVal = 11;
                }
                else if (typeValue == 'P') {
                    typeVal = 18;
                }
                else {
                    typeVal = typeValue;
                }

                var resOfSP = await objStoreProcedure.fetchDetailForStats(resultdata, typeVal);
                var maxVal = resOfSP[1][0]['@maxWeight'];//Math.max(...arrDetail);
                var minVal = resOfSP[1][0]['@minWeight']; //Math.min(...arrDetail);
                // var avgVal = resOfSP[1][0]['@average'];  //(finalSum / count); //commented by vatsal
                let DP = resultdata.incompleteData.DecimalPoint;

                //average value according to api convention
                var apiavg = (serverConfig.ProjectName == "SVP") ? math.roundUpPad(resOfSP[1][0]['@average'], 1) :
                    (serverConfig.ProjectName == "MVL") ? math.roundUpPad(resOfSP[1][0]['@average'], 2) : math.roundUpPad(resOfSP[1][0]['@average'], DP + 1)
                if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && ((cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating') || (cubicalObj.Sys_CubType == 'Capsule Filling') || (cubicalObj.Sys_CubType == 'Dosa Dry')))) {
                    let res = await proObj.productData(cubicalObj);
                    var paramNom = `Param${typeVal}_Nom`;
                    var limitNo = `Param${typeVal}_LimitOn`;
                    var nom = parseFloat(res[1][paramNom]);
                    var limit = res[1][limitNo].readUIntLE();
                    var minPer, maxPer;
                    if (limit == 0)//standard
                    {
                        minPer = Math.abs(((nom - minVal) / nom) * 100);
                        maxPer = Math.abs(((maxVal - nom) / nom) * 100);
                    }
                    else//average
                    {
                        minPer = Math.abs(((apiavg - minVal) / apiavg) * 100);
                        maxPer = Math.abs(((maxVal - apiavg) / apiavg) * 100);
                    }
                    if (typeValue == "1" || typeValue == "8" || typeValue == "L"
                        || typeValue == "9" || typeValue == "K") {
                        strInstrumentId = resultdata.incompleteData.BalanceId;
                    } else if (typeValue == "3" || typeValue == "4" || typeValue == "5" || typeValue == "6") {
                        strInstrumentId = resultdata.incompleteData.VernierId;
                    }
                    let sideVal = "NA";
                    if (resultdata.incompleteData.Side == 'LHS') {
                        sideVal = "LEFT";
                    } else if (resultdata.incompleteData.Side == 'RHS') {
                        sideVal = "RIGHT";
                    } else {
                        sideVal = "NA";
                    }
                    let checkSideMasterTable;
                    if (resultdata.incompleteData.Side == 'NA') {
                        checkSideMasterTable = resultdata.incompleteData.Side;
                    } else {
                        checkSideMasterTable = 'LEFT';
                    }
                    // We only want to check side for NA and left side in master table so again we declare 
                    // side variable for this specific perpose
                    const checkMasterObj = {
                        str_tableName: masterTable,
                        data: 'MAX(RepSerNo) AS SrNo',
                        condition: [
                            { str_colName: 'BFGCode', value: objWeighment.strProductId, comp: 'eq' },
                            { str_colName: 'ProductName', value: objWeighment.strProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: objWeighment.strProductVersion, comp: 'eq' },
                            { str_colName: 'Version', value: objWeighment.strVersion, comp: 'eq' },
                            { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                            { str_colName: 'CubType', value: resultdata.incompleteData.CubicleType, comp: 'eq' },
                            { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo, comp: 'eq' },
                        ]
                    }
                    let resultData = await database.select(checkMasterObj);
                    var masterSrNo;
                    var vernierObj = globalData.arrVernierData.find(k => k.IdsNum == IdsNo);
                    let remark = 'Complies';
                    if (vernierObj.flag == true) {
                        remark = "Not Complies";
                    } else {
                        remark = "Complies";
                    }

                    let recSeqNo = await this.calculateSeqNo(sideVal, masterTable, detailTable,
                        resultdata.incompleteData);

                    if (resultData[0][0].SrNo == null) {
                        const objInsertMasterData = {
                            str_tableName: masterTable,
                            data: [
                                { str_colName: 'BFGCode', value: resultdata.incompleteData.BFGCode },
                                { str_colName: 'ProductName', value: resultdata.incompleteData.ProductName },
                                { str_colName: 'PVersion', value: resultdata.incompleteData.PVersion },
                                { str_colName: 'Version', value: resultdata.incompleteData.Version },
                                { str_colName: 'PrdType', value: resultdata.incompleteData.ProductType },
                                { str_colName: 'CubType', value: resultdata.incompleteData.CubicleType },
                                { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo },
                                { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                                { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                                { str_colName: 'Nom', value: nom },
                                { str_colName: 'Tol1Neg', value: resultdata.incompleteData.T1NegTol },
                                { str_colName: 'Tol1Pos', value: resultdata.incompleteData.T1PosTol },
                                { str_colName: 'Tol2Neg', value: resultdata.incompleteData.T2NegTol },
                                { str_colName: 'Tol2Pos', value: resultdata.incompleteData.T2PosTol },
                                { str_colName: 'DP', value: DP },
                                // { str_colName: 'LODLayer', value: resultdata.incompleteData.UserId },
                                { str_colName: 'Unit', value: resultdata.incompleteData.Unit },
                                // { str_colName: 'FinalMinDT', value: resultdata.incompleteData.PrDate },
                                // { str_colName: 'FinalMaxDT', value: resultdata.incompleteData.PrTime },
                                // { str_colName: 'FinalAvgDT', value: resultdata.incompleteData.PrEndDate },
                                { str_colName: 'Side', value: sideVal },
                                { str_colName: 'BatchCompleted', value: resultdata.incompleteData.BatchComplete.readUIntLE() },
                                { str_colName: 'IsArchived', value: resultdata.incompleteData.IsArchived.readUIntLE() },
                                { str_colName: 'LimitOn', value: limit },
                                { str_colName: 'NMTLimit', value: resultdata.incompleteData.T1NMTTab },
                                { str_colName: 'Area', value: cubicalObj.Sys_Area },
                                { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                                { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'ReportType', value: resultdata.incompleteData.GraphType },
                            ]
                        }
                        //date.format(now, 'YYYY-MM-DD')
                        let masterResult = await database.save(objInsertMasterData);
                        masterSrNo = masterResult[0].insertId;
                        const objInsertDetailData = {
                            str_tableName: detailTable,
                            data: [
                                { str_colName: 'RepSerNo', value: masterSrNo },
                                { str_colName: 'RecSeqNo', value: recSeqNo },
                                { str_colName: 'Date', value: resultdata.incompleteData.PrDate },
                                { str_colName: 'Time', value: resultdata.incompleteData.PrTime },
                                { str_colName: 'InstrumentID', value: strInstrumentId },
                                { str_colName: 'Side', value: sideVal },
                                { str_colName: 'MinPer', value: minPer },
                                { str_colName: 'MaxPer', value: maxPer },
                                { str_colName: 'Min', value: minVal },
                                { str_colName: 'Max', value: maxVal },
                                { str_colName: 'Avg', value: apiavg },
                                // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                                // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                                { str_colName: 'TestResult', value: remark },
                                { str_colName: 'UserID', value: resultdata.incompleteData.UserId },
                                { str_colName: 'UserName', value: resultdata.incompleteData.UserName },

                            ]
                        }
                        //console.log(objInsertDetailData);
                        let detailResult = await database.save(objInsertDetailData);
                        Object.assign(responseObj, { status: 'success' })
                        return responseObj;


                    }
                    else {
                        masterSrNo = resultData[0][0].SrNo;
                        //     const checkDetailObj = {
                        //         str_tableName: detailTable,
                        //         data: 'MAX(RecSeqNo) AS SeqNo',
                        //         condition: [
                        //             { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
                        //         ]
                        //     }
                        //    let detailres = await database.select(checkDetailObj);
                        //         var seqNum = detailres[0][0].SeqNo;
                        //         var seqNo = seqNum + 1;
                        const objInsertDetailData = {
                            str_tableName: detailTable,
                            data: [
                                { str_colName: 'RepSerNo', value: masterSrNo },
                                { str_colName: 'RecSeqNo', value: recSeqNo },
                                { str_colName: 'Date', value: resultdata.incompleteData.PrDate },
                                { str_colName: 'Time', value: resultdata.incompleteData.PrTime },
                                { str_colName: 'InstrumentID', value: strInstrumentId },
                                { str_colName: 'Side', value: sideVal },
                                { str_colName: 'MinPer', value: minPer },
                                { str_colName: 'MaxPer', value: maxPer },
                                { str_colName: 'Min', value: minVal },
                                { str_colName: 'Max', value: maxVal },
                                { str_colName: 'Avg', value: apiavg },
                                // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                                // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                                // { str_colName: 'AvgTimeDT', value: resultdata.incompleteData.T2PosTol },
                                { str_colName: 'TestResult', value: remark },
                                { str_colName: 'UserID', value: resultdata.incompleteData.UserId },
                                { str_colName: 'UserName', value: resultdata.incompleteData.UserName },

                            ]
                        }
                        let detailResult = database.save(objInsertDetailData);
                        Object.assign(responseObj, { status: 'success' })
                        return responseObj;
                    }

                }

            } else {
                return true; // group layers ignored here
            }
        } catch (err) {
            console.log(err);
            return err;
        }
    }
    /**
     * @date 02/01/2021
     * @description Asynchronous function for saving batch summary for dosa dry process
     * @param {*}
     */
    async saveBatchDosaDryData(objWeighment, typeValue, resultdata, IdsNo) {
        try {
            /**
             * #Closure 
             * @description Below calculateAgg is closure used to calculate aggreegation values
             */
            var calculateAgg = async (arr = [], type) => {
                var aggregateResult = 0; //initialization
                if (type == "avg") {
                    const sum = arr.reduce((a, b) => a + b, 0);
                    aggregateResult = sum / arr.length || 0;
                } else if (type == "min") {
                    aggregateResult = Math.min(arr[0], arr[1]);
                } else {
                    aggregateResult = Math.max(arr[0], arr[1]);
                }
                return aggregateResult.toFixed(3);
            };
            var now = new Date();
            var responseObj = {};
            var now = new Date();
            var arrDetail = [];
            let strInstrumentId = "";
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            var masterTable = 'tbl_batchsummary_dosadry';
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objWeighment.intIdsNo);
            if ((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0)) {
                let res = await proObj.productData(cubicalObj);
                var paramNom = `Param1_Nom`;
                var limitNo = `Param1_LimitOn`;
                var nom = parseFloat(res[1][paramNom]);
                var limit = res[1][limitNo].readUIntLE();
                // strInstrumentId = resultdata.incompleteData.BalanceId;
                let checkSideMasterTable;
                if (resultdata.incompleteData.Side == 'NA') {
                    checkSideMasterTable = resultdata.incompleteData.Side;
                } else {
                    checkSideMasterTable = 'LEFT';
                }

                const objInsertMasterData = {
                    str_tableName: masterTable,
                    data: [
                        { str_colName: 'RepSerNo', value: resultdata.incompleteData.RepSerNo },
                        { str_colName: 'RecSeqNo', value: 0 },
                        { str_colName: 'BFGCode', value: resultdata.incompleteData.BFGCode },
                        { str_colName: 'ProductName', value: resultdata.incompleteData.ProductName },
                        { str_colName: 'PVersion', value: resultdata.incompleteData.PVersion },
                        { str_colName: 'Version', value: resultdata.incompleteData.Version },
                        { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo },
                        { str_colName: 'Nom', value: nom },
                        { str_colName: 'NegTol', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'PosTol', value: resultdata.incompleteData.T2PosTol },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                        { str_colName: 'Augur1Min', value: await calculateAgg([parseFloat(resultdata.detailData[0].DataValue), parseFloat(resultdata.detailData[1].DataValue)], 'min') },
                        { str_colName: 'Augur2Min', value: await calculateAgg([parseFloat(resultdata.detailData[2].DataValue), parseFloat(resultdata.detailData[3].DataValue)], 'min') },
                        { str_colName: 'Augur3Min', value: await calculateAgg([parseFloat(resultdata.detailData[4].DataValue), parseFloat(resultdata.detailData[5].DataValue)], 'min') },
                        { str_colName: 'Augur4Min', value: await calculateAgg([parseFloat(resultdata.detailData[6].DataValue), parseFloat(resultdata.detailData[7].DataValue)], 'min') },
                        { str_colName: 'Augur1Max', value: await calculateAgg([parseFloat(resultdata.detailData[0].DataValue), parseFloat(resultdata.detailData[1].DataValue)], 'max') },
                        { str_colName: 'Augur2Max', value: await calculateAgg([parseFloat(resultdata.detailData[2].DataValue), parseFloat(resultdata.detailData[3].DataValue)], 'max') },
                        { str_colName: 'Augur3Max', value: await calculateAgg([parseFloat(resultdata.detailData[4].DataValue), parseFloat(resultdata.detailData[5].DataValue)], 'max') },
                        { str_colName: 'Augur4Max', value: await calculateAgg([parseFloat(resultdata.detailData[6].DataValue), parseFloat(resultdata.detailData[7].DataValue)], 'max') },
                        { str_colName: 'Augur1Avg', value: await calculateAgg([parseFloat(resultdata.detailData[0].DataValue), parseFloat(resultdata.detailData[1].DataValue)], 'avg') },
                        { str_colName: 'Augur2Avg', value: await calculateAgg([parseFloat(resultdata.detailData[2].DataValue), parseFloat(resultdata.detailData[3].DataValue)], 'avg') },
                        { str_colName: 'Augur3Avg', value: await calculateAgg([parseFloat(resultdata.detailData[4].DataValue), parseFloat(resultdata.detailData[5].DataValue)], 'avg') },
                        { str_colName: 'Augur4Avg', value: await calculateAgg([parseFloat(resultdata.detailData[6].DataValue), parseFloat(resultdata.detailData[7].DataValue)], 'avg') },
                        { str_colName: 'MachineSpeedMin', value: cubicalObj.Sys_MachineSpeed_Min },
                        { str_colName: 'MachineSpeedMax', value: cubicalObj.Sys_MachineSpeed_Max },
                        { str_colName: 'ReportType', value: resultdata.incompleteData.GraphType },
                        { str_colName: 'ReportOn', value: resultdata.incompleteData.limitOn[0] },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                    ]
                }
                var resultSave = await database.save(objInsertMasterData);
                Object.assign(responseObj, { status: 'success' })
                return responseObj;

            } else {
                return 1;
            }
        } catch (err) {
            console.log(err);
            return err;
        }
    }
    async saveBatchDataDiff(objWeighment, typeValue, resultdata, IdsNo, ResultOfReport) { //function added by vivek on 23112019 for storing diff. batchsumary 
        try {
            var now = new Date();
            var responseObj = {};
            var now = new Date();
            var arrDetail = [];
            let strInstrumentId = "";
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var objArr_limits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objWeighment.intIdsNo);
            var masterTable, detailTable, finalSum;
            var sum = 0;

            masterTable = 'tbl_batchsummary_masterdiff';
            detailTable = 'tbl_batchsummary_detaildiff';

            for (var i = 0; i < resultdata.detailData.length; i++) {
                var dataVal = resultdata.detailData[i].NetWeight;
                arrDetail.push(dataVal);
            }

            for (var j = 0; j < arrDetail.length; j++) {
                sum = sum + parseFloat(arrDetail[j]);
            }

            finalSum = sum;
            var count = arrDetail.length;
            // var maxVal = Math.max(...arrDetail);
            // var minVal = Math.min(...arrDetail);
            // var avgVal = (finalSum / count);
            let remark = 'Complies';
            if (ResultOfReport == 'LE0') {
                remark = 'Complies';
            } else {
                remark = 'Not Complies'
            }

            var resOfSP = await objStoreProcedure.fetchDetailForStats(resultdata, 3);
            var maxVal = resOfSP[1][0]['@maxWeight'];//Math.max(...arrDetail);
            var minVal = resOfSP[1][0]['@minWeight']; //Math.min(...arrDetail);
            var avgVal = resOfSP[1][0]['@average'];  //(finalSum / count);

            if ((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Capsule Filling')) {
                let res = await proObj.productData(cubicalObj);
                // 0 for Empty, 3 for Net
                if (objProductType.productType == 4) {
                    var paramNom = `Param0_Nom`;
                    var limitNo = `Param0_LimitOn`;
                } else {
                    var paramNom = `Param3_Nom`;
                    var limitNo = `Param3_LimitOn`;
                }

                var nom = parseFloat(res[1][paramNom]);
                var limit = res[1][limitNo].readUIntLE();
                var minPer, maxPer;
                if (limit == 0)//standard
                {
                    minPer = Math.abs(((nom - minVal) / nom) * 100);
                    maxPer = Math.abs(((maxVal - nom) / nom) * 100);
                }
                else//average
                {
                    minPer = Math.abs(((avgVal - minVal) / avgVal) * 100);
                    maxPer = Math.abs(((maxVal - avgVal) / avgVal) * 100);
                }
                // content1
                var arrC1Detail = [];
                var minPerC1, maxPerC1, sumC1 = 0;

                for (var i = 0; i < resultdata.detailData.length; i++) {
                    let dataVal = resultdata.detailData[i].Content1;
                    dataVal == 99999 ? 0 : dataVal
                    arrC1Detail.push(dataVal);
                }
                for (var j = 0; j < arrC1Detail.length; j++) {
                    sumC1 = sumC1 + parseFloat(arrC1Detail[j]);
                }
                let countC1 = arrC1Detail.length;
                let maxValC1 = Math.max(...arrC1Detail);
                let minValC1 = Math.min(...arrC1Detail);
                let avgValC1 = (sumC1 / countC1);
                //------------------------------------------------------
                // content2
                var arrC2Detail = [];
                var minPerC2, maxPerC2, sumC2 = 0;

                for (var i = 0; i < resultdata.detailData.length; i++) {
                    let dataVal = resultdata.detailData[i].Content2;
                    dataVal == 99999 ? 0 : dataVal
                    arrC2Detail.push(dataVal);
                }
                for (var j = 0; j < arrC2Detail.length; j++) {
                    sumC2 = sumC2 + parseFloat(arrC2Detail[j]);
                }
                let countC2 = arrC2Detail.length;
                let maxValC2 = Math.max(...arrC2Detail);
                let minValC2 = Math.min(...arrC2Detail);
                let avgValC2 = (sumC2 / countC2);
                //------------------------------------------------------
                // content3
                var arrC3Detail = [];
                var minPerC3, maxPerC3, sumC3 = 0;

                for (var i = 0; i < resultdata.detailData.length; i++) {
                    let dataVal = resultdata.detailData[i].Content3;
                    dataVal == 99999 ? 0 : dataVal
                    arrC3Detail.push(dataVal);
                }
                for (var j = 0; j < arrC3Detail.length; j++) {
                    sumC3 = sumC3 + parseFloat(arrC3Detail[j]);
                }
                let countC3 = arrC3Detail.length;
                let maxValC3 = Math.max(...arrC3Detail);
                let minValC3 = Math.min(...arrC3Detail);
                let avgValC3 = (sumC3 / countC3);
                //------------------------------------------------------
                // content4
                var arrC4Detail = [];
                var minPerC4, maxPerC4, sumC4 = 0;

                for (var i = 0; i < resultdata.detailData.length; i++) {
                    let dataVal = resultdata.detailData[i].Content4;
                    dataVal == 99999 ? 0 : dataVal
                    arrC4Detail.push(dataVal);
                }
                for (var j = 0; j < arrC4Detail.length; j++) {
                    sumC4 = sumC4 + parseFloat(arrC4Detail[j]);
                }
                let countC4 = arrC4Detail.length;
                let maxValC4 = Math.max(...arrC4Detail);
                let minValC4 = Math.min(...arrC4Detail);
                let avgValC4 = (sumC4 / countC4);
                //------------------------------------------------------
                if (typeValue == "D") {
                    strInstrumentId = resultdata.incompleteData.BalanceId;
                }
                let sideVal = "NA";
                if (resultdata.incompleteData.Side == 'LHS') {
                    sideVal = "LEFT";
                } else if (resultdata.incompleteData.Side == 'RHS') {
                    sideVal = "RIGHT";
                } else {
                    sideVal = "NA";
                }
                let checkSideMasterTable;
                if (resultdata.incompleteData.Side == 'NA') {
                    checkSideMasterTable = resultdata.incompleteData.Side;
                } else {
                    checkSideMasterTable = 'LEFT';
                }
                // We only want to check side for NA and left side in master table so again we declare 
                // side variable for this specific perpose
                const checkMasterObj = {
                    str_tableName: masterTable,
                    data: 'MAX(RepSerNo) AS SrNo',
                    condition: [
                        { str_colName: 'BFGCode', value: objWeighment.strProductId, comp: 'eq' },
                        { str_colName: 'ProductName', value: objWeighment.strProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: objWeighment.strProductVersion, comp: 'eq' },
                        { str_colName: 'Version', value: objWeighment.strVersion, comp: 'eq' },
                        { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                        { str_colName: 'CubType', value: resultdata.incompleteData.CubicleType, comp: 'eq' },
                        { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo, comp: 'eq' },
                    ]
                }
                let resultData = await database.select(checkMasterObj);
                var masterSrNo;
                let DP = resultdata.incompleteData.DecimalPoint;


                let recSeqNo = await this.calculateSeqNo(sideVal, masterTable, detailTable,
                    resultdata.incompleteData);

                if (resultData[0][0].SrNo == null) {
                    const objInsertMasterData = {
                        str_tableName: masterTable,
                        data: [
                            { str_colName: 'BFGCode', value: resultdata.incompleteData.BFGCode },
                            { str_colName: 'ProductName', value: resultdata.incompleteData.ProductName },
                            { str_colName: 'PVersion', value: resultdata.incompleteData.PVersion },
                            { str_colName: 'Version', value: resultdata.incompleteData.Version },
                            { str_colName: 'PrdType', value: resultdata.incompleteData.ProductType },
                            { str_colName: 'CubType', value: resultdata.incompleteData.CubicleType },
                            { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo },
                            { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                            { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                            { str_colName: 'Nom', value: nom },
                            { str_colName: 'Tol1Neg', value: resultdata.incompleteData.T1NegNet },
                            { str_colName: 'Tol1Pos', value: resultdata.incompleteData.T1PosNet },
                            { str_colName: 'Tol2Neg', value: resultdata.incompleteData.T2NegNet },
                            { str_colName: 'Tol2Pos', value: resultdata.incompleteData.T2PosNet },
                            { str_colName: 'DP', value: DP },
                            { str_colName: 'Unit', value: resultdata.incompleteData.Unit },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'BatchCompleted', value: resultdata.incompleteData.BatchComplete.readUIntLE() },
                            { str_colName: 'IsArchived', value: resultdata.incompleteData.IsArchived.readUIntLE() },
                            { str_colName: 'LimitOn', value: limit },
                            { str_colName: 'NMTLimit', value: resultdata.incompleteData.T1NMTTab },
                            { str_colName: 'Area', value: cubicalObj.Sys_Area },
                            { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                            { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'ReportType', value: resultdata.incompleteData.ReportType },
                            { str_colName: 'Nom_content1', value: resultdata.incompleteData.NomContent1 },
                            { str_colName: 'Tol1Neg_content1', value: resultdata.incompleteData.T1NegContent1 },
                            { str_colName: 'Tol1Pos_content1', value: resultdata.incompleteData.T1PosContent1 },
                            { str_colName: 'Tol2Neg_content1', value: resultdata.incompleteData.T2NegContent1 },
                            { str_colName: 'Tol2Pos_content1', value: resultdata.incompleteData.T2PosContent1 },
                            { str_colName: 'NMTLimit_content1', value: resultdata.incompleteData.NMTTabContent1 },
                            { str_colName: 'LimitOn_content1', value: resultdata.incompleteData.limitOnContent1.readUIntLE() },
                            { str_colName: 'ReportType_content1', value: resultdata.incompleteData.GraphTypeContent1 == 'Standard' ? 0 : 1 },
                            { str_colName: 'Type_content1', value: resultdata.incompleteData.Content1Type },
                            { str_colName: 'Name_content1', value: resultdata.incompleteData.Content1Desc },
                            { str_colName: 'Nom_content2', value: resultdata.incompleteData.NomContent2 },
                            { str_colName: 'Tol1Neg_content2', value: resultdata.incompleteData.T1NegContent2 },
                            { str_colName: 'Tol1Pos_content2', value: resultdata.incompleteData.T1PosContent2 },
                            { str_colName: 'Tol2Neg_content2', value: resultdata.incompleteData.T2NegContent2 },
                            { str_colName: 'Tol2Pos_content2', value: resultdata.incompleteData.T2PosContent2 },
                            { str_colName: 'NMTLimit_content2', value: resultdata.incompleteData.NMTTabContent2 },
                            { str_colName: 'LimitOn_content2', value: resultdata.incompleteData.limitOnContent2.readUIntLE() },
                            { str_colName: 'ReportType_content2', value: resultdata.incompleteData.GraphTypeContent2 == 'Standard' ? 0 : 1 },
                            { str_colName: 'Type_content2', value: resultdata.incompleteData.Content2Type },
                            { str_colName: 'Name_content2', value: resultdata.incompleteData.Content2Desc },
                            { str_colName: 'Nom_content3', value: resultdata.incompleteData.NomContent3 },
                            { str_colName: 'Tol1Neg_content3', value: resultdata.incompleteData.T1NegContent3 },
                            { str_colName: 'Tol1Pos_content3', value: resultdata.incompleteData.T1PosContent3 },
                            { str_colName: 'Tol2Neg_content3', value: resultdata.incompleteData.T2NegContent3 },
                            { str_colName: 'Tol2Pos_content3', value: resultdata.incompleteData.T2PosContent3 },
                            { str_colName: 'NMTLimit_content3', value: resultdata.incompleteData.NMTTabContent3 },
                            { str_colName: 'LimitOn_content3', value: resultdata.incompleteData.limitOnContent3.readUIntLE() },
                            { str_colName: 'ReportType_content3', value: resultdata.incompleteData.GraphTypeContent3 == 'Standard' ? 0 : 1 },
                            { str_colName: 'Type_content3', value: resultdata.incompleteData.Content3Type },
                            { str_colName: 'Name_content3', value: resultdata.incompleteData.Content3Desc },
                            { str_colName: 'Nom_content4', value: resultdata.incompleteData.NomContent4 },
                            { str_colName: 'Tol1Neg_content4', value: resultdata.incompleteData.T1NegContent4 },
                            { str_colName: 'Tol1Pos_content4', value: resultdata.incompleteData.T1PosContent4 },
                            { str_colName: 'Tol2Neg_content4', value: resultdata.incompleteData.T2NegContent4 },
                            { str_colName: 'Tol2Pos_content4', value: resultdata.incompleteData.T2PosContent4 },
                            { str_colName: 'NMTLimit_content4', value: resultdata.incompleteData.NMTTabContent4 },
                            { str_colName: 'LimitOn_content4', value: resultdata.incompleteData.limitOnContent4.readUIntLE() },
                            { str_colName: 'ReportType_content4', value: resultdata.incompleteData.GraphTypeContent4 == 'Standard' ? 0 : 1 },
                            { str_colName: 'Type_content4', value: resultdata.incompleteData.Content4Type },
                            { str_colName: 'Name_content4', value: resultdata.incompleteData.Content4Desc },
                            { str_colName: 'NoOfContent', value: resultdata.incompleteData.NoOfContent },
                        ]
                    }
                    if (serverConfig.ProjectName == 'SunHalolGuj1') {
                        objInsertMasterData.data.push(
                            { str_colName: 'Tol3Neg', value: resultdata.incompleteData.T3NegNet },
                            { str_colName: 'Tol3Pos', value: resultdata.incompleteData.T3PosNet },
                        )
                    }
                    //date.format(now, 'YYYY-MM-DD')
                    let masterResult = await database.save(objInsertMasterData);
                    masterSrNo = masterResult[0].insertId;
                    const objInsertDetailData = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: resultdata.incompleteData.PrDate },
                            { str_colName: 'Time', value: resultdata.incompleteData.PrTime },
                            { str_colName: 'InstrumentID', value: strInstrumentId },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'MinPer', value: minPer },
                            { str_colName: 'MaxPer', value: maxPer },
                            { str_colName: 'Min', value: minVal },
                            { str_colName: 'Max', value: maxVal },
                            { str_colName: 'Avg', value: avgVal },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: resultdata.incompleteData.UserId },
                            { str_colName: 'UserName', value: resultdata.incompleteData.UserName },
                            { str_colName: 'Min_content1', value: minValC1 },
                            { str_colName: 'Max_content1', value: maxValC1 },
                            { str_colName: 'Avg_content1', value: avgValC1 },
                            { str_colName: 'Min_content2', value: minValC2 },
                            { str_colName: 'Max_content2', value: maxValC2 },
                            { str_colName: 'Avg_content2', value: avgValC2 },
                            { str_colName: 'Min_content3', value: minValC3 },
                            { str_colName: 'Max_content3', value: maxValC3 },
                            { str_colName: 'Avg_content3', value: avgValC3 },
                            { str_colName: 'Min_content4', value: minValC4 },
                            { str_colName: 'Max_content4', value: maxValC4 },
                            { str_colName: 'Avg_content4', value: avgValC4 },

                        ]
                    }
                    let detailResult = await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }
                else {
                    masterSrNo = resultData[0][0].SrNo;
                    const objInsertDetailData = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: resultdata.incompleteData.PrDate },
                            { str_colName: 'Time', value: resultdata.incompleteData.PrTime },
                            { str_colName: 'InstrumentID', value: strInstrumentId },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'MinPer', value: minPer },
                            { str_colName: 'MaxPer', value: maxPer },
                            { str_colName: 'Min', value: minVal },
                            { str_colName: 'Max', value: maxVal },
                            { str_colName: 'Avg', value: avgVal },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: resultdata.incompleteData.UserId },
                            { str_colName: 'UserName', value: resultdata.incompleteData.UserName },
                            { str_colName: 'Min_content1', value: minValC1 },
                            { str_colName: 'Max_content1', value: maxValC1 },
                            { str_colName: 'Avg_content1', value: avgValC1 },
                            { str_colName: 'Min_content2', value: minValC2 },
                            { str_colName: 'Max_content2', value: maxValC2 },
                            { str_colName: 'Avg_content2', value: avgValC2 },
                            { str_colName: 'Min_content3', value: minValC3 },
                            { str_colName: 'Max_content3', value: maxValC3 },
                            { str_colName: 'Avg_content3', value: avgValC3 },
                            { str_colName: 'Min_content4', value: minValC4 },
                            { str_colName: 'Max_content4', value: maxValC4 },
                            { str_colName: 'Avg_content4', value: avgValC4 },

                        ]
                    }
                    let detailResult = database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }

            }

        }
        catch (err) {
            console.log(err);
            return err;
        }
    }
    /**
     * 
     * @param {*} side 
     * @param {*} masterTableName 
     * @param {*} detailTableName 
     * @param {*} batchNo 
     * @param {*} inCompleteData 
     * @description `calculateSeqNo` contains methology for calculating sequence number as needed for
     * report side
     */
    async calculateSeqNo(side, masterTableName, detailTableName, inCompleteData) {
        var now = new Date();
        let selectedSide;
        if (side == 'NA') {
            selectedSide = side;
        } else {
            selectedSide = "LEFT";
        }
        let selectDetailData = {
            str_tableName: masterTableName,
            data: 'MAX(RepSerNo) AS RepSerNo',
            condition: [
                { str_colName: 'BFGCode', value: inCompleteData.BFGCode },
                { str_colName: 'ProductName', value: inCompleteData.ProductName },
                { str_colName: 'PVersion', value: inCompleteData.PVersion },
                { str_colName: 'Version', value: inCompleteData.Version },
                { str_colName: 'BatchNo', value: inCompleteData.BatchNo },
                { str_colName: 'Side', value: selectedSide }
            ]
        }
        let selectRes = await database.select(selectDetailData);
        if (selectRes[0].length == 0) {
            return 1;
        } else {
            let selectDetail = {
                str_tableName: detailTableName,
                data: 'MAX(RecSeqNo) AS RecSeqNo',
                condition: [
                    { str_colName: 'RepSerNo', value: selectRes[0][0].RepSerNo },
                    { str_colName: 'Side', value: side }
                ]
            }
            let reqSeqRes = await database.select(selectDetail);
            if (reqSeqRes[0].length == 0) {
                return 1;
            } else {
                return reqSeqRes[0][0].RecSeqNo + 1;
            }
        }

    }
    /**
     * 
     * @param {*} masterData 
     * @param {*} DetailData 
     * @description `saveBatchDataHardness` Save the batch Summary Data for `Hardness`
     */
    async saveBatchDataHardnessST50(masterData, DetailData, idsNo) {
        try {
            var now = new Date();
            let responseObj = {};
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = idsNo;
            }
            // console.log(masterData, DetailData);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
            let resultForHardess = {};
            // masterData.RepSerNo
            Object.assign(resultForHardess,
                { incompleteTableName: 'tbl_tab_masterhtd_incomplete' },
                { incompletedetailTableName: 'tbl_tab_detailhtd_incomplete' },
            )

            let sideVal = "NA";
            if (masterData.Side == 'LHS') {
                sideVal = "LEFT";
            } else if (masterData.Side == 'RHS') {
                sideVal = "RIGHT";
            } else {
                sideVal = "NA";
            }
            let checkSideMasterTable;
            if (masterData.Side == 'NA') {
                checkSideMasterTable = masterData.Side;
            } else {
                checkSideMasterTable = 'LEFT';
            }
            let sumHT = 0;
            let sumT = 0;
            let sumDLB = 0;
            let sumDiam = 0;
            let arrHTDetail = [];
            let arrTDetail = [];
            let arrDLBDetail = [];
            let arrDiamDetail = [];
            let outFlagHTD = 0;
            let outFlagThickness = 0;
            let outFlagDiameter = 0;
            let outFlagWidth = 0;
            let remark;
            let arrParamCheck = [];

            //for Hardness******************************************************************* */
            if (tempLimObj.Hardness == undefined) {
                var maxHTDLimit = 0;
                var minHTDLimit = 0;
            } else {
                var maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
                var minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
                arrParamCheck.push('Hardness')
            }
            //********************************************************************* */


            //for Thickness******************************************************************* */
            if (tempLimObj.Thickness == undefined) {
                var maxTLimit = 0;
                var minTLimit = 0;
            } else {
                var maxTLimit = parseFloat(formulaFun.upperLimit(tempLimObj.Thickness));
                var minTLimit = parseFloat(formulaFun.lowerLimit(tempLimObj.Thickness));
                arrParamCheck.push('Thickness')
            }
            //********************************************************************* */

            //for width*************************************************************
            if (tempLimObj.Breadth == undefined) {
                var maxTLimitWdth = 0;
                var minTLimitWdth = 0;
            } else {
                var maxTLimitWdth = parseFloat(formulaFun.upperLimit(tempLimObj.Breadth));
                var minTLimitWdth = parseFloat(formulaFun.lowerLimit(tempLimObj.Breadth));
                arrParamCheck.push('Breadth')
            }
            //********************************************************************* */

            //for Diameter*************************************************************
            if (tempLimObj.Diameter == undefined) {
                var maxTLimitDiameter = 0;
                var minTLimitDiameter = 0;
            } else {
                var maxTLimitDiameter = parseFloat(formulaFun.upperLimit(tempLimObj.Diameter));
                var minTLimitDiameter = parseFloat(formulaFun.lowerLimit(tempLimObj.Diameter));
                arrParamCheck.push('Diameter')
            }
            //************************************************************************ */


            let count = DetailData.length;
            for (var i = 0; i < DetailData.length; i++) {
                //Hardness*********************************************
                var dataValHard = parseFloat(DetailData[i].DataValueHard);
                if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
                    outFlagHTD = outFlagHTD + 1;
                }
                arrHTDetail.push(dataValHard);
                //************************************************* ***/

                //for thickness****************************************
                var dataValThick = parseFloat(DetailData[i].DataValueThick);
                if (minTLimit != 0 && maxTLimit != 0) {
                    if ((minTLimit > dataValThick) || (dataValThick > maxTLimit)) {
                        outFlagThickness = outFlagThickness + 1;
                    }
                }
                arrTDetail.push(dataValThick);
                //*************************************************** */

                //for Diameter****************************************** */
                var dataValDiameter = parseFloat(DetailData[i].DataValueDiam);
                if (minTLimitDiameter != 0 && maxTLimitDiameter != 0) {
                    if ((minTLimitDiameter > dataValDiameter) || (dataValDiameter > maxTLimitDiameter)) {
                        outFlagDiameter = outFlagDiameter + 1;
                    }
                }
                arrDiamDetail.push(dataValDiameter);
                //******************************************************* */

                //for Width************************************************
                var dataValWidth = parseFloat(DetailData[i].DataValueDOLOBO);
                if (minTLimitWdth != 0 && maxTLimitWdth != 0) {
                    if ((minTLimitWdth > dataValWidth) || (dataValWidth > maxTLimitWdth)) {
                        outFlagWidth = outFlagWidth + 1;
                    }
                }
                arrDLBDetail.push(dataValWidth);
                //******************************************************** */
            }

            remark = 'Complies'
            var MaxHard = 0, MinHard = 0, avgHard = 0; //for hardness
            var MaxThick = 0, MinThick = 0, AvgThick = 0; //for thickness
            var MaxDLB = 0, MinDLB = 0, AvgDLB = 0; // for Bredth/width
            var MaxDiam = 0, MinDiam = 0, AvgDiam = 0; // for dimaeter

            for (var i = 0; i <= arrParamCheck.length - 1; i++) {
                if (arrParamCheck[i] == 'Hardness') {
                    var resOfSP = await objStoreProcedure.fetchDetailForStats(resultForHardess, 7, masterData.RepSerNo);
                    MaxHard = resOfSP[1][0]['@maxWeight'];
                    MinHard = resOfSP[1][0]['@minWeight'];
                    avgHard = resOfSP[1][0]['@average'];

                    if (outFlagHTD > 0) {
                        remark = 'Not Complies'
                    }
                }
                else if (arrParamCheck[i] == 'Thickness') {
                    for (var k = 0; k < arrTDetail.length; k++) {
                        sumT = sumT + parseFloat(arrTDetail[k]);
                    }

                    MaxThick = Math.max(...arrTDetail);
                    MinThick = Math.min(...arrTDetail);
                    AvgThick = (sumT / count);

                    if (outFlagThickness > 0) {
                        remark = 'Not Complies'
                    }
                }
                else if (arrParamCheck[i] == 'Breadth') {
                    for (var l = 0; l < arrDLBDetail.length; l++) {
                        sumDLB = sumDLB + parseFloat(arrDLBDetail[l]);
                    }

                    MaxDLB = Math.max(...arrDLBDetail);
                    MinDLB = Math.min(...arrDLBDetail);
                    AvgDLB = (sumDLB / count);

                    if (outFlagWidth > 0) {
                        remark = 'Not Complies'
                    }
                }
                else if (arrParamCheck[i] == 'Diameter') {

                    for (var l = 0; l < arrDiamDetail.length; l++) {
                        sumDiam = sumDiam + parseFloat(arrDiamDetail[l]);
                    }

                    MaxDiam = Math.max(...arrDiamDetail);
                    MinDiam = Math.min(...arrDiamDetail);
                    AvgDiam = (sumDiam / count);

                    if (outFlagDiameter > 0) {
                        remark = 'Not Complies'
                    }
                }
            }



            if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {

                const checkMasterObj = {
                    str_tableName: 'tbl_batchsummary_master_hdlb',
                    data: 'MAX(RepSerNo) AS SrNo',
                    condition: [
                        { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
                        { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
                        { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
                        { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                        { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                        { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
                    ]
                }
                var masterSrNo;
                // let DP = await objDP.precision(resultdata.incompleteData.T2PosTol);
                let resultData = await database.select(checkMasterObj);
                let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master_hdlb', 'tbl_batchsummary_detail_hdlb', masterData);
                if (resultData[0][0].SrNo == null) {
                    let masterDataInsert = {
                        str_tableName: 'tbl_batchsummary_master_hdlb',
                        data: [
                            { str_colName: 'BFGCode', value: masterData.BFGCode },
                            { str_colName: 'ProductName', value: masterData.ProductName },
                            { str_colName: 'PVersion', value: masterData.PVersion },
                            { str_colName: 'Version', value: masterData.Version },
                            { str_colName: 'PrdType', value: 1 },
                            { str_colName: 'CubType', value: masterData.CubicleType },
                            { str_colName: 'BatchNo', value: masterData.BatchNo },
                            { str_colName: 'Stage', value: masterData.Stage },
                            { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                            { str_colName: 'NomHard', value: masterData.NomHard != undefined ? masterData.NomHard : 0 },
                            { str_colName: 'LwrHard', value: masterData.NegTolHard != undefined ? masterData.NegTolHard : 0 },
                            { str_colName: 'UppHard', value: masterData.PosTolHard != undefined ? masterData.PosTolHard : 0 },
                            { str_colName: 'UnitHard', value: masterData.Unit },

                            { str_colName: 'NomThick', value: masterData.NomThick != undefined ? masterData.NomThick : 0 },
                            { str_colName: 'LwrThick', value: masterData.NegTolThick != undefined ? masterData.NegTolThick : 0 },
                            { str_colName: 'UppThick', value: masterData.PosTolThick != undefined ? masterData.PosTolThick : 0 },

                            { str_colName: 'NomDLB', value: masterData.NomDOLOBO != undefined ? masterData.NomDOLOBO : 0 },
                            { str_colName: 'LwrDLB', value: masterData.NegTolDOLOBO != undefined ? masterData.NegTolDOLOBO : 0 },
                            { str_colName: 'UppDLB', value: masterData.PosTolDOLOBO != undefined ? masterData.PosTolDOLOBO : 0 },

                            { str_colName: 'DLBParamName', value: masterData.ColHeadDOLOBO },

                            { str_colName: 'NomDiam', value: masterData.NomDiam != undefined ? masterData.NomDiam : 0 },
                            { str_colName: 'LwrDiam', value: masterData.NegTolDiam != undefined ? masterData.NegTolDiam : 0 },
                            { str_colName: 'UppDiam', value: masterData.PosTolDiam != undefined ? masterData.PosTolDiam : 0 },

                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'BatchCompleted', value: masterData.BatchComplete[0] },
                            { str_colName: 'IsArchived', value: masterData.IsArchived[0] },
                            { str_colName: 'LimitOn', value: 0 },
                            { str_colName: 'Area', value: cubicalObj.Sys_Area },
                            { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                            { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'ReportType', value: masterData.GraphType },
                        ]
                    }
                    let saveBatchSumm = await database.save(masterDataInsert);
                    masterSrNo = saveBatchSumm[0].insertId;
                    const objInsertDetailData = {
                        str_tableName: 'tbl_batchsummary_detail_hdlb',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.HardnessID },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'MinHard', value: MinHard },
                            { str_colName: 'MaxHard', value: MaxHard },
                            { str_colName: 'AvgHard', value: avgHard },
                            { str_colName: 'MinThick', value: MinThick },
                            { str_colName: 'MaxThick', value: MaxThick },
                            { str_colName: 'AvgThick', value: AvgThick },
                            { str_colName: 'MinDLB', value: MinDLB },
                            { str_colName: 'MaxDLB', value: MaxDLB },
                            { str_colName: 'AvgDLB', value: AvgDLB },
                            { str_colName: 'MinDiam', value: MinDiam },
                            { str_colName: 'MaxDiam', value: MaxDiam },
                            { str_colName: 'AvgDiam', value: AvgDiam },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },
                            { str_colName: 'HardDP', value: masterData.DecimalPoint },

                        ]
                    }
                    //console.log(objInsertDetailData);
                    let detailResult1 = await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;

                } else {
                    masterSrNo = resultData[0][0].SrNo;

                    const objInsertDetailData = {
                        str_tableName: 'tbl_batchsummary_detail_hdlb',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.HardnessID },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'MinHard', value: MinHard },
                            { str_colName: 'MaxHard', value: MaxHard },
                            { str_colName: 'AvgHard', value: avgHard },
                            { str_colName: 'MinThick', value: MinThick },
                            { str_colName: 'MaxThick', value: MaxThick },
                            { str_colName: 'AvgThick', value: AvgThick },
                            { str_colName: 'MinDLB', value: MinDLB },
                            { str_colName: 'MaxDLB', value: MaxDLB },
                            { str_colName: 'AvgDLB', value: AvgDLB },
                            { str_colName: 'MinDiam', value: MinDiam },
                            { str_colName: 'MaxDiam', value: MaxDiam },
                            { str_colName: 'AvgDiam', value: AvgDiam },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },
                            { str_colName: 'HardDP', value: masterData.DecimalPoint },
                        ]
                    }
                    await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }
            }
            else {
                return remark;
            }
        }
        catch (err) {
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            ErrorLog.addToErrorLog(logError);
            throw new Error(err);
        }

    }

    /**
 * 
 * @param {*} masterData 
 * @param {*} DetailData 
 * @description `saveBatchDataHardness` Save the batch Summary Data for `Hardness`
 */
    // async saveBatchDataHardness(masterData, DetailData, idsNo) {
    //     var now = new Date();
    //     let responseObj = {};
    //     var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
    //     var selectedIds;
    //     if (IPQCObject != undefined) {
    //         selectedIds = IPQCObject.selectedIds;
    //     } else {
    //         selectedIds = idsNo;
    //     }
    //     // console.log(masterData, DetailData);
    //     var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
    //     var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
    //     let resultForHardess = {};
    //     // masterData.RepSerNo
    //     Object.assign(resultForHardess,
    //         { incompleteTableName: 'tbl_tab_masterhtd_incomplete' },
    //         { incompletedetailTableName: 'tbl_tab_detailhtd_incomplete' },
    //     )

    //     let sideVal = "NA";
    //     if (masterData.Side == 'LHS') {
    //         sideVal = "LEFT";
    //     } else if (masterData.Side == 'RHS') {
    //         sideVal = "RIGHT";
    //     } else {
    //         sideVal = "NA";
    //     }
    //     let checkSideMasterTable;
    //     if (masterData.Side == 'NA') {
    //         checkSideMasterTable = masterData.Side;
    //     } else {
    //         checkSideMasterTable = 'LEFT';
    //     }
    //     let sumHT = 0;
    //     let sumT = 0;
    //     let sumDLB = 0;
    //     let arrHTDetail = [];
    //     let arrTDetail = [];
    //     let arrDLBDetail = [];
    //     let outFlagHTD = 0;
    //     let outFlagThickness = 0;
    //     let outFlagDOLOBO = 0;

    //     let remark = 'Complies';
    //     if (tempLimObj.Hardness == undefined) {
    //         var maxHTDLimit = 0;
    //         var minHTDLimit = 0;
    //     } else {
    //         var maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
    //         var minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
    //     }
    //     if (tempLimObj.Thickness == undefined) {
    //         var maxTLimit = 0;
    //         var minTLimit = 0;
    //     } else {
    //         var maxTLimit = parseFloat(formulaFun.upperLimit(tempLimObj.Thickness));
    //         var minTLimit = parseFloat(formulaFun.lowerLimit(tempLimObj.Thickness));
    //     }

    //     // if(masterData.NomDOLOBO != 0) {
    //     if (masterData.ColHeadDOLOBO == 'NA') {
    //         var maxDLBLimit = 0;
    //         var minDLBLimit = 0;
    //     } else {
    //         if (tempLimObj.length == undefined && tempLimObj.Breadth == undefined && tempLimObj.Diameter == undefined) {
    //             var maxDLBLimit = 0;
    //             var minDLBLimit = 0;
    //         } else {
    //             var maxDLBLimit = parseFloat(formulaFun.upperLimit(tempLimObj[masterData.ColHeadDOLOBO]));
    //             var minDLBLimit = parseFloat(formulaFun.lowerLimit(tempLimObj[masterData.ColHeadDOLOBO]));
    //         }

    //     }


    //     let count = DetailData.length;
    //     for (var i = 0; i < DetailData.length; i++) {
    //         var dataValHard = parseFloat(DetailData[i].DataValueHard);
    //         if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {

    //             if (dataValHard == 99998.00 && dataValHard == 99998 && dataValHard == 99999 && dataValHard == 99999.00) {
    //                 outFlagHTD = 0;
    //             }
    //             else if (dataValHard != 99998.00 && dataValHard != 99998 && dataValHard != 99999 && dataValHard != 99999.00) {
    //                 outFlagHTD = outFlagHTD + 1;
    //             }
    //         }
    //         arrHTDetail.push(dataValHard);
    //         var dataValThick = parseFloat(DetailData[i].DataValueThick);
    //         if (minTLimit != 0 && maxTLimit != 0) {
    //             if ((minTLimit > dataValThick) || (dataValThick > maxTLimit)) {

    //                 if (dataValThick == 99998.00 && dataValThick == 99998 && dataValThick == 99999 && dataValThick == 99999.00) {
    //                     outFlagThickness = 0;
    //                 }
    //                 else if (dataValThick != 99998.00 && dataValThick != 99998 && dataValThick != 99999 && dataValThick != 99999.00) {
    //                     outFlagThickness = outFlagThickness + 1;
    //                 }
    //             }
    //         }
    //         arrTDetail.push(dataValThick);
    //         var dataValDLB = parseFloat(DetailData[i].DataValueDOLOBO);
    //         if (minDLBLimit != 0 && maxDLBLimit != 0) {
    //             if ((minDLBLimit > dataValDLB) || (dataValDLB > maxDLBLimit)) {
    //                 if (dataValDLB == 99998.00 && dataValDLB == 99998 && dataValDLB == 99999 && dataValDLB == 99999.00) {
    //                     outFlagDOLOBO = 0;
    //                 }
    //                 else if (dataValDLB != 99998.00 && dataValDLB != 99998 && dataValDLB != 99999 && dataValDLB != 99999.00) {
    //                     outFlagDOLOBO = outFlagDOLOBO + 1;
    //                 }
    //             }
    //         }
    //         arrDLBDetail.push(dataValDLB);
    //     }

    //     if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick != 0) {
    //         if (outFlagHTD != 0 || outFlagThickness != 0 || outFlagDOLOBO != 0) {
    //             remark = 'Not Complies';
    //         } else {
    //             remark = 'Complies';
    //         }
    //     } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick != 0) {
    //         if (outFlagHTD != 0 || outFlagThickness != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     } else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
    //         if (outFlagHTD != 0 || outFlagDOLOBO != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
    //         if (outFlagHTD != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     } else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard == 0 && masterData.NomThick != 0) {
    //         if (outFlagThickness != 0 || outFlagDOLOBO != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     } else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard == 0 && masterData.NomThick == 0) {
    //         if (outFlagDOLOBO != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard == 0 && masterData.NomThick != 0) {
    //         if (outFlagThickness != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     }
    //     else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick != 0) {
    //         if (outFlagHTD != 0) {
    //             remark = 'Not Complies'
    //         } else {
    //             remark = 'Complies';
    //         }
    //     }

    //     // for (var j = 0; j < arrHTDetail.length; j++) {
    //     //     sumHT = sumHT + parseFloat(arrHTDetail[j]);
    //     // }
    //     for (var k = 0; k < arrTDetail.length; k++) {
    //         sumT = sumT + parseFloat(arrTDetail[k]);
    //     }
    //     for (var l = 0; l < arrDLBDetail.length; l++) {
    //         sumDLB = sumDLB + parseFloat(arrDLBDetail[l]);
    //     }



    //     var resOfSP = await objStoreProcedure.fetchDetailForStats(resultForHardess, 7, masterData.RepSerNo);
    //     var MaxHard = resOfSP[1][0]['@maxWeight'];//Math.max(...arrDetail);
    //     var MinHard = resOfSP[1][0]['@minWeight']; //Math.min(...arrDetail);
    //     var avgHard = resOfSP[1][0]['@average'];  //(finalSum / count);
    //     //dataValDLB != 99998.00 && dataValDLB != 99998 && dataValDLB != 99999 && dataValDLB != 99999.00


    //     if (MinHard == 99998.00 || MinHard == 99998 || MinHard == 99999 || MinHard == 99999.00) {
    //         avgHard = 99999.00;
    //         MaxHard = 99999.00;
    //     }
    //     else if (MaxHard == 99998.00 || MaxHard == 99998 || MaxHard == 99999 || MaxHard == 99999.00) {
    //         avgHard = 99998.00;
    //         MinHard = 99999.00;
    //     }
    //     // var MaxHard = Math.max(...arrHTDetail);
    //     // var MinHard = Math.min(...arrHTDetail);
    //     // var avgHard = (sumHT / count);
    //     // date 05/01/2021 all aggregation values will be in db @sheetal @pradip
    //     var MaxThick = Math.max(...arrTDetail);
    //     var MinThick = Math.min(...arrTDetail);
    //     var AvgThick = (sumT / count);
    //     var MaxDLB = Math.max(...arrDLBDetail);
    //     var MinDLB = Math.min(...arrDLBDetail);
    //     var AvgDLB = (sumDLB / count);
    //     if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {
    //         // let res = await proObj.productData(cubicalObj);
    //         // var paramNom = `Param7_Nom`;
    //         // var limitNo = `Param7_LimitOn`;
    //         // var nom = parseFloat(res[1][paramNom]);
    //         // var limit = res[1][limitNo].readUIntLE();
    //         // if(masterData.ColHeadDOLOBO == 'Le')

    //         const checkMasterObj = {
    //             str_tableName: 'tbl_batchsummary_master_hdlb',
    //             data: 'MAX(RepSerNo) AS SrNo',
    //             condition: [
    //                 { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
    //                 { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
    //                 { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
    //                 { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
    //                 { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
    //                 { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
    //                 { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
    //             ]
    //         }
    //         var masterSrNo;
    //         // let DP = await objDP.precision(resultdata.incompleteData.T2PosTol);
    //         let resultData = await database.select(checkMasterObj);
    //         let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master_hdlb', 'tbl_batchsummary_detail_hdlb', masterData);
    //         if (resultData[0][0].SrNo == null) {
    //             let masterDataInsert = {
    //                 str_tableName: 'tbl_batchsummary_master_hdlb',
    //                 data: [
    //                     { str_colName: 'BFGCode', value: masterData.BFGCode },
    //                     { str_colName: 'ProductName', value: masterData.ProductName },
    //                     { str_colName: 'PVersion', value: masterData.PVersion },
    //                     { str_colName: 'Version', value: masterData.Version },
    //                     { str_colName: 'PrdType', value: 1 },
    //                     { str_colName: 'CubType', value: masterData.CubicleType },
    //                     { str_colName: 'BatchNo', value: masterData.BatchNo },
    //                     { str_colName: 'Stage', value: masterData.Stage },
    //                     { str_colName: 'Dept', value: cubicalObj.Sys_dept },
    //                     { str_colName: 'NomHard', value: masterData.NomHard },
    //                     { str_colName: 'LwrHard', value: masterData.NegTolHard },
    //                     { str_colName: 'UppHard', value: masterData.PosTolHard },
    //                     { str_colName: 'UnitHard', value: masterData.Unit },
    //                     { str_colName: 'NomThick', value: masterData.NomThick },
    //                     { str_colName: 'LwrThick', value: masterData.NegTolThick },
    //                     { str_colName: 'UppThick', value: masterData.PosTolThick },
    //                     { str_colName: 'NomDLB', value: masterData.NomDOLOBO },
    //                     { str_colName: 'LwrDLB', value: masterData.NegTolDOLOBO },
    //                     { str_colName: 'UppDLB', value: masterData.PosTolDOLOBO },
    //                     { str_colName: 'DLBParamName', value: masterData.ColHeadDOLOBO },
    //                     { str_colName: 'Side', value: sideVal },
    //                     { str_colName: 'BatchCompleted', value: masterData.BatchComplete[0] },
    //                     { str_colName: 'IsArchived', value: masterData.IsArchived[0] },
    //                     { str_colName: 'LimitOn', value: 0 },
    //                     { str_colName: 'Area', value: cubicalObj.Sys_Area },
    //                     { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
    //                     { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
    //                     { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
    //                     { str_colName: 'ReportType', value: masterData.GraphType },
    //                 ]
    //             }
    //             let saveBatchSumm = await database.save(masterDataInsert);
    //             masterSrNo = saveBatchSumm[0].insertId;
    //             const objInsertDetailData = {
    //                 str_tableName: 'tbl_batchsummary_detail_hdlb',
    //                 data: [
    //                     { str_colName: 'RepSerNo', value: masterSrNo },
    //                     { str_colName: 'RecSeqNo', value: recSeqNo },
    //                     { str_colName: 'Date', value: masterData.PrDate },
    //                     { str_colName: 'Time', value: masterData.PrTime },
    //                     { str_colName: 'InstrumentID', value: masterData.HardnessID },
    //                     { str_colName: 'Side', value: sideVal },
    //                     { str_colName: 'MinHard', value: MinHard },
    //                     { str_colName: 'MaxHard', value: MaxHard },
    //                     { str_colName: 'AvgHard', value: avgHard },
    //                     { str_colName: 'MinThick', value: MinThick },
    //                     { str_colName: 'MaxThick', value: MaxThick },
    //                     { str_colName: 'AvgThick', value: AvgThick },
    //                     { str_colName: 'MinDLB', value: MinDLB },
    //                     { str_colName: 'MaxDLB', value: MaxDLB },
    //                     { str_colName: 'AvgDLB', value: AvgDLB },
    //                     // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
    //                     // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
    //                     { str_colName: 'TestResult', value: remark },
    //                     { str_colName: 'UserID', value: masterData.UserId },
    //                     { str_colName: 'UserName', value: masterData.UserName },
    //                     { str_colName: 'HardDP', value: masterData.DecimalPoint },

    //                 ]
    //             }
    //             //console.log(objInsertDetailData);
    //             let detailResult1 = await database.save(objInsertDetailData);
    //             Object.assign(responseObj, { status: 'success' })
    //             return responseObj;

    //         } else {
    //             masterSrNo = resultData[0][0].SrNo;
    //             //     const checkDetailObj = {
    //             //         str_tableName: detailTable,
    //             //         data: 'MAX(RecSeqNo) AS SeqNo',
    //             //         condition: [
    //             //             { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
    //             //         ]
    //             //     }
    //             //    let detailres = await database.select(checkDetailObj);
    //             //         var seqNum = detailres[0][0].SeqNo;
    //             //         var seqNo = seqNum + 1;
    //             const objInsertDetailData = {
    //                 str_tableName: 'tbl_batchsummary_detail_hdlb',
    //                 data: [
    //                     { str_colName: 'RepSerNo', value: masterSrNo },
    //                     { str_colName: 'RecSeqNo', value: recSeqNo },
    //                     { str_colName: 'Date', value: masterData.PrDate },
    //                     { str_colName: 'Time', value: masterData.PrTime },
    //                     { str_colName: 'InstrumentID', value: masterData.HardnessID },
    //                     { str_colName: 'Side', value: sideVal },
    //                     { str_colName: 'MinHard', value: MinHard },
    //                     { str_colName: 'MaxHard', value: MaxHard },
    //                     { str_colName: 'AvgHard', value: avgHard },
    //                     { str_colName: 'MinThick', value: MinThick },
    //                     { str_colName: 'MaxThick', value: MaxThick },
    //                     { str_colName: 'AvgThick', value: AvgThick },
    //                     { str_colName: 'MinDLB', value: MinDLB },
    //                     { str_colName: 'MaxDLB', value: MaxDLB },
    //                     { str_colName: 'AvgDLB', value: AvgDLB },
    //                     // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
    //                     // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
    //                     { str_colName: 'TestResult', value: remark },
    //                     { str_colName: 'UserID', value: masterData.UserId },
    //                     { str_colName: 'UserName', value: masterData.UserName },
    //                     { str_colName: 'HardDP', value: masterData.DecimalPoint },
    //                 ]
    //             }
    //             await database.save(objInsertDetailData);
    //             Object.assign(responseObj, { status: 'success' })
    //             return responseObj;
    //         }
    //     }
    //     else {
    //         return remark;
    //     }
    // }


    async saveBatchDataHardness(masterData, DetailData, idsNo) {
        var now = new Date();
        let responseObj = {};
        var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = idsNo;
        }
        // console.log(masterData, DetailData);
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);

        let sideVal = "NA";
        if (masterData.Side == 'LHS') {
            sideVal = "LEFT";
        } else if (masterData.Side == 'RHS') {
            sideVal = "RIGHT";
        } else {
            sideVal = "NA";
        }
        let checkSideMasterTable;
        if (masterData.Side == 'NA') {
            checkSideMasterTable = masterData.Side;
        } else {
            checkSideMasterTable = 'LEFT';
        }
        let sumHT = 0;
        let sumT = 0;
        let sumDLB = 0;
        let arrHTDetail = [];
        let arrTDetail = [];
        let arrDLBDetail = [];
        let outFlagHTD = 0;
        let outFlagThickness = 0;
        let outFlagDOLOBO = 0;
        let remark;
        let maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
        let minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
        let nominalHardness = parseFloat(tempLimObj.Hardness.nominal)
        if (tempLimObj.Thickness == undefined) {
            var maxTLimit = 0;
            var minTLimit = 0;
        } else {
            var maxTLimit = parseFloat(formulaFun.upperLimit(tempLimObj.Thickness));
            var minTLimit = parseFloat(formulaFun.lowerLimit(tempLimObj.Thickness));
        }

        // if(masterData.NomDOLOBO != 0) {
        if (masterData.ColHeadDOLOBO == 'NA') {
            var maxDLBLimit = 0;
            var minDLBLimit = 0;
        } else {
            if (tempLimObj.length == undefined && tempLimObj.Breadth == undefined && tempLimObj.Diameter == undefined) {
                var maxDLBLimit = 0;
                var minDLBLimit = 0;
            } else {
                var maxDLBLimit = parseFloat(formulaFun.upperLimit(tempLimObj[masterData.ColHeadDOLOBO]));
                var minDLBLimit = parseFloat(formulaFun.lowerLimit(tempLimObj[masterData.ColHeadDOLOBO]));
            }

        }


        let count = DetailData.length;
        for (var i = 0; i < DetailData.length; i++) {
            var dataValHard = parseFloat(DetailData[i].DataValueHard);
            if (nominalHardness == '99999.00000') {
                if (minHTDLimit == 0) {//NLT=0
                    remark = dataValHard > maxHTDLimit ? 'Not Complies' : 'Complies';
                }

                if (maxHTDLimit == 0) {//NMT=0
                    remark = dataValHard < minHTDLimit ? 'Not Complies' : 'Complies';
                }

            }
            if (nominalHardness != '99999.00000') {
                if (minHTDLimit == 0 || maxHTDLimit == 0) {
                    if (minHTDLimit == 0) {//NLT=0
                        remark = dataValHard > maxHTDLimit ? 'Not Complies' : 'Complies';
                    }

                    if (maxHTDLimit == 0) {//NMT=0
                        remark = dataValHard < minHTDLimit ? 'Not Complies' : 'Complies';
                    }
                }
                else {
                    if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
                        outFlagHTD = outFlagHTD + 1;
                    }
                }


            }


            arrHTDetail.push(dataValHard);

            var dataValThick = parseFloat(DetailData[i].DataValueThick);
            var dataValDLB = parseFloat(DetailData[i].DataValueDOLOBO);
            if (dataValThick != 99999 || dataValThick != '99999.00000') {

                if (minTLimit != 0 && maxTLimit != 0) {
                    if ((minTLimit > dataValThick) || (dataValThick > maxTLimit)) {
                        outFlagThickness = outFlagThickness + 1;
                    }
                }
                arrTDetail.push(dataValThick);
            }
            if (dataValDLB != 99999 || dataValDLB != '99999.00000') {

                if (minDLBLimit != 0 && maxDLBLimit != 0) {
                    if ((minDLBLimit > dataValDLB) || (dataValDLB > maxDLBLimit)) {
                        outFlagDOLOBO = outFlagDOLOBO + 1;
                    }
                }
                arrDLBDetail.push(dataValDLB);
            }
        }
        if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick) {
            if (outFlagHTD != 0 || outFlagThickness != 0 || outFlagDOLOBO != 0) {
                remark = 'Not Complies';
            } else {
                remark = 'Complies';
            }
        } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick != 0) {
            if (outFlagHTD != 0 || outFlagThickness != 0) {
                remark = 'Not Complies'
            } else {
                remark = 'Complies';
            }
        } else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
            if (outFlagHTD != 0 || outFlagDOLOBO != 0) {
                remark = 'Not Complies'
            } else {
                remark = 'Complies';
            }
        } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
            if (outFlagHTD != 0) {
                remark = 'Not Complies'
            } else {
                remark = 'Complies';
            }
        }
        //         else if (masterData.NomHard == '99999.00000' && 
        // )
        //         {

        //             }
        for (var j = 0; j < arrHTDetail.length; j++) {
            sumHT = sumHT + parseFloat(arrHTDetail[j]);
        }
        for (var k = 0; k < arrTDetail.length; k++) {
            sumT = sumT + parseFloat(arrTDetail[k]);
        }
        for (var l = 0; l < arrDLBDetail.length; l++) {
            sumDLB = sumDLB + parseFloat(arrDLBDetail[l]);
        }
        var MaxHard = Math.max(...arrHTDetail);
        var MinHard = Math.min(...arrHTDetail);
        var avgHard = (sumHT / count);
        var MaxThick = Math.max(...arrTDetail);
        var MinThick = Math.min(...arrTDetail);
        var AvgThick = (sumT / count);
        var MaxDLB = Math.max(...arrDLBDetail);
        var MinDLB = Math.min(...arrDLBDetail);
        var AvgDLB = (sumDLB / count);
        if (((cubicalObj.Sys_RptType == 0) && (currentCubicle.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {
            // let res = await proObj.productData(cubicalObj);
            // var paramNom = `Param7_Nom`;
            // var limitNo = `Param7_LimitOn`;
            // var nom = parseFloat(res[1][paramNom]);
            // var limit = res[1][limitNo].readUIntLE();
            // if(masterData.ColHeadDOLOBO == 'Le')

            const checkMasterObj = {
                str_tableName: 'tbl_batchsummary_master_hdlb',
                data: 'MAX(RepSerNo) AS SrNo',
                condition: [
                    { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
                    { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                    { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                    { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
                ]
            }
            var masterSrNo;
            // let DP = await objDP.precision(resultdata.incompleteData.T2PosTol);
            let resultData = await database.select(checkMasterObj);
            let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master_hdlb', 'tbl_batchsummary_detail_hdlb', masterData);
            if (resultData[0][0].SrNo == null) {
                let masterDataInsert = {
                    str_tableName: 'tbl_batchsummary_master_hdlb',
                    data: [
                        { str_colName: 'BFGCode', value: masterData.BFGCode },
                        { str_colName: 'ProductName', value: masterData.ProductName },
                        { str_colName: 'PVersion', value: masterData.PVersion },
                        { str_colName: 'Version', value: masterData.Version },
                        { str_colName: 'PrdType', value: 1 },
                        { str_colName: 'CubType', value: masterData.CubicleType },
                        { str_colName: 'BatchNo', value: masterData.BatchNo },
                        { str_colName: 'Stage', value: masterData.Stage },
                        { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                        { str_colName: 'NomHard', value: masterData.NomHard },
                        { str_colName: 'LwrHard', value: masterData.NegTolHard },
                        { str_colName: 'UppHard', value: masterData.PosTolHard },
                        { str_colName: 'UnitHard', value: masterData.Unit },
                        { str_colName: 'NomThick', value: masterData.NomThick },
                        { str_colName: 'LwrThick', value: masterData.NegTolThick },
                        { str_colName: 'UppThick', value: masterData.PosTolThick },
                        { str_colName: 'NomDLB', value: masterData.NomDOLOBO },
                        { str_colName: 'LwrDLB', value: masterData.NegTolDOLOBO },
                        { str_colName: 'UppDLB', value: masterData.PosTolDOLOBO },
                        { str_colName: 'DLBParamName', value: masterData.ColHeadDOLOBO },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'BatchCompleted', value: masterData.BatchComplete[0] },
                        { str_colName: 'IsArchived', value: masterData.IsArchived[0] },
                        { str_colName: 'LimitOn', value: 0 },
                        { str_colName: 'Area', value: masterData.Area }
                    ]
                }
                let saveBatchSumm = await database.save(masterDataInsert);
                masterSrNo = saveBatchSumm[0].insertId;
                const objInsertDetailData = {
                    str_tableName: 'tbl_batchsummary_detail_hdlb',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: masterData.PrDate },
                        { str_colName: 'Time', value: masterData.PrTime },
                        { str_colName: 'InstrumentID', value: masterData.HardnessID },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'MinHard', value: MinHard },
                        { str_colName: 'MaxHard', value: MaxHard },
                        { str_colName: 'AvgHard', value: avgHard },
                        { str_colName: 'MinThick', value: MinThick },
                        { str_colName: 'MaxThick', value: MaxThick },
                        { str_colName: 'AvgThick', value: AvgThick },
                        { str_colName: 'MinDLB', value: MinDLB },
                        { str_colName: 'MaxDLB', value: MaxDLB },
                        { str_colName: 'AvgDLB', value: AvgDLB },
                        // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                        // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'TestResult', value: remark },
                        { str_colName: 'UserID', value: masterData.UserId },
                        { str_colName: 'UserName', value: masterData.UserName },

                    ]
                }
                //console.log(objInsertDetailData);
                let detailResult1 = await database.save(objInsertDetailData);
                Object.assign(responseObj, { status: 'success' })
                return responseObj;

            } else {
                masterSrNo = resultData[0][0].SrNo;
                //     const checkDetailObj = {
                //         str_tableName: detailTable,
                //         data: 'MAX(RecSeqNo) AS SeqNo',
                //         condition: [
                //             { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
                //         ]
                //     }
                //    let detailres = await database.select(checkDetailObj);
                //         var seqNum = detailres[0][0].SeqNo;
                //         var seqNo = seqNum + 1;
                const objInsertDetailData = {
                    str_tableName: 'tbl_batchsummary_detail_hdlb',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: masterData.PrDate },
                        { str_colName: 'Time', value: masterData.PrTime },
                        { str_colName: 'InstrumentID', value: masterData.HardnessID },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'MinHard', value: MinHard },
                        { str_colName: 'MaxHard', value: MaxHard },
                        { str_colName: 'AvgHard', value: avgHard },
                        { str_colName: 'MinThick', value: MinThick },
                        { str_colName: 'MaxThick', value: MaxThick },
                        { str_colName: 'AvgThick', value: AvgThick },
                        { str_colName: 'MinDLB', value: MinDLB },
                        { str_colName: 'MaxDLB', value: MaxDLB },
                        { str_colName: 'AvgDLB', value: AvgDLB },
                        // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                        // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'TestResult', value: remark },
                        { str_colName: 'UserID', value: masterData.UserId },
                        { str_colName: 'UserName', value: masterData.UserName },
                    ]
                }
                await database.save(objInsertDetailData);
                Object.assign(responseObj, { status: 'success' })
                return responseObj;
            }
        }
    }


    async saveBatchDataHardness8M(masterData, DetailData, idsNo) {
        var now = new Date();
        let responseObj = {};
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = idsNo;
        }
        // console.log(masterData, DetailData);
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
        let resultForHardess = {};
        // masterData.RepSerNo
        Object.assign(resultForHardess,
            { incompleteTableName: 'tbl_tab_master7_incomplete' },
            { incompletedetailTableName: 'tbl_tab_detail7_incomplete' },
        )

        let sideVal = "NA";
        if (masterData.Side == 'LHS') {
            sideVal = "LEFT";
        } else if (masterData.Side == 'RHS') {
            sideVal = "RIGHT";
        } else {
            sideVal = "NA";
        }
        let checkSideMasterTable;
        if (masterData.Side == 'NA') {
            checkSideMasterTable = masterData.Side;
        } else {
            checkSideMasterTable = 'LEFT';
        }
        let sumHT = 0;
        let arrHTDetail = [];
        let outFlagHTD = 0;
        let remark = "";
        let maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
        let minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
        let count = DetailData.length;
        for (var i = 0; i < DetailData.length; i++) {
            var dataValHard = parseFloat(DetailData[i].DataValue);
            if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
                outFlagHTD = outFlagHTD + 1;
            }
            arrHTDetail.push(dataValHard);
        }
        if (masterData.T1NegTol != 0) {
            if (outFlagHTD != 0) {
                remark = 'Not Complies';
            } else {
                remark = 'Complies';
            }
        }

        var resOfSP = await objStoreProcedure.fetchDetailForStats(resultForHardess, 7, masterData.RepSerNo);
        var MaxHard = resOfSP[1][0]['@maxWeight'];//Math.max(...arrDetail);
        var MinHard = resOfSP[1][0]['@minWeight']; //Math.min(...arrDetail);
        var avgHard = resOfSP[1][0]['@average'];  //(finalSum / count);
        if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {
            // let res = await proObj.productData(cubicalObj);
            // var paramNom = `Param7_Nom`;
            // var limitNo = `Param7_LimitOn`;
            // var nom = parseFloat(res[1][paramNom]);
            // var limit = res[1][limitNo].readUIntLE();
            // if(masterData.ColHeadDOLOBO == 'Le')

            const checkMasterObj = {
                str_tableName: 'tbl_batchsummary_master7',
                data: 'MAX(RepSerNo) AS SrNo',
                condition: [
                    { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
                    { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                    { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                    { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
                ]
            }
            var masterSrNo;
            // let DP = await objDP.precision(resultdata.incompleteData.T2PosTol);
            let resultData = await database.select(checkMasterObj);
            let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master7', 'tbl_batchsummary_detail7', masterData);
            if (resultData[0][0].SrNo == null) {
                let masterDataInsert = {
                    str_tableName: 'tbl_batchsummary_master7',
                    data: [
                        { str_colName: 'BFGCode', value: masterData.BFGCode },
                        { str_colName: 'ProductName', value: masterData.ProductName },
                        { str_colName: 'PVersion', value: masterData.PVersion },
                        { str_colName: 'Version', value: masterData.Version },
                        { str_colName: 'PrdType', value: 1 },
                        { str_colName: 'CubType', value: masterData.CubicleType },
                        { str_colName: 'BatchNo', value: masterData.BatchNo },
                        { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                        { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                        { str_colName: 'Nom', value: masterData.Nom },
                        { str_colName: 'Tol1Neg', value: masterData.T1NegTol },
                        { str_colName: 'Tol1Pos', value: masterData.T1PosTol },
                        // { str_colName: 'Tol2Neg', value: masterData.Unit },
                        // { str_colName: 'Tol2Pos', value: masterData.NomThick },
                        { str_colName: 'DP', value: 2 },
                        { str_colName: 'Unit', value: masterData.Unit },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'BatchCompleted', value: masterData.BatchComplete[0] },
                        { str_colName: 'IsArchived', value: masterData.IsArchived[0] },
                        { str_colName: 'LimitOn', value: 0 },
                        { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                        { str_colName: 'ReportType', value: masterData.GraphType },

                    ]
                }
                let saveBatchSumm = await database.save(masterDataInsert);
                masterSrNo = saveBatchSumm[0].insertId;
                const objInsertDetailData = {
                    str_tableName: 'tbl_batchsummary_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: masterData.PrDate },
                        { str_colName: 'Time', value: masterData.PrTime },
                        { str_colName: 'InstrumentID', value: masterData.HardnessID },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'Min', value: MinHard },
                        { str_colName: 'Max', value: MaxHard },
                        { str_colName: 'Avg', value: avgHard },
                        // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                        // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'TestResult', value: remark },
                        { str_colName: 'UserID', value: masterData.UserId },
                        { str_colName: 'UserName', value: masterData.UserName },

                    ]
                }
                //console.log(objInsertDetailData);
                let detailResult1 = await database.save(objInsertDetailData);
                Object.assign(responseObj, { status: 'success' })
                return remark;

            } else {
                masterSrNo = resultData[0][0].SrNo;
                //     const checkDetailObj = {
                //         str_tableName: detailTable,
                //         data: 'MAX(RecSeqNo) AS SeqNo',
                //         condition: [
                //             { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
                //         ]
                //     }
                //    let detailres = await database.select(checkDetailObj);
                //         var seqNum = detailres[0][0].SeqNo;
                //         var seqNo = seqNum + 1;
                const objInsertDetailData = {
                    str_tableName: 'tbl_batchsummary_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: masterData.PrDate },
                        { str_colName: 'Time', value: masterData.PrTime },
                        { str_colName: 'InstrumentID', value: masterData.HardnessID },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'Min', value: MinHard },
                        { str_colName: 'Max', value: MaxHard },
                        { str_colName: 'Avg', value: avgHard },
                        // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                        // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'TestResult', value: remark },
                        { str_colName: 'UserID', value: masterData.UserId },
                        { str_colName: 'UserName', value: masterData.UserName },
                    ]
                }
                await database.save(objInsertDetailData);
                Object.assign(responseObj, { status: 'success' })
                return remark;
            }
        }
        else {
            return remark;
        }
    }

    async saveBatchDataHardnessMT50(masterData, DetailData, idsNo) {
        var now = new Date();
        let responseObj = {};
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = idsNo;
        }
        // console.log(masterData, DetailData);
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
        let resultForHardess = {};
        // masterData.RepSerNo
        Object.assign(resultForHardess,
            { incompleteTableName: 'tbl_tab_master7_incomplete' },
            { incompletedetailTableName: 'tbl_tab_detail7_incomplete' },
        )

        let sideVal = "NA";
        if (masterData.Side == 'LHS') {
            sideVal = "LEFT";
        } else if (masterData.Side == 'RHS') {
            sideVal = "RIGHT";
        } else {
            sideVal = "NA";
        }
        let checkSideMasterTable;
        if (masterData.Side == 'NA') {
            checkSideMasterTable = masterData.Side;
        } else {
            checkSideMasterTable = 'LEFT';
        }
        let sumHT = 0;
        let arrHTDetail = [];
        let outFlagHTD = 0;
        let remark = "";
        let maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
        let minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
        let count = DetailData.length;
        for (var i = 0; i < DetailData.length; i++) {
            var dataValHard = parseFloat(DetailData[i].DataValue);
            if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
                outFlagHTD = outFlagHTD + 1;
            }
            arrHTDetail.push(dataValHard);
        }
        if (masterData.T1NegTol != 0) {
            if (outFlagHTD != 0) {
                remark = 'Not Complies';
            } else {
                remark = 'Complies';
            }
        }

        var resOfSP = await objStoreProcedure.fetchDetailForStats(resultForHardess, 7, masterData.RepSerNo);
        var MaxHard = resOfSP[1][0]['@maxWeight'];//Math.max(...arrDetail);
        var MinHard = resOfSP[1][0]['@minWeight']; //Math.min(...arrDetail);
        var avgHard = resOfSP[1][0]['@average'];  //(finalSum / count);
        if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {

            const checkMasterObj = {
                str_tableName: 'tbl_batchsummary_master7',
                data: 'MAX(RepSerNo) AS SrNo',
                condition: [
                    { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
                    { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                    { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                    { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
                ]
            }
            var masterSrNo;
            // let DP = await objDP.precision(resultdata.incompleteData.T2PosTol);
            let resultData = await database.select(checkMasterObj);
            let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master7', 'tbl_batchsummary_detail7', masterData);
            if (resultData[0][0].SrNo == null) {
                let masterDataInsert = {
                    str_tableName: 'tbl_batchsummary_master7',
                    data: [
                        { str_colName: 'BFGCode', value: masterData.BFGCode },
                        { str_colName: 'ProductName', value: masterData.ProductName },
                        { str_colName: 'PVersion', value: masterData.PVersion },
                        { str_colName: 'Version', value: masterData.Version },
                        { str_colName: 'PrdType', value: 1 },
                        { str_colName: 'CubType', value: masterData.CubicleType },
                        { str_colName: 'BatchNo', value: masterData.BatchNo },
                        // { str_colName: 'Stage', value: masterData.Stage },
                        { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                        { str_colName: 'Nom', value: masterData.Nom },
                        { str_colName: 'Tol1Neg', value: masterData.T1NegTol },
                        { str_colName: 'Tol1Pos', value: masterData.T1PosTol },
                        // { str_colName: 'Tol2Neg', value: masterData.Unit },
                        // { str_colName: 'Tol2Pos', value: masterData.NomThick },
                        { str_colName: 'DP', value: 2 },
                        { str_colName: 'Unit', value: masterData.Unit },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'BatchCompleted', value: masterData.BatchComplete[0] },
                        { str_colName: 'IsArchived', value: masterData.IsArchived[0] },
                        { str_colName: 'LimitOn', value: 0 },
                        { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                        { str_colName: 'ReportType', value: masterData.GraphType },

                    ]
                }
                let saveBatchSumm = await database.save(masterDataInsert);
                masterSrNo = saveBatchSumm[0].insertId;
                const objInsertDetailData = {
                    str_tableName: 'tbl_batchsummary_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: masterData.PrDate },
                        { str_colName: 'Time', value: masterData.PrTime },
                        { str_colName: 'InstrumentID', value: masterData.HardnessID },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'Min', value: MinHard },
                        { str_colName: 'Max', value: MaxHard },
                        { str_colName: 'Avg', value: avgHard },
                        // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                        // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'TestResult', value: remark },
                        { str_colName: 'UserID', value: masterData.UserId },
                        { str_colName: 'UserName', value: masterData.UserName },

                    ]
                }
                //console.log(objInsertDetailData);
                let detailResult1 = await database.save(objInsertDetailData);
                Object.assign(responseObj, { status: 'success' })
                return remark;

            } else {
                masterSrNo = resultData[0][0].SrNo;
                const objInsertDetailData = {
                    str_tableName: 'tbl_batchsummary_detail7',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: masterData.PrDate },
                        { str_colName: 'Time', value: masterData.PrTime },
                        { str_colName: 'InstrumentID', value: masterData.HardnessID },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'Min', value: MinHard },
                        { str_colName: 'Max', value: MaxHard },
                        { str_colName: 'Avg', value: avgHard },
                        // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                        // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                        { str_colName: 'TestResult', value: remark },
                        { str_colName: 'UserID', value: masterData.UserId },
                        { str_colName: 'UserName', value: masterData.UserName },
                    ]
                }
                await database.save(objInsertDetailData);
                Object.assign(responseObj, { status: 'success' })
                return remark;
            }
        }
        else {
            return remark;
        }
    }

    async saveBatchDataHardnessKraemer(masterData, DetailData, idsNo) {
        try {
            var now = new Date();
            let responseObj = {};
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = idsNo;
            }
            // console.log(masterData, DetailData);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
            let resultForHardess = {};
            // masterData.RepSerNo
            Object.assign(resultForHardess,
                { incompleteTableName: 'tbl_tab_master7_incomplete' },
                { incompletedetailTableName: 'tbl_tab_detail7_incomplete' },
            )

            let sideVal = "NA";
            if (masterData.Side == 'LHS') {
                sideVal = "LEFT";
            } else if (masterData.Side == 'RHS') {
                sideVal = "RIGHT";
            } else {
                sideVal = "NA";
            }
            let checkSideMasterTable;
            if (masterData.Side == 'NA') {
                checkSideMasterTable = masterData.Side;
            } else {
                checkSideMasterTable = 'LEFT';
            }
            let sumHT = 0;
            let arrHTDetail = [];
            let outFlagHTD = 0;
            let remark = "";
            let maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
            let minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
            let count = DetailData.length;
            for (var i = 0; i < DetailData.length; i++) {
                var dataValHard = parseFloat(DetailData[i].DataValue);
                if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
                    outFlagHTD = outFlagHTD + 1;
                }
                arrHTDetail.push(dataValHard);
            }
            if (masterData.T1NegTol != 0) {
                if (outFlagHTD != 0) {
                    remark = 'Not Complies';
                } else {
                    remark = 'Complies';
                }
            }

            var resOfSP = await objStoreProcedure.fetchDetailForStats(resultForHardess, 7, masterData.RepSerNo);
            var MaxHard = resOfSP[1][0]['@maxWeight'];//Math.max(...arrDetail);
            var MinHard = resOfSP[1][0]['@minWeight']; //Math.min(...arrDetail);
            var avgHard = resOfSP[1][0]['@average'];  //(finalSum / count);
            if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {

                const checkMasterObj = {
                    str_tableName: 'tbl_batchsummary_master7',
                    data: 'MAX(RepSerNo) AS SrNo',
                    condition: [
                        { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
                        { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
                        { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
                        { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                        { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                        { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
                    ]
                }
                var masterSrNo;
                // let DP = await objDP.precision(resultdata.incompleteData.T2PosTol);
                let resultData = await database.select(checkMasterObj);
                let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master7', 'tbl_batchsummary_detail7', masterData);
                if (resultData[0][0].SrNo == null) {
                    let masterDataInsert = {
                        str_tableName: 'tbl_batchsummary_master7',
                        data: [
                            { str_colName: 'BFGCode', value: masterData.BFGCode },
                            { str_colName: 'ProductName', value: masterData.ProductName },
                            { str_colName: 'PVersion', value: masterData.PVersion },
                            { str_colName: 'Version', value: masterData.Version },
                            { str_colName: 'PrdType', value: 1 },
                            { str_colName: 'CubType', value: masterData.CubicleType },
                            { str_colName: 'BatchNo', value: masterData.BatchNo },
                            // { str_colName: 'Stage', value: masterData.Stage },
                            { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                            { str_colName: 'Nom', value: masterData.Nom },
                            { str_colName: 'Tol1Neg', value: masterData.T1NegTol },
                            { str_colName: 'Tol1Pos', value: masterData.T1PosTol },
                            // { str_colName: 'Tol2Neg', value: masterData.Unit },
                            // { str_colName: 'Tol2Pos', value: masterData.NomThick },
                            { str_colName: 'DP', value: 2 },
                            { str_colName: 'Unit', value: masterData.Unit },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'BatchCompleted', value: masterData.BatchComplete[0] },
                            { str_colName: 'IsArchived', value: masterData.IsArchived[0] },
                            { str_colName: 'LimitOn', value: 0 },
                            { str_colName: 'Area', value: cubicalObj.Sys_Area },
                            { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                            { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'ReportType', value: masterData.GraphType },
                        ]
                    }
                    let saveBatchSumm = await database.save(masterDataInsert);
                    masterSrNo = saveBatchSumm[0].insertId;
                    const objInsertDetailData = {
                        str_tableName: 'tbl_batchsummary_detail7',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.HardnessID },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'Min', value: MinHard },
                            { str_colName: 'Max', value: MaxHard },
                            { str_colName: 'Avg', value: avgHard },
                            // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                            // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    let detailResult1 = await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return remark;

                } else {
                    masterSrNo = resultData[0][0].SrNo;
                    const objInsertDetailData = {
                        str_tableName: 'tbl_batchsummary_detail7',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.HardnessID },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'Min', value: MinHard },
                            { str_colName: 'Max', value: MaxHard },
                            { str_colName: 'Avg', value: avgHard },
                            // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                            // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },
                        ]
                    }
                    await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return remark;
                }
            }
            else {
                return remark;
            }
        }
        catch (error) {
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
            console.log('error from saveBatchDataHardnessKraemer :' + error)
            throw new Error(error)
        }

    }
    /**
     * 
     * @param {*} masterData 
     * @param {*} idsNo 
     * @description `saveBatchSummaryFriability` Save the batch Summary Data for `Friability`
     */
    async saveBatchSummaryFriability(masterData, idsNo) {
        var now = new Date();
        let responseObj = {};
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = idsNo;
        }
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
        if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {
            let result = "Complies";
            let sideVal = "NA";
            if (masterData.Side == 'Double') {
                sideVal = "LEFT";
            }
            else {
                sideVal = "NA";
            }
            let checkSideMasterTable;
            if (masterData.Side != 'Double') {
                checkSideMasterTable = 'NA';
            } else {
                checkSideMasterTable = 'LEFT';
            }
            const checkMasterObj = {
                str_tableName: 'tbl_batchsummary_master8',
                data: 'MAX(RepSerNo) AS SrNo',
                condition: [
                    { str_colName: 'BFGCode', value: masterData.BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: masterData.ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: masterData.PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: masterData.Version, comp: 'eq' },
                    { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                    { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                    { str_colName: 'BatchNo', value: masterData.BatchNo, comp: 'eq' },
                ]
            }
            var masterSrNo;
            let resultData = await database.select(checkMasterObj);
            let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master8', 'tbl_batchsummary_detail8', masterData);
            let ProdRes = await proObj.productData(cubicalObj);

            if (resultData[0][0].SrNo == null) {
                let masterDataInsert = {
                    str_tableName: 'tbl_batchsummary_master8',
                    data: [
                        { str_colName: 'BFGCode', value: masterData.BFGCode },
                        { str_colName: 'ProductName', value: masterData.ProductName },
                        { str_colName: 'PVersion', value: masterData.PVersion },
                        { str_colName: 'Version', value: masterData.Version },
                        { str_colName: 'PrdType', value: 1 },
                        { str_colName: 'CubType', value: masterData.CubType },
                        { str_colName: 'BatchNo', value: masterData.BatchNo },
                        { str_colName: 'Unit', value: masterData.Unit },
                        { str_colName: 'Dept', value: masterData.Dept },
                        { str_colName: 'Nom', value: masterData.Nom },
                        // { str_colName: 'LwrHard', value: masterData.NegTolHard },
                        // { str_colName: 'UppHard', value: masterData.PosTolHard },
                        // { str_colName: 'UnitHard', value: masterData.Unit },
                        // { str_colName: 'NomThick', value: masterData.NomThick },
                        // { str_colName: 'LwrThick', value: masterData.NegTolThick },
                        // { str_colName: 'UppThick', value: masterData.PosTolThick },
                        // { str_colName: 'NomDLB', value: masterData.NomDOLOBO },
                        // { str_colName: 'LwrDLB', value: masterData.NegTolDOLOBO },
                        // { str_colName: 'UppDLB', value: masterData.PosTolDOLOBO },
                        // { str_colName: 'DLBParamName', value: masterData.ColHeadDOLOBO },
                        { str_colName: 'DP', value: masterData.DP },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'BatchCompleted', value: 0 },
                        { str_colName: 'IsArchived', value: 0 },
                        { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                        { str_colName: 'ReportType', value: masterData.ReportType },
                    ]
                }
                let saveBatchSumm = await database.save(masterDataInsert);
                masterSrNo = saveBatchSumm[0].insertId;
                if (sideVal == 'NA') {
                    /**
                     * @formula
                     * calculation = ((before-After)/Before)*100
                     */
                    let calculation = (((masterData.nwtBeforeTestF - masterData.nwtAfterTestF) / masterData.nwtBeforeTestF) * 100);
                    if (calculation > ProdRes[1].Param8_Nom) {
                        result = "Not Complies";
                    } else {
                        result = "Complies";
                    }
                    const objInsertDetailData = {
                        str_tableName: 'tbl_batchsummary_detail8',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.InstrumentID },
                            { str_colName: 'Side', value: 'NA' },
                            { str_colName: 'Min', value: calculation < 0 ? 0 : calculation },
                            { str_colName: 'Max', value: calculation < 0 ? 0 : calculation },
                            { str_colName: 'Avg', value: calculation < 0 ? 0 : calculation },
                            { str_colName: 'TestResult', value: result },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    //console.log(objInsertDetailData);
                    await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                } else {
                    let resultLHS; let resultRHS;
                    /**
                        * @formula
                        * calculation = ((before-After)/Before)*100
                        */
                    let calculationLHS = (((masterData.lwtBeforeTestF - masterData.lwtAfterTestF) / masterData.lwtBeforeTestF) * 100);
                    if (calculationLHS > ProdRes[1].Param8_Nom) {
                        resultLHS = "Not Complies";
                    } else {
                        resultLHS = "Complies";
                    }
                    const objInsertDetailDataLHS = {
                        str_tableName: 'tbl_batchsummary_detail8',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.InstrumentID },
                            { str_colName: 'Side', value: 'LEFT' },
                            { str_colName: 'Min', value: calculationLHS < 0 ? 0 : calculationLHS },
                            { str_colName: 'Max', value: calculationLHS < 0 ? 0 : calculationLHS },
                            { str_colName: 'Avg', value: calculationLHS < 0 ? 0 : calculationLHS },
                            { str_colName: 'TestResult', value: resultLHS },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    await database.save(objInsertDetailDataLHS);
                    let calculationRHS = (((masterData.rwtBeforeTestF - masterData.rwtAfterTestF) / masterData.rwtBeforeTestF) * 100);
                    if (calculationRHS > ProdRes[1].Param8_Nom) {
                        resultRHS = "Not Complies";
                    } else {
                        resultRHS = "Complies";
                    }
                    const objInsertDetailDataRHS = {
                        str_tableName: 'tbl_batchsummary_detail8',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.InstrumentID },
                            { str_colName: 'Side', value: 'RIGHT' },
                            { str_colName: 'Min', value: calculationRHS < 0 ? 0 : calculationRHS },
                            { str_colName: 'Max', value: calculationRHS < 0 ? 0 : calculationRHS },
                            { str_colName: 'Avg', value: calculationRHS < 0 ? 0 : calculationRHS },
                            { str_colName: 'TestResult', value: resultRHS },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    //console.log(objInsertDetailData);
                    await database.save(objInsertDetailDataRHS);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }
            } else {
                masterSrNo = resultData[0][0].SrNo;
                if (sideVal == 'NA') {
                    /**
                     * @formula
                     * calculation = ((before-After)/Before)*100
                     */
                    let calculation = (((parseFloat(masterData.nwtBeforeTestF) - parseFloat(masterData.nwtAfterTestF)) / parseFloat(masterData.nwtBeforeTestF)) * 100);
                    if (calculation > ProdRes[1].Param8_Nom) {
                        result = "Not Complies";
                    } else {
                        result = "Complies";
                    }
                    const objInsertDetailData = {
                        str_tableName: 'tbl_batchsummary_detail8',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.InstrumentID },
                            { str_colName: 'Side', value: 'NA' },
                            { str_colName: 'Min', value: calculation < 0 ? 0 : calculation },
                            { str_colName: 'Max', value: calculation < 0 ? 0 : calculation },
                            { str_colName: 'Avg', value: calculation < 0 ? 0 : calculation },
                            { str_colName: 'TestResult', value: result },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    //console.log(objInsertDetailData);
                    await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                } else {
                    let resultLHS; let resultRHS;
                    /**
                        * @formula
                        * calculation = ((before-After)/Before)*100
                        */
                    let calculationLHS = (((masterData.lwtBeforeTestF - masterData.lwtAfterTestF) / masterData.lwtBeforeTestF) * 100);
                    if (calculationLHS > ProdRes[1].Param8_Nom) {
                        resultLHS = "Not Complies";
                    } else {
                        resultLHS = "Complies";
                    }
                    const objInsertDetailDataLHS = {
                        str_tableName: 'tbl_batchsummary_detail8',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.InstrumentID },
                            { str_colName: 'Side', value: 'LEFT' },
                            { str_colName: 'Min', value: calculationLHS < 0 ? 0 : calculationLHS },
                            { str_colName: 'Max', value: calculationLHS < 0 ? 0 : calculationLHS },
                            { str_colName: 'Avg', value: calculationLHS < 0 ? 0 : calculationLHS },
                            { str_colName: 'TestResult', value: resultLHS },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    await database.save(objInsertDetailDataLHS);
                    let calculationRHS = (((masterData.rwtBeforeTestF - masterData.rwtAfterTestF) / masterData.rwtBeforeTestF) * 100);
                    if (calculationRHS > ProdRes[1].Param8_Nom) {
                        resultRHS = "Not Complies";
                    } else {
                        resultRHS = "Complies";
                    }
                    const objInsertDetailDataRHS = {
                        str_tableName: 'tbl_batchsummary_detail8',
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: masterData.PrDate },
                            { str_colName: 'Time', value: masterData.PrTime },
                            { str_colName: 'InstrumentID', value: masterData.InstrumentID },
                            { str_colName: 'Side', value: 'RIGHT' },
                            { str_colName: 'Min', value: calculationRHS < 0 ? 0 : calculationRHS },
                            { str_colName: 'Max', value: calculationRHS < 0 ? 0 : calculationRHS },
                            { str_colName: 'Avg', value: calculationRHS < 0 ? 0 : calculationRHS },
                            { str_colName: 'TestResult', value: resultRHS },
                            { str_colName: 'UserID', value: masterData.UserId },
                            { str_colName: 'UserName', value: masterData.UserName },

                        ]
                    }
                    //console.log(objInsertDetailData);
                    await database.save(objInsertDetailDataRHS);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }
            }
        } else {
            return 'success';
        }
    }
    /**
     * 
     * @param {*} masterData 
     * @param {*} idsNo 
     * @param {*} tempLodData 
     * @param {*} tempUserObject 
     * @description  `saveBatchSummaryLOD` Save the batch Summary Data for `LOD`
     */
    async saveBatchSummaryLOD(masterData, idsNo, tempLodData, tempUserObject) {
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = idsNo;
        }
        let tempMenuLOD = globalData.arrLODTypeSelectedMenu.find(k => k.idsNo == idsNo);
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating'))) {
            let sideVal;
            if (cubicalObj.Sys_RotaryType == 'Double') {
                sideVal = "LEFT";
            }
            else {
                sideVal = "NA";
            }
            let checkSideMasterTable;
            if (cubicalObj.Sys_RotaryType != 'Double') {
                checkSideMasterTable = 'NA';
            } else {
                checkSideMasterTable = 'LEFT';
            }
            const checkMasterObj = {
                str_tableName: 'tbl_batchsummary_master16',
                data: 'MAX(RepSerNo) AS SrNo',
                condition: [
                    { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                    { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                    { str_colName: 'CubType', value: cubicalObj.Sys_CubType, comp: 'eq' },
                    { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },

                ]
            }
            var masterSrNo;
            let resultData = await database.select(checkMasterObj);
            let incompleteData = {
                BFGCode: cubicalObj.Sys_BFGCode,
                ProductName: cubicalObj.Sys_ProductName,
                PVersion: cubicalObj.Sys_PVersion,
                Version: cubicalObj.Sys_Version,
                BatchNo: cubicalObj.Sys_Batch
            }
            let recSeqNo = await this.calculateSeqNo(sideVal, 'tbl_batchsummary_master16', 'tbl_batchsummary_detail16', incompleteData);
            let ProdRes = await proObj.productData(cubicalObj);
            let minTemp;
            let maxTemp;
            if (cubicalObj.Sys_Area == 'Effervescent Granulation' || cubicalObj.Sys_Area == 'Granulation') {
                minTemp = ProdRes[1]['Param1_Low'];
                maxTemp = ProdRes[1]['Param1_Upp'];
                switch (tempMenuLOD.selectedLOD) {
                    case 'GRANULES DRY ':
                        minTemp = ProdRes[1]['Param1_Low'];
                        maxTemp = ProdRes[1]['Param1_Upp'];
                        break;
                    case 'GRANULES LUB':
                        minTemp = ProdRes[1]['Param2_Low'];
                        maxTemp = ProdRes[1]['Param2_Upp'];
                        break;
                    case 'LAYER1 DRY':
                        minTemp = ProdRes[1]['Param3_Low'];
                        maxTemp = ProdRes[1]['Param3_Upp'];
                        break;
                    case 'LAYER1 LUB':
                        minTemp = ProdRes[1]['Param4_Low'];
                        maxTemp = ProdRes[1]['Param4_Upp'];
                        break;
                    case 'LAYER2 DRY':
                        minTemp = ProdRes[1]['Param5_Low'];
                        maxTemp = ProdRes[1]['Param5_Upp'];
                        break;
                    case 'LAYER2 LUB':
                        minTemp = ProdRes[1]['Param6_Low'];
                        maxTemp = ProdRes[1]['Param6_Upp'];
                        break;
                }
            } else {
                minTemp = ProdRes[1]['Param16_T1Neg'];
                maxTemp = ProdRes[1]['Param16_T1Pos'];
            }
            var now = new Date();
            let average = (((tempLodData.arr[1].iniWt - tempLodData.arr[2].finalWt) / tempLodData.arr[1].iniWt) * 100);
            let result = 'Complies';
            if ((minTemp < average) && (average < maxTemp)) {
                result = 'Complies';
            } else {
                result = 'Not Complies';
            }
            if (resultData[0][0].SrNo == null) {
                let masterDataInsert = {
                    str_tableName: 'tbl_batchsummary_master16',
                    data: [
                        { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
                        { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName },
                        { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                        { str_colName: 'Version', value: cubicalObj.Sys_Version },
                        { str_colName: 'PrdType', value: 1 },
                        { str_colName: 'CubType', value: cubicalObj.Sys_CubType },
                        { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
                        { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                        { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                        { str_colName: 'LODLayer', value: 'NA' },
                        { str_colName: 'Side', value: sideVal },
                        { str_colName: 'BatchCompleted', value: 0 },
                        { str_colName: 'IsArchived', value: 0 },
                        { str_colName: 'LimitOn', value: 0 },
                        { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                        { str_colName: 'ReportType', value: cubicalObj.Sys_RptType },
                    ]
                }
                let saveBatchSumm = await database.save(masterDataInsert);
                masterSrNo = saveBatchSumm[0].insertId;

                let detailDataInsert = {
                    str_tableName: 'tbl_batchsummary_detail16',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'Time', value: date.format(now, 'HH:mm:ss') },
                        { str_colName: 'InstrumentID', value: cubicalObj.Sys_MoistID },
                        { str_colName: 'Side', value: 'NA' },
                        { str_colName: 'Min', value: minTemp },
                        { str_colName: 'Max', value: maxTemp },
                        { str_colName: 'Avg', value: average },
                        { str_colName: 'TestResult', value: result },
                        { str_colName: 'UserID', value: tempUserObject.UserId },
                        { str_colName: 'UserName', value: tempUserObject.UserName },
                        { str_colName: 'LODStage', value: cubicalObj.Sys_MAStage }
                    ]
                }
                await database.save(detailDataInsert);
            } else {
                masterSrNo = resultData[0][0].SrNo;
                let detailDataInsert = {
                    str_tableName: 'tbl_batchsummary_detail16',
                    data: [
                        { str_colName: 'RepSerNo', value: masterSrNo },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'Date', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'Time', value: date.format(now, 'HH:mm:ss') },
                        { str_colName: 'InstrumentID', value: cubicalObj.Sys_MoistID },
                        { str_colName: 'Side', value: 'NA' },
                        { str_colName: 'Min', value: minTemp },
                        { str_colName: 'Max', value: maxTemp },
                        { str_colName: 'Avg', value: average },
                        { str_colName: 'TestResult', value: result },
                        { str_colName: 'UserID', value: tempUserObject.UserId },
                        { str_colName: 'UserName', value: tempUserObject.UserName },
                        { str_colName: 'LODStage', value: cubicalObj.Sys_MAStage }
                    ]
                }
                await database.save(detailDataInsert);
            }
            return 'success';
        } else {
            return 'success';
        }
    }
    /**
     * 
     * @param {*} InsertIdLHS 
     * @param {*} InsertIdRHS 
     * @param {*} selectedcubicalObj 
     * @param {*} idsNo 
     * @description  `saveBatchSummaryDT` Save the batch Summary Data for `DT`
     */
    async saveBatchSummaryDT(InsertIdLHS = 0, InsertIdRHS = 0, selectedcubicalObj, idsNo) {
        var now = new Date();
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = idsNo;
        }
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        //if (((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Compression') || (cubicalObj.Sys_CubType == 'Coating') || (cubicalObj.Sys_CubType == 'Capsule Filling'))) {
        if ((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType != 'IPQA') && (cubicalObj.Sys_CubType != 'IPQC')) {

            /**
             * SELECT MAX(`DT_RunTime`) AS 'Max', MIN(`DT_RunTime`) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(`DT_RunTime`) * 3600 +
             *(MINUTE(`DT_RunTime`) * 60) + SECOND(`DT_RunTime`))),'%H:%i:%s') AS 'Avg' FROM `tbl_tab_detail13` WHERE `RepSerNo`=1
             */
            let res = await proObj.productData(selectedcubicalObj);
            var masterResult;
            var ProductType = res[0].ProductType
            var tblMstName = res[0].ProductType == 1 ? 'tbl_tab_master13' : 'tbl_cap_master6'
            var tblDetName = res[0].ProductType == 1 ? 'tbl_tab_detail13' : 'tbl_cap_detail6'

            if (selectedcubicalObj.Sys_RotaryType == 'Double') {
                //masterResult = await database.execute(`SELECT * FROM tbl_tab_master13 WHERE RepSerNo='${InsertIdLHS}' OR RepSerNo='${InsertIdRHS}'`);
                masterResult = await database.execute(`SELECT * FROM ${tblMstName} WHERE RepSerNo='${InsertIdLHS}' OR RepSerNo='${InsertIdRHS}'`);
            } else {
                //masterResult = await database.execute(`SELECT * FROM tbl_tab_master13 WHERE RepSerNo='${InsertIdLHS}'`);
                masterResult = await database.execute(`SELECT * FROM ${tblMstName} WHERE RepSerNo='${InsertIdLHS}'`);
            }
            if (masterResult[0].length != 0) {
                for (let obj of masterResult[0]) {
                    //         let detailResult = await database.execute(`SELECT MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
                    // (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_tab_detail13 WHERE RepSerNo='${obj.RepSerNo}'`);

                    let detailResult = await database.execute(`SELECT MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
                    (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM ${tblDetName} WHERE RepSerNo='${obj.RepSerNo}'`);

                    let side = 'NA';
                    if (selectedcubicalObj.Sys_RotaryType == 'Single') {
                        side = 'NA';
                    } else {
                        if (obj.Side == 'NA') {
                            side = 'NA';
                        } else if (obj.Side == 'LHS') {
                            side = 'LEFT';
                        } else {
                            side = 'RIGHT';
                        }
                    }

                    var result = 'Compiles';
                    /**
                     * @description Comparing DT std time and max time
                     * var startTime = "01:00:00";
                        var endTime = "01:00:00";
                        var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                        if(parseInt(endTime .replace(regExp, "$1$2$3")) > parseInt(startTime .replace(regExp, "$1$2$3"))){
                        console.log('true')
                        } else {
                        console.log('false')
                        }
                     */
                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                    var stdTime = ProductType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom;
                    var maxTime = detailResult[0][0].Max;
                    if (parseInt(maxTime.replace(regExp, "$1$2$3")) > parseInt(stdTime.replace(regExp, "$1$2$3"))) {
                        result = 'Not Complies';
                    } else {
                        result = 'Complies';
                    }
                    let checkSideMasterTable;
                    if (selectedcubicalObj.Sys_RotaryType != 'Double') {
                        checkSideMasterTable = 'NA';
                    } else {
                        checkSideMasterTable = 'LEFT';
                    }
                    const checkMasterObj = {
                        str_tableName: 'tbl_batchsummary_master13',
                        data: 'MAX(RepSerNo) AS SrNo',
                        condition: [
                            { str_colName: 'BFGCode', value: selectedcubicalObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: selectedcubicalObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: selectedcubicalObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: selectedcubicalObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'CubType', value: obj.CubicleType, comp: 'eq' },
                            { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                            { str_colName: 'BatchNo', value: obj.BatchNo, comp: 'eq' },
                        ]
                    }
                    let resultData = await database.select(checkMasterObj);
                    let incompleteData = {
                        BFGCode: obj.BFGCode,
                        ProductName: obj.ProductName,
                        PVersion: obj.PVersion,
                        Version: obj.Version,
                        BatchNo: obj.BatchNo
                    }
                    let recSeqNo = await this.calculateSeqNo(side, 'tbl_batchsummary_master13', 'tbl_batchsummary_detail13', incompleteData);
                    if (resultData[0][0].SrNo == null) {
                        let masterData = {
                            str_tableName: 'tbl_batchsummary_master13',
                            data: [
                                { str_colName: 'BFGCode', value: obj.BFGCode },
                                { str_colName: 'ProductName', value: obj.ProductName },
                                { str_colName: 'PVersion', value: obj.PVersion },
                                { str_colName: 'Version', value: obj.Version },
                                { str_colName: 'PrdType', value: obj.ProductType },
                                { str_colName: 'CubType', value: obj.CubicleType },
                                { str_colName: 'BatchNo', value: obj.BatchNo },
                                { str_colName: 'Stage', value: selectedcubicalObj.Sys_Stage },
                                { str_colName: 'Dept', value: selectedcubicalObj.Sys_dept },
                                { str_colName: 'Tol1Neg', value: ProductType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },//; res[1].Param13_T1Neg },
                                { str_colName: 'Tol1Pos', value: ProductType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },//res[1].Param13_T1Pos },
                                { str_colName: 'DTStdTime', value: ProductType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },//res[1].Param13_Nom },
                                { str_colName: 'Side', value: checkSideMasterTable },
                                { str_colName: 'BatchCompleted', value: 0 },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'Area', value: selectedcubicalObj.Sys_Area },
                                { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                                { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'ReportType', value: 0 },
                            ]
                        }
                        let masterBatchSummary = await database.save(masterData);
                        let masterSrNo = masterBatchSummary[0].insertId;
                        let detailData = {
                            str_tableName: 'tbl_batchsummary_detail13',
                            data: [
                                { str_colName: 'RepSerNo', value: masterSrNo },
                                { str_colName: 'RecSeqNo', value: recSeqNo },
                                { str_colName: 'Date', value: obj.PrDate },
                                { str_colName: 'Time', value: obj.PrTime },
                                // { str_colName: 'InstrumentID', value: cubicalObj.Sys_DTID },
                                { str_colName: 'InstrumentID', value: obj.DTID },
                                { str_colName: 'Side', value: side },
                                { str_colName: 'MinTimeDT', value: detailResult[0][0].Min },
                                { str_colName: 'MaxTimeDT', value: detailResult[0][0].Max },
                                { str_colName: 'AvgTimeDT', value: detailResult[0][0].Avg },
                                { str_colName: 'TestResult', value: result },
                                { str_colName: 'UserID', value: obj.UserId },
                                { str_colName: 'UserName', value: obj.UserName }
                            ]
                        }
                        await database.save(detailData);

                    } else {
                        let masterSrNo = resultData[0][0].SrNo;
                        let detailData = {
                            str_tableName: 'tbl_batchsummary_detail13',
                            data: [
                                { str_colName: 'RepSerNo', value: masterSrNo },
                                { str_colName: 'RecSeqNo', value: recSeqNo },
                                { str_colName: 'Date', value: obj.PrDate },
                                { str_colName: 'Time', value: obj.PrTime },
                                { str_colName: 'InstrumentID', value: obj.DTID },
                                { str_colName: 'Side', value: side },
                                { str_colName: 'MinTimeDT', value: detailResult[0][0].Min },
                                { str_colName: 'MaxTimeDT', value: detailResult[0][0].Max },
                                { str_colName: 'AvgTimeDT', value: detailResult[0][0].Avg },
                                { str_colName: 'TestResult', value: result },
                                { str_colName: 'UserID', value: obj.UserId },
                                { str_colName: 'UserName', value: obj.UserName }
                            ]
                        }
                        await database.save(detailData);

                    }
                }
            }
        }
    }

    async saveBatchDataMutlihailer(objWeighment, typeValue, resultdata, IdsNo) { //function added by vivek on 23112019 for storing diff. batchsumary 
        try {
            var now = new Date();
            var responseObj = {};
            var now = new Date();
            var arrDetail = [];
            let strInstrumentId = "";
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)

            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objWeighment.intIdsNo);
            var masterTable, detailTable, finalSum;
            var sum = 0;
            let objMLHMenu = globalData.arrMultihealerMS.find(k => k.idsNo == objWeighment.intIdsNo);
            let menu = objMLHMenu.menu;
            let appender = "";
            let paramNom = "";
            let limitNo = "";
            var typeVal;
            if (menu == 'Dry Cartridge') {
                appender = "mdryc";
                paramNom = 'Param1_Nom';
                limitNo = 'Param1_LimitOn';
                typeVal = 7;
            } else if (menu == 'Dry Powder') {
                appender = "mdryp";
                paramNom = 'Param1_Nom';
                limitNo = 'Param1_LimitOn';
                typeVal = 7;
            } else {
                appender = "mnet";
                paramNom = 'Param2_Nom';
                limitNo = 'Param2_LimitOn';
                typeVal = 8;
            }
            masterTable = 'tbl_batchsummary_master_' + appender;
            detailTable = 'tbl_batchsummary_detail_' + appender;

            for (var i = 0; i < resultdata.detailData.length; i++) {
                var dataVal = resultdata.detailData[i].NetWeight;
                arrDetail.push(dataVal);
            }

            for (var j = 0; j < arrDetail.length; j++) {
                sum = sum + parseFloat(arrDetail[j]);
            }

            finalSum = sum;
            var count = arrDetail.length;
            var maxVal = Math.max(...arrDetail);
            var minVal = Math.min(...arrDetail);
            var avgVal = (finalSum / count);

            if ((cubicalObj.Sys_RptType == 0) && (cubicalObj.Sys_Validation == 0) && (cubicalObj.Sys_CubType == 'Multihaler')) {
                let res = await proObj.productData(cubicalObj);
                // var paramNom = `Param0_Nom`;
                // var limitNo = `Param0_LimitOn`;
                var nom = parseFloat(res[1][paramNom]);
                var limit = res[1][limitNo].readUIntLE();
                var minPer, maxPer;
                if (limit == 0)//standard
                {
                    minPer = Math.abs(((nom - minVal) / nom) * 100);
                    maxPer = Math.abs(((maxVal - nom) / nom) * 100);
                }
                else//average
                {
                    minPer = Math.abs(((avgVal - minVal) / avgVal) * 100);
                    maxPer = Math.abs(((maxVal - avgVal) / avgVal) * 100);
                }
                if (typeValue == "I") {
                    strInstrumentId = resultdata.incompleteData.BalanceId;
                }
                let sideVal = "NA";
                if (resultdata.incompleteData.Side == 'LHS') {
                    sideVal = "LEFT";
                } else if (resultdata.incompleteData.Side == 'RHS') {
                    sideVal = "RIGHT";
                } else {
                    sideVal = "NA";
                }
                let checkSideMasterTable;
                if (resultdata.incompleteData.Side == 'NA') {
                    checkSideMasterTable = resultdata.incompleteData.Side;
                } else {
                    checkSideMasterTable = 'LEFT';
                }
                // We only want to check side for NA and left side in master table so again we declare 
                // side variable for this specific perpose
                const checkMasterObj = {
                    str_tableName: masterTable,
                    data: 'MAX(RepSerNo) AS SrNo',
                    condition: [
                        { str_colName: 'BFGCode', value: objWeighment.strProductId, comp: 'eq' },
                        { str_colName: 'ProductName', value: objWeighment.strProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: objWeighment.strProductVersion, comp: 'eq' },
                        { str_colName: 'Version', value: objWeighment.strVersion, comp: 'eq' },
                        { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                        { str_colName: 'CubType', value: resultdata.incompleteData.CubicleType, comp: 'eq' },
                        { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo, comp: 'eq' },
                    ]
                }
                let resultData = await database.select(checkMasterObj);
                var masterSrNo;
                let DP = resultdata.incompleteData.DecimalPoint;
                var vernierObj = globalData.arrVernierData.find(k => k.IdsNum == IdsNo);
                let remark = 'Within Limit';
                if (vernierObj.flag == true) {
                    remark = "Not Complies";
                } else {
                    remark = "Complies";
                }

                let recSeqNo = await this.calculateSeqNo(sideVal, masterTable, detailTable,
                    resultdata.incompleteData);

                if (resultData[0][0].SrNo == null) {
                    const objInsertMasterData = {
                        str_tableName: masterTable,
                        data: [
                            { str_colName: 'BFGCode', value: resultdata.incompleteData.BFGCode },
                            { str_colName: 'ProductName', value: resultdata.incompleteData.ProductName },
                            { str_colName: 'PVersion', value: resultdata.incompleteData.PVersion },
                            { str_colName: 'Version', value: resultdata.incompleteData.Version },
                            { str_colName: 'PrdType', value: resultdata.incompleteData.ProductType },
                            { str_colName: 'CubType', value: resultdata.incompleteData.CubicleType },
                            { str_colName: 'BatchNo', value: resultdata.incompleteData.BatchNo },
                            { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                            { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                            { str_colName: 'Nom', value: nom },
                            { str_colName: 'Tol1Neg', value: resultdata.incompleteData.T1NegNet },
                            { str_colName: 'Tol1Pos', value: resultdata.incompleteData.T1PosNet },
                            { str_colName: 'Tol2Neg', value: resultdata.incompleteData.T2NegNet },
                            { str_colName: 'Tol2Pos', value: resultdata.incompleteData.T2PosNet },
                            { str_colName: 'DP', value: DP },
                            { str_colName: 'Unit', value: resultdata.incompleteData.Unit },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'BatchCompleted', value: resultdata.incompleteData.BatchComplete.readUIntLE() },
                            { str_colName: 'IsArchived', value: resultdata.incompleteData.IsArchived.readUIntLE() },
                            { str_colName: 'LimitOn', value: limit },
                            { str_colName: 'NMTLimit', value: resultdata.incompleteData.T1NMTTab },
                            { str_colName: 'Area', value: cubicalObj.Sys_Area },
                            { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                            { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'ReportType', value: resultdata.incompleteData.ReportType },
                        ]
                    }
                    //date.format(now, 'YYYY-MM-DD')
                    let masterResult = await database.save(objInsertMasterData);
                    masterSrNo = masterResult[0].insertId;
                    const objInsertDetailData = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: resultdata.incompleteData.PrDate },
                            { str_colName: 'Time', value: resultdata.incompleteData.PrTime },
                            { str_colName: 'InstrumentID', value: strInstrumentId },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'MinPer', value: minPer },
                            { str_colName: 'MaxPer', value: maxPer },
                            { str_colName: 'Min', value: minVal },
                            { str_colName: 'Max', value: maxVal },
                            { str_colName: 'Avg', value: avgVal },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: resultdata.incompleteData.UserId },
                            { str_colName: 'UserName', value: resultdata.incompleteData.UserName },

                        ]
                    }
                    let detailResult = await database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }
                else {
                    masterSrNo = resultData[0][0].SrNo;
                    const objInsertDetailData = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'Date', value: resultdata.incompleteData.PrDate },
                            { str_colName: 'Time', value: resultdata.incompleteData.PrTime },
                            { str_colName: 'InstrumentID', value: strInstrumentId },
                            { str_colName: 'Side', value: sideVal },
                            { str_colName: 'MinPer', value: minPer },
                            { str_colName: 'MaxPer', value: maxPer },
                            { str_colName: 'Min', value: minVal },
                            { str_colName: 'Max', value: maxVal },
                            { str_colName: 'Avg', value: avgVal },
                            { str_colName: 'TestResult', value: remark },
                            { str_colName: 'UserID', value: resultdata.incompleteData.UserId },
                            { str_colName: 'UserName', value: resultdata.incompleteData.UserName },

                        ]
                    }
                    let detailResult = database.save(objInsertDetailData);
                    Object.assign(responseObj, { status: 'success' })
                    return responseObj;
                }

            }

        }
        catch (err) {
            console.log(err);
            return err;
        }
    }
}
module.exports = BatchDataTransfer;