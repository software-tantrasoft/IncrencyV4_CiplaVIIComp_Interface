const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time')
const globalData = require('../../global/globalData')
const ClsProduct = require('../clsProductDetailModel');
const proObj = new ClsProduct();
let clsGetMstSrAndSideSr = require('../Weighments/clsGetMstSrAndSideSr');
const objGetMstSrAndSideSr = new clsGetMstSrAndSideSr();

class IncompleteDataSave {
    /**
     * To save Incomplete Data
     * @param {*} productObj 
     * @param {*} wt 
     * @param {*} intNos 
     * @param {*} tblMaster 
     * @param {*} tblDetail 
     */
    async saveDataDiff(productObj, wt, intNos, typeValue, tempUserObject, tblMaster, tblDetail, IdsNo, DiffType = "NA") {
        try {
            var mstSerNo = ''
            var sideNo = ''
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var arraylimit = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var tempDiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);
            let now = new Date();
            var actualWt = wt.split(" ");
            var side = actualWt[0].substring(4, 3);

            var actualSampleValue = actualWt[0].substring(5)
            // var actualSampleValue = actualWt[1].substring(1, 4);
            var sideValue, weight, decimalValue, actualUnit, newWeight;
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);


            if (tempDiffData.side == 'N') {
                sideValue = 'NA';
            } else if (tempDiffData.side == 'L') {
                sideValue = 'LHS';
            } else if (tempDiffData.side == 'R') {
                sideValue = 'RHS';
            }

            // actualSampleValue = actualWt[1];
            var wtVal = actualWt[1];//weight value


            var typeVal = 3;
            var noOfSample = intNos;
            if (actualSampleValue <= noOfSample) {

                var res = await proObj.productData(productObj);
                if (typeValue == "D") {
                    //for individual
                    var paramNom = `Param1_Nom`;
                    var paramT1Neg = `Param1_T1Neg`;
                    var paramT1Pos = `Param1_T1Pos`;
                    var paramT2Neg = `Param1_T2Neg`;
                    var paramT2Pos = `Param1_T2Pos`;
                    var limitNo = `Param1_LimitOn`;
                    var paramNMT = `Param1_NMTTab`;
                    var reportOn = `Param1_IsOnStd`;
                    //for Empty
                    var paramNomEmpty = `Param0_Nom`;
                    var paramT1NegEmpty = `Param0_T1Neg`;
                    var paramT1PosEmpty = `Param0_T1Pos`;
                    var paramT2NegEmpty = `Param0_T2Neg`;
                    var paramT2PosEmpty = `Param0_T2Pos`;
                    var limitNoEmpty = `Param0_LimitOn`;
                    var paramNMTEmpty = `Param0_NMTTab`;
                    var reportOnEmpty = `Param0_IsOnStd`;
                    //for Net
                    var paramNomNet = `Param3_Nom`;
                    var paramT1NegNet = `Param3_T1Neg`;
                    var paramT1PosNet = `Param3_T1Pos`;
                    var paramT2NegNet = `Param3_T2Neg`;
                    var paramT2PosNet = `Param3_T2Pos`;
                    var limitNoNet = `Param3_LimitOn`;
                    var paramNMTNet = `Param3_NMTTab`;
                    var reportOnNet = `Param3_IsOnStd`;
                } else {
                    var paramNom = `Param${typeVal}_Nom`;
                    var paramT1Neg = `Param${typeVal}_T1Neg`;
                    var paramT1Pos = `Param${typeVal}_T1Pos`;
                    var paramT2Neg = `Param${typeVal}_T2Neg`;
                    var paramT2Pos = `Param${typeVal}_T2Pos`;
                    var limitNo = `Param${typeVal}_LimitOn`;
                    var paramNMT = `Param${typeVal}_NMTTab`;
                    var reportOn = `Param${typeVal}_IsOnStd`;
                }
                let productUnit;
                productUnit = arraylimit.Differential.unit;
                var wgt = actualWt[1];
                let incomingUnit = actualWt[2].split(/N|R|r|n/)[0].toLowerCase();
                actualUnit = incomingUnit;
                let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                    if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                        wgt = wgt / 1000; // mg->gm
                    } else {
                        wgt = wgt * 1000; // mg -> gm
                    }
                }

                if (wgt.toString().match(/^\d+$/)) {
                    newWeight = wgt;
                    decimalValue = 0;
                }
                else {
                    var weightVal = wgt.toString().split('.');
                    weight = weightVal[0];
                    decimalValue = weightVal[1].length
                    newWeight = wgt;
                }

                //console.log(limitNo);
                const productDetailObj = {
                    str_tableName: tblMaster,
                    data: 'MAX(RepSerNo) AS serialNo',
                    condition: [
                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                        { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                        { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                        { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                        { str_colName: 'Idsno', value: IdsNo, comp: 'eq' }
                    ]
                }

                if (productObj.Sys_RptType == 1) {//for Initial 
                    mstSerNo = 0
                    sideNo = 1
                }
                else { //regular
                    var mastTableNAme = tblMaster;
                    var side = sideValue;
                    var BFGCode = productObj.Sys_BFGCode;
                    var ProductName = productObj.Sys_ProductName;
                    var PVersion = productObj.Sys_PVersion;
                    var Version = productObj.Sys_Version;
                    var Batch = productObj.Sys_Batch;
                    var IdsNo = IdsNo;
                    if (sideValue == 'NA') {

                        mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                        sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                        if (sideNo < 3) {
                            sideNo = sideNo + 1;
                        }
                        else {
                            sideNo = 1;
                            mstSerNo = mstSerNo + 1;
                        }
                    }
                    else {
                        mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                        sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mastTableNAme, 0, side, BFGCode, ProductName, PVersion, Version, Batch, IdsNo);
                        if (sideNo < 3) {
                            sideNo = sideNo + 1;
                        }
                        else {
                            sideNo = 1;
                            mstSerNo = mstSerNo + 1;
                        }
                    }
                }

                var result = await database.select(productDetailObj)
                if (result[0][0].serialNo == null || actualSampleValue == 1) {
                    let totalContentCount = 0;
                    if (DiffType != 'E') {
                        var tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        totalContentCount = tempContentObj.totalContent;
                    }

                    const insertIncompleteObj = {
                        str_tableName: tblMaster,
                        data: [
                            { str_colName: 'MstSerNo', value: mstSerNo }, //modified by vivek on 04/04/2020
                            { str_colName: 'SideNo', value: sideNo }, //added by vivek on 04/04/2020
                            { str_colName: 'InstruId', value: 1 },
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                            { str_colName: 'ProductType', value: 2 },
                            { str_colName: 'Qty', value: noOfSample },
                            { str_colName: 'GrpQty', value: noOfSample },
                            { str_colName: 'GrpFreq', value: noOfSample },
                            { str_colName: 'Idsno', value: IdsNo },
                            { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                            { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                            //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                            { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                            //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                            { str_colName: 'UserId', value: tempUserObject.UserId },
                            { str_colName: 'UserName', value: tempUserObject.UserName },
                            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Side', value: 'NA' },
                            { str_colName: 'Unit', value: productUnit },
                            { str_colName: 'DecimalPoint', value: decimalValue },
                            { str_colName: 'WgmtModeNo', value: typeVal },
                            { str_colName: 'Nom', value: res[1][paramNom] },
                            { str_colName: 'T1NegTol', value: res[1][paramT1Neg] },
                            { str_colName: 'T1PosTol', value: res[1][paramT1Pos] },
                            { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                            { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
                            { str_colName: 'limitOn', value: res[1][limitNo].readUIntLE() },
                            { str_colName: 'T1NMTTab', value: res[1][paramNMT] },
                            { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                            { str_colName: 'ReportType', value: productObj.Sys_RptType },
                            { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                            { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                            { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                            { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                            { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                            { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                            { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                            { str_colName: 'RepoLabel11', value: productObj.Sys_Validation }, // this will store wether the test is validation or not 
                            { str_colName: 'RepoLabel14', value: productObj.Sys_IPQCType },
                            { str_colName: 'PrintNo', value: 0 },
                            { str_colName: 'IsArchived', value: 0 },
                            { str_colName: 'GraphType', value: (res[1][reportOn].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'BatchComplete', value: 0 },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                            { str_colName: 'Version', value: productObj.Sys_Version },
                            { str_colName: 'Lot', value: objLotData.LotNo },
                            { str_colName: 'NomEmpty', value: res[1][paramNomEmpty] },
                            { str_colName: 'T1NegEmpty', value: res[1][paramT1NegEmpty] },
                            { str_colName: 'T1PosEmpty', value: res[1][paramT1PosEmpty] },
                            { str_colName: 'T2NegEmpty', value: res[1][paramT2NegEmpty] },
                            { str_colName: 'T2PosEmpty', value: res[1][paramT2PosEmpty] },
                            { str_colName: 'GraphTypeEmpty', value: (res[1][reportOnEmpty].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'limitOnEmpty', value: res[1][limitNoEmpty].readUIntLE() },
                            { str_colName: 'NMTTabEmpty', value: res[1][paramNMTEmpty] },
                            { str_colName: 'NomNet', value: res[1][paramNomNet] },
                            { str_colName: 'T1NegNet', value: res[1][paramT1NegNet] },
                            { str_colName: 'T1PosNet', value: res[1][paramT1PosNet] },
                            { str_colName: 'T2NegNet', value: res[1][paramT2NegNet] },
                            { str_colName: 'T2PosNet', value: res[1][paramT2PosNet] },
                            { str_colName: 'GraphTypeNet', value: (res[1][reportOnNet].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'limitOnNet', value: res[1][limitNoNet].readUIntLE() },
                            { str_colName: 'NMTTabNet', value: res[1][paramNMTNet] },
                            { str_colName: 'Area', value: productObj.Sys_Area },
                            { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                            { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                            { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                            { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                            { str_colName: 'IsNMT', value: res[1]['Param1_IsNMT'] },
                            { str_colName: 'Content1Desc', value: res[1]['Param9_ContentDesc'] },
                            { str_colName: 'Content2Desc', value: res[1]['Param10_ContentDesc'] },
                            { str_colName: 'Content3Desc', value: res[1]['Param11_ContentDesc'] },
                            { str_colName: 'Content4Desc', value: res[1]['Param12_ContentDesc'] },
                            { str_colName: 'Content1Type', value: res[1]['Param9_ContentType'] },
                            { str_colName: 'Content2Type', value: res[1]['Param10_ContentType'] },
                            { str_colName: 'Content3Type', value: res[1]['Param11_ContentType'] },
                            { str_colName: 'Content4Type', value: res[1]['Param12_ContentType'] },
                            { str_colName: 'NomContent1', value: res[1]['Param9_Nom'] },
                            { str_colName: 'T1NegContent1', value: res[1]['Param9_T1Neg'] },
                            { str_colName: 'T1PosContent1', value: res[1]['Param9_T1Pos'] },
                            { str_colName: 'T2NegContent1', value: res[1]['Param9_T2Neg'] },
                            { str_colName: 'T2PosContent1', value: res[1]['Param9_T2Pos'] },
                            { str_colName: 'limitOnContent1', value: res[1]['Param9_LimitOn'].readUIntLE() },
                            { str_colName: 'NMTTabContent1', value: res[1]['Param9_NMTTab'] },
                            { str_colName: 'NomContent2', value: res[1]['Param10_Nom'] },
                            { str_colName: 'T1NegContent2', value: res[1]['Param10_T1Neg'] },
                            { str_colName: 'T1PosContent2', value: res[1]['Param10_T1Pos'] },
                            { str_colName: 'T2NegContent2', value: res[1]['Param10_T2Neg'] },
                            { str_colName: 'T2PosContent2', value: res[1]['Param10_T2Pos'] },
                            { str_colName: 'limitOnContent2', value: res[1]['Param10_LimitOn'].readUIntLE() },
                            { str_colName: 'NMTTabContent2', value: res[1]['Param10_NMTTab'] },
                            { str_colName: 'NomContent3', value: res[1]['Param11_Nom'] },
                            { str_colName: 'T1NegContent3', value: res[1]['Param11_T1Neg'] },
                            { str_colName: 'T1PosContent3', value: res[1]['Param11_T1Pos'] },
                            { str_colName: 'T2NegContent3', value: res[1]['Param11_T2Neg'] },
                            { str_colName: 'T2PosContent3', value: res[1]['Param11_T2Pos'] },
                            { str_colName: 'limitOnContent3', value: res[1]['Param11_LimitOn'].readUIntLE() },
                            { str_colName: 'NMTTabContent3', value: res[1]['Param11_NMTTab'] },
                            { str_colName: 'NomContent4', value: res[1]['Param12_Nom'] },
                            { str_colName: 'T1NegContent4', value: res[1]['Param12_T1Neg'] },
                            { str_colName: 'T1PosContent4', value: res[1]['Param12_T1Pos'] },
                            { str_colName: 'T2NegContent4', value: res[1]['Param12_T2Neg'] },
                            { str_colName: 'T2PosContent4', value: res[1]['Param11_T2Pos'] },
                            { str_colName: 'limitOnContent4', value: res[1]['Param11_LimitOn'].readUIntLE() },
                            { str_colName: 'NMTTabContent4', value: res[1]['Param11_NMTTab'] },
                            { str_colName: 'GraphTypeContent1', value: (res[1]['Param9_IsOnStd'].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'GraphTypeContent2', value: (res[1]['Param10_IsOnStd'].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'GraphTypeContent3', value: (res[1]['Param11_IsOnStd'].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'GraphTypeContent4', value: (res[1]['Param12_IsOnStd'].readUIntLE() == "1") ? "Average" : "Standard" },
                            { str_colName: 'NoOfContent', value: totalContentCount },


                        ]

                    }


                    //   if (DiffType == "E") {// For filled wgt 
                    var resultincomplete = await database.save(insertIncompleteObj)
                    var lastInsertedID = resultincomplete[0].insertId;
                    const checkTabDetails = {
                        str_tableName: tblDetail,
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
                    var tabDetails = await database.select(checkTabDetails)
                    if (tabDetails[0].length == 0) {
                        const insertIncompleteDetailObj = {
                            str_tableName: tblDetail,
                            data: [
                                { str_colName: 'RepSerNo', value: lastInsertedID },
                                { str_colName: 'MstSerNo', value: mstSerNo },
                                { str_colName: 'RecSeqNo', value: 1 },
                                { str_colName: 'DataValue', value: tempDiffData.fillWgt },
                                { str_colName: 'DecimalPoint', value: decimalValue },
                                { str_colName: 'DataValue1', value: tempDiffData.emptyWgt },
                                { str_colName: 'Content1', value: tempDiffData.content1 },
                                { str_colName: 'Content2', value: tempDiffData.content2 },
                                { str_colName: 'Content3', value: tempDiffData.content3 },
                                { str_colName: 'Content4', value: tempDiffData.content4 },
                            ]
                        }
                        res = await database.save(insertIncompleteDetailObj);
                        if (DiffType == 'E') {
                            res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=DataValue-DataValue1 WHERE RepSerNo = ${lastInsertedID} `);
                        } else {
                            let W11 = tempDiffData.fillWgt - tempDiffData.emptyWgt;
                             W11 = tempDiffData.fillWgt - tempDiffData.emptyWgt;
                            let W2 = W11 - tempDiffData.content1;
                            let W3 = W2 - tempDiffData.content2;
                            let W4 = W3 - tempDiffData.content3;
                            let netWeigth = W4 - tempDiffData.content4;
                            res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=${netWeigth} WHERE RepSerNo = ${lastInsertedID} `);
                        }
                        // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weightE: weightValue, flag: 'out' },type:'E' })
                        return res;
                    }
                    // }

                } else {
                    var masterSrNo = result[0][0].serialNo;

                    // if (DiffType = "E") {
                    const checkTabDetails = {
                        str_tableName: tblDetail,
                        data: 'MAX(RecSeqNo) AS SeqNo',
                        condition: [
                            { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                        ]
                    }
                    var tabDetails = await database.select(checkTabDetails)

                    const fetchmasterSrNo = {
                        str_tableName: tblMaster,
                        data: 'MstSerNo',
                        condition: [
                            { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                        ]
                    }
                    var objfetchmasterSrNo = await database.select(fetchmasterSrNo);

                    var recSeqNo = tabDetails[0][0].SeqNo + 1;
                    const insertIncompleteDetailObj = {
                        str_tableName: tblDetail,
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'MstSerNo', value: objfetchmasterSrNo[0][0].MstSerNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'DataValue', value: tempDiffData.fillWgt },
                            { str_colName: 'DecimalPoint', value: decimalValue },
                            { str_colName: 'DataValue1', value: tempDiffData.emptyWgt },
                            { str_colName: 'Content1', value: tempDiffData.content1 },
                            { str_colName: 'Content2', value: tempDiffData.content2 },
                            { str_colName: 'Content3', value: tempDiffData.content3 },
                            { str_colName: 'Content4', value: tempDiffData.content4 },
                        ]
                    }
                    var res = await database.save(insertIncompleteDetailObj)
                    // res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=DataValue-DataValue1 WHERE RepSerNo = ${masterSrNo} `)
                    if (DiffType == 'E') {
                        res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=DataValue-DataValue1 WHERE RepSerNo = ${masterSrNo} AND RecSeqNo=${recSeqNo} `);
                    } else {
                        let W1 = tempDiffData.fillWgt - tempDiffData.emptyWgt;
                        //let netWeigth = W1 - tempDiffData.content1 - tempDiffData.content2 - tempDiffData.content3 - tempDiffData.content4;
                         W1 = tempDiffData.fillWgt - tempDiffData.emptyWgt;

                        let W2 = W1 - tempDiffData.content1;
                        let W3 = W2 - tempDiffData.content2;
                        let W4 = W3 - tempDiffData.content3;
                        let netWeigth = W4 - tempDiffData.content4;
                        res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=${netWeigth} WHERE RepSerNo = ${masterSrNo} AND RecSeqNo=${recSeqNo}`);
                    }
                    return res;
                    // }
                }

            }


        } catch (err) {
            console.log("Error from clsIncompleteDataSave.js", err);
            return err

        }
    }
    async saveDataDiffSoftShell(productObj, wt, intNos, typeValue, tempUserObject, tblMaster, tblDetail, IdsNo, DiffType = "NA") {
        try {

            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var tempDiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);
            var arraylimit = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            let now = new Date();
            var actualWt = wt.split(" ");
            var side = actualWt[0].substring(4, 3);

            var actualSampleValue = actualWt[0].substring(5)


            // var actualSampleValue = actualWt[1].substring(1, 4);
            var sideValue, weight, decimalValue, actualUnit, newWeight;
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            if (tempDiffData.side == 'N') {
                sideValue = 'NA';
            } else if (tempDiffData.side == 'L') {
                sideValue = 'LHS';
            } else if (tempDiffData.side == 'R') {
                sideValue = 'RHS';
            }



            // actualSampleValue = actualWt[1];
            var wtVal = actualWt[1];//weight value
            actualUnit = actualWt[2].split("")[0];//unit value


            var typeVal = 3;
            var noOfSample = intNos;
            if (actualSampleValue <= noOfSample) {

                var res = await proObj.productData(productObj);
                let productUnit;
                productUnit = arraylimit.Differential.unit;
                var wgt = actualWt[1];
                let incomingUnit = actualWt[2].split(/N|R|r|n/)[0].toLowerCase();
                actualUnit = incomingUnit;
                let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                    if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                        wgt = wgt / 1000; // mg->gm
                    } else {
                        wgt = wgt * 1000; // mg -> gm
                    }
                }

                if (wgt.toString().match(/^\d+$/)) {
                    newWeight = wgt;
                    decimalValue = 0;
                }
                else {
                    var weightVal = wgt.toString().split('.');
                    weight = weightVal[0];
                    decimalValue = weightVal[1].length
                    newWeight = wgt;
                }
                //for individual
                // var paramNom = `Param1_Nom`;
                // var paramT1Neg = `Param1_T1Neg`;
                // var paramT1Pos = `Param1_T1Pos`;
                // var paramT2Neg = `Param1_T2Neg`;
                // var paramT2Pos = `Param1_T2Pos`;
                // var limitNo = `Param1_LimitOn`;
                // var paramNMT = `Param1_NMTTab`;
                // var reportOn = `Param1_IsOnStd`;
                //for Empty
                var paramNom = `Param0_Nom`;
                var paramT1Neg = `Param0_T1Neg`;
                var paramT1Pos = `Param0_T1Pos`;
                var paramT2Neg = `Param0_T2Neg`;
                var paramT2Pos = `Param0_T2Pos`;
                var paramT3Neg = `Param0_T3Neg`;
                var paramT3Pos = `Param0_T3Pos`;
                var limitNo = `Param0_LimitOn`;
                var paramNMT = `Param0_NMTTab`;
                var reportOn = `Param0_IsOnStd`;
                //for Net
                // var paramNomNet = `Param3_Nom`;
                // var paramT1NegNet = `Param3_T1Neg`;
                // var paramT1PosNet = `Param3_T1Pos`;
                // var paramT2NegNet = `Param3_T2Neg`;
                // var paramT2PosNet = `Param3_T2Pos`;
                // var limitNoNet = `Param3_LimitOn`;
                // var paramNMTNet = `Param3_NMTTab`;
                // var reportOnNet = `Param3_IsOnStd`;


                //console.log(limitNo);
                const productDetailObj = {
                    str_tableName: tblMaster,
                    data: 'MAX(RepSerNo) AS serialNo',
                    condition: [
                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                        { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                        { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                        { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                        { str_colName: 'Idsno', value: IdsNo, comp: 'eq' }
                    ]
                }
                var result = await database.select(productDetailObj)
                if (result[0][0].serialNo == null || actualSampleValue == 1) {
                    const insertIncompleteObj = {
                        str_tableName: tblMaster,
                        data: [
                            { str_colName: 'MstSerNo', value: 1 },
                            { str_colName: 'InstruId', value: 1 },
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                            { str_colName: 'ProductType', value: 4 },
                            { str_colName: 'Qty', value: noOfSample },
                            { str_colName: 'GrpQty', value: noOfSample },
                            { str_colName: 'GrpFreq', value: noOfSample },
                            { str_colName: 'Idsno', value: IdsNo },
                            { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                            { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                            //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                            { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                            //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                            { str_colName: 'UserId', value: tempUserObject.UserId },
                            { str_colName: 'UserName', value: tempUserObject.UserName },
                            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Side', value: sideValue },
                            { str_colName: 'Unit', value: productUnit },
                            { str_colName: 'DecimalPoint', value: decimalValue },
                            { str_colName: 'WgmtModeNo', value: typeVal },
                            // { str_colName: 'Nom', value: res[1][paramNom] },
                            // { str_colName: 'T1NegTol', value: res[1][paramT1Neg] },
                            // { str_colName: 'T1PosTol', value: res[1][paramT1Pos] },
                            // { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                            // { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
                            // { str_colName: 'limitOn', value: res[1][limitNo].readUIntLE() },
                            // { str_colName: 'T1NMTTab', value: res[1][paramNMT] },
                            { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                            { str_colName: 'ReportType', value: productObj.Sys_RptType },
                            { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                            { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                            { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                            { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                            { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                            { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                            { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                            { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                            { str_colName: 'RepoLabel11', value: productObj.Sys_Validation }, // this will store wether the test is validation or not 
                            { str_colName: 'PrintNo', value: 0 },
                            { str_colName: 'IsArchived', value: 0 },
                            { str_colName: 'GraphType', value: res[1][reportOn].readUIntLE() },
                            { str_colName: 'BatchComplete', value: 0 },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                            { str_colName: 'Version', value: productObj.Sys_Version },
                            { str_colName: 'Lot', value: objLotData.LotNo },
                            // { str_colName: 'NomEmpty', value: res[1][paramNomEmpty] },
                            // { str_colName: 'T1NegEmpty', value: res[1][paramT1NegEmpty] },
                            // { str_colName: 'T1PosEmpty', value: res[1][paramT1PosEmpty] },
                            // { str_colName: 'T2NegEmpty', value: res[1][paramT2NegEmpty] },
                            // { str_colName: 'T2PosEmpty', value: res[1][paramT2PosEmpty] },
                            // { str_colName: 'GraphTypeEmpty', value: res[1][reportOnEmpty].readUIntLE() },
                            // { str_colName: 'limitOnEmpty', value: res[1][limitNoEmpty].readUIntLE() },
                            // { str_colName: 'NMTTabEmpty', value: res[1][paramNMTEmpty] },
                            { str_colName: 'NomNet', value: res[1][paramNom] },
                            { str_colName: 'T1NegNet', value: res[1][paramT1Neg] },
                            { str_colName: 'T1PosNet', value: res[1][paramT1Pos] },
                            { str_colName: 'T2NegNet', value: res[1][paramT2Neg] },
                            { str_colName: 'T2PosNet', value: res[1][paramT2Pos] },
                            { str_colName: 'T3NegNet', value: res[1][paramT3Neg] },
                            { str_colName: 'T3PosNet', value: res[1][paramT3Pos] },
                            { str_colName: 'GraphTypeNet', value: res[1][reportOn].readUIntLE() },
                            { str_colName: 'limitOnNet', value: res[1][limitNo].readUIntLE() },
                            { str_colName: 'NMTTabNet', value: res[1][paramNMT] },
                            { str_colName: 'Area', value: productObj.Sys_Area },
                            { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                            { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                            { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                            { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                        ]

                    }

                    if (DiffType == "E") {// For filled wgt 
                        var resultincomplete = await database.save(insertIncompleteObj)
                        var lastInsertedID = resultincomplete[0].insertId;
                        const checkTabDetails = {
                            str_tableName: tblDetail,
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
                        var tabDetails = await database.select(checkTabDetails)
                        if (tabDetails[0].length == 0) {
                            const insertIncompleteDetailObj = {
                                str_tableName: tblDetail,
                                data: [
                                    { str_colName: 'RepSerNo', value: lastInsertedID },
                                    { str_colName: 'MstSerNo', value: 0 },
                                    { str_colName: 'RecSeqNo', value: 1 },
                                    { str_colName: 'DataValue', value: tempDiffData.fillWgt },
                                    { str_colName: 'DecimalPoint', value: decimalValue },
                                    { str_colName: 'DataValue1', value: tempDiffData.emptyWgt },
                                ]
                            }
                            res = await database.save(insertIncompleteDetailObj)
                            res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=DataValue-DataValue1 WHERE RepSerNo = ${lastInsertedID} `);
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weightE: weightValue, flag: 'out' },type:'E' })
                            return res;
                        }
                    }

                } else {
                    var masterSrNo = result[0][0].serialNo;

                    if (DiffType = "E") {
                        const checkTabDetails = {
                            str_tableName: tblDetail,
                            data: 'MAX(RecSeqNo) AS SeqNo',
                            condition: [
                                { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                            ]
                        }
                        var tabDetails = await database.select(checkTabDetails)
                        var recSeqNo = tabDetails[0][0].SeqNo + 1;
                        const insertIncompleteDetailObj = {
                            str_tableName: tblDetail,
                            data: [
                                { str_colName: 'RepSerNo', value: masterSrNo },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: recSeqNo },
                                { str_colName: 'DataValue', value: tempDiffData.fillWgt },
                                { str_colName: 'DecimalPoint', value: decimalValue },
                                { str_colName: 'DataValue1', value: tempDiffData.emptyWgt },
                            ]
                        }
                        var res = await database.save(insertIncompleteDetailObj)
                        res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=DataValue-DataValue1 WHERE RepSerNo = ${masterSrNo} `)
                        return res;

                    }
                    // else {
                    //     var masterSrNo = result[0][0].serialNo;
                    //     const checkTabDetails = {
                    //         str_tableName: tblDetail,
                    //         data: 'MAX(RecSeqNo) AS SeqNo',
                    //         condition: [
                    //             { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                    //         ]
                    //     }
                    //     var tabDetails = await database.select(checkTabDetails)
                    //     var recSeqNo = tabDetails[0][0].SeqNo
                    //     const updateIncompleteDetailObjForEmpty = {
                    //         str_tableName: tblDetail,
                    //         data: [
                    //             { str_colName: 'DataValue1', value: newWeight },
                    //             { str_colName: 'DecimalPoint', value: decimalValue }
                    //         ],
                    //         condition: [
                    //             { str_colName: 'RepSerNo', value: masterSrNo },
                    //             { str_colName: 'RecSeqNo', value: recSeqNo },
                    //         ]

                    //     }
                    //     res = await database.update(updateIncompleteDetailObjForEmpty)

                    //     res = await database.execute(`UPDATE tbl_cap_detail3_incomplete SET NetWeight=DataValue-DataValue1 WHERE RepSerNo = ${masterSrNo} and RecSeqNo =${recSeqNo}`)
                    //     return res;
                    // }

                }

            }


        } catch (err) {
            console.log("Error from clsIncompleteDataSave.js", err);
            return err

        }
    }

    async getDiffData(productObj, IdsNo, type = 'incomplete') {
        try {
            let master = 'tbl_cap_master3_incomplete', detail = 'tbl_cap_detail3_incomplete';
            if (type == 'complete') {
                master = 'tbl_cap_master3';
                detail = 'tbl_cap_detail3';
            }
            const productDetailObjforDiff = {
                str_tableName: master,
                data: 'MAX(RepSerNo) AS serialNo',
                condition: [
                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                    { str_colName: 'Idsno', value: IdsNo, comp: 'eq' }
                ]
            }
            var result = await database.select(productDetailObjforDiff)
            var repSerNo = result[0][0].serialNo;
            const checkTabDetails = {
                str_tableName: detail,
                data: 'MAX(RecSeqNo) AS SeqNo',
                condition: [
                    { str_colName: 'RepSerNo', value: repSerNo, comp: 'eq' }
                ]
            }

            var resultRepSerNo = await database.select(checkTabDetails);
            var resultRepSerNo = resultRepSerNo[0][0].SeqNo;
            const getDetailDiff = {
                str_tableName: detail,
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: repSerNo, comp: 'eq' },
                    { str_colName: 'RecSeqNo', value: resultRepSerNo, comp: 'eq' }
                ]
            }
            var resultDetailDiff = await database.select(getDetailDiff);
            return resultDetailDiff;

        } catch (err) {
            console.log("getDiffData", err)
            return err;
        }
    }


}
module.exports = IncompleteDataSave;
