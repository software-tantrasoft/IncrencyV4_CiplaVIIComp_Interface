const Database = require('../../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time')
const globalData = require('../../global/globalData')

const ClsProduct = require('../clsProductDetailModel');
const proObj = new ClsProduct();
var clsclsGetMstSrAndSideSr = require('../Weighments/clsGetMstSrAndSideSr')
const objGetMstSrAndSideSr = new clsclsGetMstSrAndSideSr();
const InstrumentUsage = require('../clsInstrumentUsageLog');
const objInstrumentUsage = new InstrumentUsage();

class IncompleteDataSave {
    /**
     * To save Incomplete Data
     * @param {*} productObj 
     * @param {*} wt 
     * @param {*} intNos 
     * @param {*} tblMaster 
     * @param {*} tblDetail 
     */
    async saveData(productObj, wt, intNos, typeValue, tempUserObject, tblMaster, tblDetail, IdsNo) {
        try {

            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            let now = new Date();
            var actualWt = wt.split(" ");
            var side = actualWt[0].substring(4, 3);
            var actualSampleValue = actualWt[1].substring(1, 4);
            var sideValue, weight, decimalValue, actualUnit, newWeight;
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var mstSerNo = ''
            var sideNo = ''
            if (side == 'N') {
                sideValue = 'NA';
            } else if (side == 'L') {
                sideValue = 'LHS';
            } else if (side == 'R') {
                sideValue = 'RHS';
            }


            //below code done for individual layer 1 and layer 2
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

            if (typeVal == 3 || typeVal == 4 || typeVal == 5 || typeVal == 6) {
                actualUnit = 'mm' //as per discussion with pushkar we will hardcode mm as unit 
            }

            var noOfSample = intNos;

            if (parseInt(actualSampleValue) <= noOfSample) {

                var res = await proObj.productData(productObj);

                var paramNom = `Param${typeVal}_Nom`;
                var paramT1Neg = `Param${typeVal}_T1Neg`;
                var paramT1Pos = `Param${typeVal}_T1Pos`;
                var paramT2Neg = `Param${typeVal}_T2Neg`;
                var paramT2Pos = `Param${typeVal}_T2Pos`;
                var limitNo = `Param${typeVal}_LimitOn`;
                var paramNMT = `Param${typeVal}_NMTTab`;
                var reportOn = `Param${typeVal}_IsOnStd`;
                var paramUnit = `Param${typeVal}_Unit`
                let productUnit;
                if ((typeValue == 1) || (typeValue == 8) || (typeValue == 'L')) {
                    if (typeValue == 1) {
                        productUnit = tempLimObj.Individual.unit;
                    } else if (typeValue == 8) {
                        productUnit = tempLimObj.Ind_Layer.unit;
                    } else if (typeValue == 'L') {
                        productUnit = tempLimObj.Ind_Layer1.unit;
                    } else {
                        productUnit = res[1][paramUnit];
                    }
                    actualUnit = actualWt[3].substring(0, 1);
                    var responseType = actualWt[3].split("");
                    var actualResponseType = responseType[1];//here weight is check, R = repeat and N = new
                    var wgt = actualWt[2];
                    let incomingUnit = actualWt[3].split(/N|R|r|n/)[0].toLowerCase();
                    actualUnit = incomingUnit;


                    //to string is integer
                    if (wgt.toString().match(/^\d+$/)) {
                        newWeight = wgt;
                        decimalValue = 0;
                    }
                    else {
                        weight = wgt.toString().split(".");
                        newWeight = wgt;
                        decimalValue = weight[1].length
                    }



                    let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                    if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                        if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                            wgt = wgt / 1000; // mg->gm
                        } else {
                            wgt = wgt * 1000; // mg -> gm
                        }
                    }


                }
                else {
                    var wtVal = actualWt[2].split(",")[0];//weight value
                    actualUnit = actualWt[2].split(",")[1];//unit value
                    if (typeValue == 3) {
                        productUnit = tempLimObj.Thickness.unit;
                    } else if (typeValue == 4) {
                        if (objProductType.productType == 2) {
                            productUnit = tempLimObj.Diameter.unit;
                        }
                        else {
                            productUnit = tempLimObj.Breadth.unit;
                        }
                    } else if (typeValue == 5) {
                        productUnit = tempLimObj.Length.unit;
                    } else if (typeValue == 6) {
                        productUnit = tempLimObj.Diameter.unit;
                    } else {
                        productUnit = res[1][paramUnit];
                    }
                    // productUnit = res[1][paramUnit];
                    // actualUnit = productUnit;
                    //var numval = wtVal.length;;
                    if (wtVal.match(/^\d+$/)) {
                        newWeight = wtVal;
                        decimalValue = 0;
                    }
                    else {
                        var weightVal = wtVal.split('.');
                        weight = weightVal[0];
                        decimalValue = weightVal[1].length
                        newWeight = wtVal;
                    }
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

                var result = await database.select(productDetailObj)
                if (result[0][0].serialNo == null || actualSampleValue == 1) {



                    // added by vivek on 02-04-2020*****************************************
                    if (productObj.Sys_RptType == 1) {// initial report
                        mstSerNo = 1 //hardcoded
                        sideNo = 1 //hardcoded

                    }
                    else { //regular report
                        if (sideValue == 'NA') {
                            mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(tblMaster, 0, sideValue, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                            sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(tblMaster, 0, sideValue, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                            if (sideNo < 10) {
                                sideNo = sideNo + 1;
                            }
                            else {
                                sideNo = 1;
                                mstSerNo = mstSerNo + 1;
                            }
                        }
                        else {
                            mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(tblMaster, 0, sideValue, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                            sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(tblMaster, 0, sideValue, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                            if (sideNo < 5) {
                                sideNo = sideNo + 1;
                            }
                            else {
                                sideNo = 1;
                                mstSerNo = mstSerNo + 1;
                            }
                        }
                    }
                    //**********************************************************************/
                    const insertIncompleteObj = {
                        str_tableName: tblMaster,
                        data: [
                            { str_colName: 'MstSerNo', value: mstSerNo }, //modified by vivek
                            { str_colName: 'SideNo', value: sideNo },// added by vivek 02/04/2020
                            { str_colName: 'InstruId', value: 1 },
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                            { str_colName: 'ProductType', value: objProductType.productType },
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
                            // { str_colName: 'Unit', value:actualUnit },
                            { str_colName: 'Unit', value: productUnit },//inserting product unit
                            { str_colName: 'DecimalPoint', value: decimalValue },
                            { str_colName: 'WgmtModeNo', value: typeVal },
                            { str_colName: 'Nom', value: res[1][paramNom] },
                            { str_colName: 'T1NegTol', value: res[1][paramT1Neg] },
                            { str_colName: 'T1PosTol', value: res[1][paramT1Pos] },
                            { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                            { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
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
                            { str_colName: 'RepoLabel14', value: productObj.Sys_IPQCType },//added for MLV to save ipqc subtype //added by vivek on 21-10-2020
                            // { str_colName: 'RepoLabel12', value:  },
                            // { str_colName: 'RepoLabel13', value:  },
                            { str_colName: 'PrintNo', value: 0 },
                            { str_colName: 'IsArchived', value: 0 },
                            { str_colName: 'GraphType', value: res[1][reportOn].readUIntLE() },
                            { str_colName: 'BatchComplete', value: 0 },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                            { str_colName: 'Version', value: productObj.Sys_Version },
                            { str_colName: 'Lot', value: objLotData.LotNo },
                            { str_colName: 'Area', value: productObj.Sys_Area },
                            { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                            { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                            { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                            { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                            { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                            // { str_colName: 'CheckedByID', value: },
                            // { str_colName: 'CheckedByName', value:  },
                            // { str_colName: 'CheckedByDate', value:  },
                            // { str_colName: 'BRepSerNo', value:  }
                        ]

                    }


                    //console.log(insertIncompleteObj);
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


                    const fetchRepNo = {
                        str_tableName: tblMaster,
                        data: 'MstSerNo,RepSerNo',
                        condition: [
                            { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
                        ]
                    }
                    var objfetchMasterNo = await database.select(fetchRepNo)


                    var selectedIds;
                    var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                    if (IPQCObject != undefined) {
                        selectedIds = IPQCObject.selectedIds;

                    } else {
                        selectedIds = IdsNo; // for compression and coating
                    };

                    var currentCubical = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                    //update powerbackup master report serial no here
                    let objUpdatepowerbackup = {
                        str_tableName: 'tbl_powerbackup',
                        data: [
                            { str_colName: 'Incomp_RepSerNo', value: objfetchMasterNo[0][0].RepSerNo }
                        ],
                        condition: [
                            { str_colName: 'Idsno', value: IdsNo },
                            { str_colName: 'Sys_BFGCode', value: currentCubical.Sys_BFGCode },
                            { str_colName: 'Sys_Batch', value: currentCubical.Sys_Batch }

                        ]
                    }
                    await database.update(objUpdatepowerbackup);


                    var tabDetails = await database.select(checkTabDetails)
                    if (tabDetails[0].length == 0) {
                        const insertIncompleteDetailObj = {
                            str_tableName: tblDetail,
                            data: [
                                { str_colName: 'RepSerNo', value: lastInsertedID },
                                { str_colName: 'MstSerNo', value: objfetchMasterNo[0][0].MstSerNo },
                                { str_colName: 'RecSeqNo', value: 1 },
                                { str_colName: 'DataValue', value: newWeight },
                                { str_colName: 'DecimalPoint', value: decimalValue }
                            ]
                        }

                        if (tabDetails[0].length == 0) {
                            var recSeqNo = 1
                        }
                        else {
                            var recSeqNo = tabDetails[0][0].SeqNo + 1
                        }
                        if (parseInt(actualSampleValue) == recSeqNo) {
                            res = await database.save(insertIncompleteDetailObj)
                        }
                        else {
                            //logFromPC.addtoProtocolLog(`sample no ${actualSampleValue} recieved instead of ${recSeqNo}`)

                        }
                        return res;
                    }




                } else {
                    var masterSrNo = result[0][0].serialNo;
                    const checkTabDetails = {
                        str_tableName: tblDetail,
                        data: 'MAX(RecSeqNo) AS SeqNo',
                        condition: [
                            { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                        ]
                    }
                    var tabDetails = await database.select(checkTabDetails)

                    const fetchMasterNo = {
                        str_tableName: tblMaster,
                        data: 'MstSerNo',
                        condition: [
                            { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' }
                        ]
                    }
                    var objfetchMasterNo = await database.select(fetchMasterNo)

                    var recSeqNo = tabDetails[0][0].SeqNo + 1;
                    const insertIncompleteDetailObj = {
                        str_tableName: tblDetail,
                        data: [
                            { str_colName: 'RepSerNo', value: masterSrNo },
                            { str_colName: 'MstSerNo', value: objfetchMasterNo[0][0].MstSerNo },
                            { str_colName: 'RecSeqNo', value: recSeqNo },
                            { str_colName: 'DataValue', value: newWeight },
                            { str_colName: 'DecimalPoint', value: decimalValue }
                        ]
                    }
                    if (parseInt(actualSampleValue) == recSeqNo) {
                        var res = await database.save(insertIncompleteDetailObj)
                    }
                    else {
                        //logFromPC.addtoProtocolLog(`sample no ${actualSampleValue} recieved instead of ${recSeqNo}`)
                    }

                    switch(typeValue) {
                        case '1':  case '2':  case '8':  case 'L': case 'P': case 'F': 
                            var tblName = 'tbl_instrumentlog_balance';
                             break;
                        case '3':  case '4':  case '5':  case '6':
                             var tblName = 'tbl_instrumentlog_vernier';
                             break;
                      }
                    objInstrumentUsage.InstrumentUsage(' ', IdsNo, tblName, " ", 'In Process');

                    return res;

                }


            }



        } catch (err) {
            console.log("Error from clsIncompleteDataSave.js", err);
            return err

        }
    }
}
module.exports = IncompleteDataSave;
