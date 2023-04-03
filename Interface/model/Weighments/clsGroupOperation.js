const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time')
const ClsProduct = require('../clsProductDetailModel');
const globalData = require('../../global/globalData');
const FormulaFun = require('../Product/clsformulaFun');
const WeighmentModel = require('../../../Interfaces/clsWeighment.model');
const IndividualOperation = require('../Weighments/clsIndividualOperation');
const individualOperation = new IndividualOperation();
const serverConfig = require('../../global/severConfig');
const BatchSum = require('../Weighments/clsBatchSummaryDataTransfer');
const objBatchSum = new BatchSum();
const CalDP = require('../../middleware/calculateDP');
const calculateDP = new CalDP();
const formulaFun = new FormulaFun();
const MathRound = require('../../middleware/clsMathJS');
const { config } = require('winston');
const objMathRound = new MathRound();
const proObj = new ClsProduct();
class Group {
    async saveCompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, groupWeightVal) {
        try {
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var ipcCode = globalData.arrGroupIPC.find(k => k.idsNo == IdsNo);
            let responseObj = {};
            var now = new Date();
            var actualWt = protocol.split(" ");
            var unit = actualWt[4].split("");
            var unitVal = unit[0];

            var wgt = actualWt[3];
            var decimalValue = 0;
            // var newWeight;
            var weight;
            if (groupWeightVal.toString().match(/^\d+$/)) {
                // newWeight = actualWt[3];
                decimalValue = 0;
            }
            else {
                weight = groupWeightVal.split(".");
                // newWeight = actualWt[3];
                decimalValue = weight[1].length
            }

            var ResultOfReport = `LE0`;
            var arrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var maxLimitT2, minLimitT2, maxLimitT1, minLimitT1, productUnit;
            var T1Pos = 1;
            switch (typeValue) {
                case "2":
                    T1Pos = arrLimits.Group.T1Pos;
                    maxLimitT2 = formulaFun.upperLimit(arrLimits.Group);
                    minLimitT2 = formulaFun.lowerLimit(arrLimits.Group);
                    maxLimitT1 = formulaFun.upperLimit(arrLimits.Group, 'T1');
                    minLimitT1 = formulaFun.lowerLimit(arrLimits.Group, 'T1');
                    productUnit = arrLimits.Group.unit;
                    break;
                case "9":
                    T1Pos = arrLimits.Grp_Layer.T1Pos;
                    maxLimitT2 = formulaFun.upperLimit(arrLimits.Grp_Layer);
                    minLimitT2 = formulaFun.lowerLimit(arrLimits.Grp_Layer);
                    maxLimitT1 = formulaFun.upperLimit(arrLimits.Grp_Layer, 'T1');
                    minLimitT1 = formulaFun.lowerLimit(arrLimits.Grp_Layer, 'T1');
                    productUnit = arrLimits.Grp_Layer.unit;
                    break;
                case "K":
                    T1Pos = arrLimits.Grp_Layer1.T1Pos;
                    maxLimitT2 = formulaFun.upperLimit(arrLimits.Grp_Layer1);
                    minLimitT2 = formulaFun.lowerLimit(arrLimits.Grp_Layer1);
                    maxLimitT1 = formulaFun.upperLimit(arrLimits.Grp_Layer1, 'T1');
                    minLimitT1 = formulaFun.lowerLimit(arrLimits.Grp_Layer1, 'T1');
                    productUnit = arrLimits.Grp_Layer1.unit;
                    break;
                default:
                    T1Pos = 1
            }
            // For T2
            var outOfLimitCount = 0;
            let Dp = await calculateDP.precision(groupWeightVal);
            let element = await objMathRound.roundUp(groupWeightVal, Dp);
            if (parseFloat(element) < parseFloat(minLimitT2) || parseFloat(element) > parseFloat(maxLimitT2)) {
                outOfLimitCount += 1;
                ResultOfReport = "LE1";
                console.log('Out of T2')
            }
            // For T1
            if (outOfLimitCount == 0 && parseFloat(T1Pos) != 0 && globalData.objNominclature.IsNMT == 1) {
                if (parseFloat(groupWeightVal) < parseFloat(minLimitT1) || parseFloat(groupWeightVal) > parseFloat(maxLimitT1)) {
                    outOfLimitCount += 1;
                    ResultOfReport = "LE1";
                    console.log('Out of T1')
                }
            }

            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var masterTable, detailTable, sideVal;
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)

            if (typeValue == 2) {
                masterTable = objProductType.productType == 2 ? 'tbl_cap_master2' : 'tbl_tab_master2';
                detailTable = objProductType.productType == 2 ? 'tbl_cap_detail2' : 'tbl_tab_detail2';
                typeValue = 2;
            } else if (typeValue == 9) {
                masterTable = 'tbl_tab_master10';
                detailTable = 'tbl_tab_detail10';
                typeValue = 10;
            } else if (typeValue == 'K') {
                masterTable = 'tbl_tab_master12';
                detailTable = 'tbl_tab_detail12';
                typeValue = 12;
            }

            //var side = actualWt[1];
            var side = actualWt[0].substring(3, 4);

            if (ProductType.productType == 2) {//for Capsule side will be always 'NA' added by vivek on 21-04-2020
                sideVal = 'NA';
            }
            else {//for Tablet
                if (side == 'N') {
                    sideVal = 'NA';
                }
                else if (side == 'L') {
                    sideVal = 'LHS';
                }
                else if (side == 'R') {
                    sideVal = 'RHS';
                }
            }


            var res = await proObj.productData(cubicalObj);
            var paramNom = `Param${typeValue}_Nom`;
            var paramT1Neg = `Param${typeValue}_T1Neg`;
            var paramT1Pos = `Param${typeValue}_T1Pos`;
            var paramT2Neg = `Param${typeValue}_T2Neg`;
            var paramT2Pos = `Param${typeValue}_T2Pos`;
            var limitNo = `Param${typeValue}_LimitOn`;

            const checkData = {
                str_tableName: masterTable,
                data: 'RepSerNo,MAX(MstSerNo) AS serialNo',
                condition: [
                    { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                    { str_colName: 'CubicleType', value: cubicalObj.Sys_CubType, comp: 'eq' },//added by vivek on 03/04/2020
                    { str_colName: 'RepoLabel10', value: cubicalObj.Sys_IPQCType, comp: 'eq' },//added by vivek on 03/04/2020
                    { str_colName: 'ReportType', value: cubicalObj.Sys_RptType, comp: 'eq' },//added by pradip on 25/09/2020 Standard and setting reports should not be mixed
                    { str_colName: 'BatchComplete', value: 1, comp: 'ne' }//added by vatsal on 05/04/22 batch started after previously completing same batch should stay seprate
                ]
            }
            var resultCompleteData = await database.select(checkData);
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


            var obj = globalData.arGrpMschSpeedAndApp.find(k => k.idsNo == IdsNo)
            if (obj == undefined) {
                var MscTim = date.format(new Date(), 'HH:mm:ss');
                var AppTim = date.format(new Date(), 'HH:mm:ss');
                globalData.arrDisplayFinalDiffWt.push({ idsNo: IdsNo, MaschineSpeed: '', Appereance: 0, AppearanceTime: AppTim, MachineTime: MscTim })
                var MaschineSpeed = ''
                var Appereance = 0
                var AppearanceTime = AppTim
                var MachineTime = MscTim
            }
            else {
                var MaschineSpeed = obj.MaschineSpeed
                var Appereance = obj.Appereance
                var AppearanceTime = obj.AppearanceTime
                var MachineTime = obj.MachineTime
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
                var productInfoData = {
                    BFGCode: cubicalObj.Sys_BFGCode,
                    ProductName: cubicalObj.Sys_ProductName,
                    PVersion: cubicalObj.Sys_PVersion,
                    Version: cubicalObj.Sys_Version,
                    BatchNo: cubicalObj.Sys_Batch
                }

                var seqNo = await this.calculateSeqNo(sideVal, masterTable, detailTable, productInfoData)
                var tabDetails = await database.select(checkTabDetails);
                if (tabDetails[0].length >= 0) {
                    const insertIncompleteDetailObj = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: RepSerno },
                            { str_colName: 'MstSerNo', value: intMstSerNo },
                            { str_colName: 'RecSeqNo', value: seqNo },
                            { str_colName: 'DataValue', value: groupWeightVal },
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
                            { str_colName: 'MachineSpeed', value: MaschineSpeed },//added for MLV by vivek on 14-04-2020
                            { str_colName: `Appearance`, value: Appereance },//added for MLV by vivek on 14-04-2020
                            { str_colName: `AppearanceTime`, value: AppearanceTime },//added for MLV by vivek on 14-04-2020
                            { str_colName: `MachineTime`, value: MachineTime },//added for MLV by vivek on 14-04-2020
                            { str_colName: 'AvgWt', value: serverConfig.ProjectName == 'MLVeer' ? (Number(groupWeightVal) / Number(intNos)) * 1000 : (Number(groupWeightVal) / Number(intNos)) },//dded for MLV added by vivek on 29-10-2020 as per discussion with pushkar 
                            { str_colName: 'Remark', value: ResultOfReport == 'LE0' ? 'Ok' : 'Not Ok' },
                            { str_colName: 'InstrumentID', value: ipcCode == undefined ? 0 : ipcCode.ipcCode }

                        ]
                    }
                    var detal_res = await database.save(insertIncompleteDetailObj);
                    var lastInsertedDetailID = detal_res[0].insertId;
                    const objWeighmentModel = new WeighmentModel();
                    objWeighmentModel.strProductId = cubicalObj.Sys_BFGCode;
                    objWeighmentModel.strProductName = cubicalObj.Sys_ProductName;
                    objWeighmentModel.strProductVersion = cubicalObj.Sys_PVersion;
                    objWeighmentModel.strVersion = cubicalObj.Sys_Version;
                    objWeighmentModel.strBatch = cubicalObj.Sys_Batch;
                    objWeighmentModel.intIdsNo = cubicalObj.Sys_IDSNo;
                    if (serverConfig.ProjectName == 'MLVeer') {
                        let successresult = await this.GroupBatchSummary(objWeighmentModel, resultCompleteData[0][0].RepSerNo, lastInsertedDetailID, IdsNo, ResultOfReport);
                    }
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
                    await database.update(updateEndDate);
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
                    return ResultOfReport
                }

            }
            else {
                var masterCompleteData = {
                    str_tableName: masterTable,
                    data: [
                        { str_colName: 'MstSerNo', value: intMstSerNo },
                        { str_colName: 'SideNo', value: 1 },// added by vivek on 03-04-2020
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
                        { str_colName: 'Unit', value: productUnit },
                        { str_colName: 'DecimalPoint', value: decimalValue },
                        { str_colName: 'WgmtModeNo', value: typeValue },
                        { str_colName: 'Nom', value: res[1][paramNom] },
                        { str_colName: 'T1NegTol', value: res[1][paramT1Neg] },
                        { str_colName: 'T1PosTol', value: res[1][paramT1Pos] },
                        { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                        { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
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
                        { str_colName: 'RepoLabel10', value: cubicalObj.Sys_IPQCType }, // added by vivek on 03-04-2020
                        { str_colName: 'ReportType', value: cubicalObj.Sys_RptType },
                        { str_colName: 'MachineCode', value: cubicalObj.Sys_MachineCode },
                        { str_colName: 'MFGCode', value: cubicalObj.Sys_MfgCode },
                        { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                        { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                        { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                        { str_colName: 'CubicleName', value: cubicalObj.Sys_CubicName },
                        { str_colName: 'CubicleLocation', value: cubicalObj.Sys_dept },
                        // { str_colName: 'RepoLabel10', value: resultdata.incompleteData.RepoLabel10 },
                        { str_colName: 'RepoLabel11', value: currentCubicalObj.Sys_Validation },
                        // { str_colName: 'RepoLabel12', value: resultdata.incompleteData.RepoLabel12 },
                        { str_colName: 'RepoLabel14', value: cubicalObj.Sys_IPQCType },
                        { str_colName: 'PrintNo', value: 0 },
                        { str_colName: 'IsArchived', value: 0 },
                        { str_colName: 'GraphType', value: 0 },
                        { str_colName: 'BatchComplete', value: 0 },
                        { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                        { str_colName: 'Version', value: cubicalObj.Sys_Version },
                        { str_colName: 'Lot', value: objLotData.LotNo },
                        { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                        { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'AppearanceDesc', value: cubicalObj.Sys_Appearance },
                        { str_colName: 'MachineSpeed_Min', value: cubicalObj.Sys_MachineSpeed_Min },
                        { str_colName: 'MachineSpeed_Max', value: cubicalObj.Sys_MachineSpeed_Max },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo }

                    ]
                }
                //console.log(masterCompleteData);
                var resultincomplete = await database.save(masterCompleteData);
                var lastInsertedID = resultincomplete[0].insertId;
                const checkTabDetails = {
                    str_tableName: detailTable,
                    data: '*',
                    condition: [
                        { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
                    ]
                }
                // var seqNo = await this.calculateSeqNo(sideVal, 'tbl_tab_master2', 'tbl_tab_detail2', masterCompleteData)
                var tabDetails = await database.select(checkTabDetails);
                if (tabDetails[0].length == 0) {
                    const insertIncompleteDetailObj = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: lastInsertedID },
                            { str_colName: 'MstSerNo', value: intMstSerNo },
                            { str_colName: 'RecSeqNo', value: 1 },
                            { str_colName: 'DataValue', value: groupWeightVal },
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
                            { str_colName: `Appearance`, value: Appereance },//added for MLV by vivek on 14-04-2020
                            { str_colName: 'MachineSpeed', value: MaschineSpeed },//added for MLV by vivek on 14-04-2020
                            { str_colName: `AppearanceTime`, value: AppearanceTime },//added for MLV by vivek on 14-04-2020
                            { str_colName: `MachineTime`, value: MachineTime },//added for MLV by vivek on 14-04-2020
                            { str_colName: 'AvgWt', value: serverConfig.ProjectName == 'MLVeer' ? (Number(groupWeightVal) / Number(intNos)) * 1000 : (Number(groupWeightVal) / Number(intNos)) },
                            { str_colName: 'Remark', value: ResultOfReport == 'LE0' ? 'Ok' : 'Not Ok' },
                            { str_colName: 'InstrumentID', value: ipcCode == undefined ? 0 : ipcCode.ipcCode }
                        ]
                    }
                    let detal_res = await database.save(insertIncompleteDetailObj);
                    var lastInsertedDetailID = detal_res[0].insertId;
                    const objWeighmentModel = new WeighmentModel();
                    objWeighmentModel.strProductId = cubicalObj.Sys_BFGCode;
                    objWeighmentModel.strProductName = cubicalObj.Sys_ProductName;
                    objWeighmentModel.strProductVersion = cubicalObj.Sys_PVersion;
                    objWeighmentModel.strVersion = cubicalObj.Sys_Version;
                    objWeighmentModel.strBatch = cubicalObj.Sys_Batch;
                    objWeighmentModel.intIdsNo = cubicalObj.Sys_IDSNo;
                    if (serverConfig.ProjectName == 'MLVeer') {
                        let successresult = await this.GroupBatchSummary(objWeighmentModel, lastInsertedID, lastInsertedDetailID, IdsNo, ResultOfReport);
                    }
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
                            //{ str_colName: 'Idsno', value: cubicalObj.Sys_IDSNo, comp: 'eq' },
                            { str_colName: 'Area', value: cubicalObj.Sys_Area, comp: 'eq' },
                        ]
                    }
                    await database.update(updateEndDate);
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
                    return ResultOfReport;
                }
            }
        } catch (err) {
            console.log(err)
        }

    }
    async calculateSeqNo(side, masterTableName, detailTableName, inCompleteData) {
        var now = new Date();
        let selectedSide;
        if (side == 'NA') {
            selectedSide = side;
        } else {
            selectedSide = "LHS";
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
    async GroupBatchSummary(objWeighment, lastInsertedID, lastInsertedDetailID, IdsNo, ResultOfReport) {
        var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objWeighment.intIdsNo);
        var masterTable = 'tbl_tab_master2';
        var detailTable = 'tbl_tab_detail2';
        if (ProductType.productType == 2) {
            masterTable = 'tbl_cap_master2';
            detailTable = 'tbl_cap_detail2';
        }
        let selectGroupData = {
            str_tableName: masterTable,
            data: '*',
            condition: [
                { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
            ]
        }
        var groupRes = await database.select(selectGroupData);
        var selectDetail = {
            str_tableName: detailTable,
            data: '*',
            condition: [
                { str_colName: 'RecNo', value: lastInsertedDetailID, comp: 'eq' }
            ]
        }
        var detailRes = await database.select(selectDetail);
        var sideVal = "NA";
        if (detailRes[0][0].Side == 'LHS') {
            sideVal = "LEFT";
        } else if (detailRes[0][0].Side == 'RHS') {
            sideVal = "RIGHT";
        } else {
            sideVal = "NA";
        }
        var checkSideMasterTable;
        if (detailRes[0][0].Side == 'NA') {
            checkSideMasterTable = detailRes[0][0].Side;
        } else {
            checkSideMasterTable = 'LEFT';
        }

        const checkMasterObj = {
            str_tableName: 'tbl_batchsummary_master2',
            data: 'MAX(RepSerNo) AS SrNo',
            condition: [
                { str_colName: 'BFGCode', value: objWeighment.strProductId, comp: 'eq' },
                { str_colName: 'ProductName', value: objWeighment.strProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: objWeighment.strProductVersion, comp: 'eq' },
                { str_colName: 'Version', value: objWeighment.strVersion, comp: 'eq' },
                { str_colName: 'Side', value: checkSideMasterTable, comp: 'eq' },
                { str_colName: 'CubType', value: groupRes[0][0].CubicleType, comp: 'eq' },
                { str_colName: 'BatchNo', value: detailRes[0][0].BatchNo, comp: 'eq' },
            ]
        }

        let resultData = await database.select(checkMasterObj);

        if (resultData[0][0].SrNo == null) {

            const objInsertMasterData = {
                str_tableName: 'tbl_batchsummary_master2',
                data: [
                    { str_colName: 'BFGCode', value: groupRes[0][0].BFGCode },
                    { str_colName: 'ProductName', value: groupRes[0][0].ProductName },
                    { str_colName: 'PVersion', value: groupRes[0][0].PVersion },
                    { str_colName: 'Version', value: groupRes[0][0].Version },
                    { str_colName: 'PrdType', value: groupRes[0][0].ProductType },
                    { str_colName: 'CubType', value: groupRes[0][0].CubicleType },
                    { str_colName: 'BatchNo', value: groupRes[0][0].BatchNo },
                    { str_colName: 'Stage', value: cubicalObj.Sys_Stage },
                    { str_colName: 'Dept', value: cubicalObj.Sys_dept },
                    { str_colName: 'Nom', value: groupRes[0][0].Nom },
                    { str_colName: 'Tol1Neg', value: groupRes[0][0].T1NegTol },
                    { str_colName: 'Tol1Pos', value: groupRes[0][0].T1PosTol },
                    { str_colName: 'Tol2Neg', value: groupRes[0][0].T2NegTol },
                    { str_colName: 'Tol2Pos', value: groupRes[0][0].T2PosTol },
                    { str_colName: 'DP', value: groupRes[0][0].DecimalPoint },
                    // { str_colName: 'LODLayer', value: resultdata.incompleteData.UserId },
                    { str_colName: 'Unit', value: groupRes[0][0].Unit },
                    // { str_colName: 'FinalMinDT', value: resultdata.incompleteData.PrDate },
                    // { str_colName: 'FinalMaxDT', value: resultdata.incompleteData.PrTime },
                    // { str_colName: 'FinalAvgDT', value: resultdata.incompleteData.PrEndDate },
                    { str_colName: 'Side', value: sideVal },
                    { str_colName: 'BatchCompleted', value: groupRes[0][0].BatchComplete.readUIntLE() },
                    { str_colName: 'IsArchived', value: groupRes[0][0].IsArchived.readUIntLE() },
                    { str_colName: 'LimitOn', value: groupRes[0][0].limitOn.readUIntLE() },
                    { str_colName: 'NMTLimit', value: 0 },
                    { str_colName: 'Area', value: cubicalObj.Sys_Area },
                    { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                    { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                    { str_colName: 'BatchSize', value: `${cubicalObj.Sys_BatchSize} ${cubicalObj.Sys_BatchSizeUnit}` },
                    { str_colName: 'ReportType', value: groupRes[0][0].ReportType },
                ]
            }
            let saveBatchSummRes = await database.save(objInsertMasterData);
            var lastInsrtBatchId = saveBatchSummRes[0].insertId;
            let recSeqNo = await objBatchSum.calculateSeqNo(sideVal, 'tbl_batchsummary_master2', 'tbl_batchsummary_detail2', groupRes[0][0]);

            const objInsertDetailData = {
                str_tableName: 'tbl_batchsummary_detail2',
                data: [
                    { str_colName: 'RepSerNo', value: lastInsrtBatchId },
                    { str_colName: 'RecSeqNo', value: recSeqNo },
                    { str_colName: 'Date', value: detailRes[0][0].PrDate },
                    { str_colName: 'Time', value: detailRes[0][0].PrTime },
                    { str_colName: 'InstrumentID', value: groupRes[0][0].BalanceId },
                    { str_colName: 'Side', value: sideVal },
                    { str_colName: 'MinPer', value: 0 },
                    { str_colName: 'MaxPer', value: 0 },
                    { str_colName: 'Min', value: detailRes[0][0].DataValue },
                    { str_colName: 'Max', value: detailRes[0][0].DataValue },
                    { str_colName: 'Avg', value: detailRes[0][0].DataValue },
                    // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                    // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                    { str_colName: 'TestResult', value: ResultOfReport = 'LE0' ? 'Complies' : 'Not complies' },
                    { str_colName: 'UserID', value: detailRes[0][0].UserID },
                    { str_colName: 'UserName', value: detailRes[0][0].UserName },

                ]
            }
            await database.save(objInsertDetailData);
            // if (globalData.arrGroupIPC != undefined) {
            //     globalData.arrGroupIPC = globalData.arrGroupIPC
            //         .filter(k => k.idsNo != IdsNo)
            // }
            return true;
        } else {

            var lastInsrtBatchId = resultData[0][0].SrNo;
            let recSeqNo = await objBatchSum.calculateSeqNo(sideVal, 'tbl_batchsummary_master2', 'tbl_batchsummary_detail2', groupRes[0][0]);

            const objInsertDetailData = {
                str_tableName: 'tbl_batchsummary_detail2',
                data: [
                    { str_colName: 'RepSerNo', value: lastInsrtBatchId },
                    { str_colName: 'RecSeqNo', value: recSeqNo },
                    { str_colName: 'Date', value: detailRes[0][0].PrDate },
                    { str_colName: 'Time', value: detailRes[0][0].PrTime },
                    { str_colName: 'InstrumentID', value: groupRes[0][0].BalanceId },
                    { str_colName: 'Side', value: sideVal },
                    { str_colName: 'MinPer', value: 0 },
                    { str_colName: 'MaxPer', value: 0 },
                    { str_colName: 'Min', value: detailRes[0][0].DataValue },
                    { str_colName: 'Max', value: detailRes[0][0].DataValue },
                    { str_colName: 'Avg', value: detailRes[0][0].DataValue },
                    // { str_colName: 'MinTimeDT', value: resultdata.incompleteData.T1PosTol },
                    // { str_colName: 'MaxTimeDT', value: resultdata.incompleteData.T2NegTol },
                    { str_colName: 'TestResult', value: ResultOfReport = 'LE0' ? 'Complies' : 'Not complies' },
                    { str_colName: 'UserID', value: detailRes[0][0].UserID },
                    { str_colName: 'UserName', value: detailRes[0][0].UserName },

                ]
            }
            await database.save(objInsertDetailData);
            // if (globalData.arrGroupIPC != undefined) {
            //     globalData.arrGroupIPC = globalData.arrGroupIPC
            //         .filter(k => k.idsNo != IdsNo)
            // }
            return true;
        }
    }
}
module.exports = Group;