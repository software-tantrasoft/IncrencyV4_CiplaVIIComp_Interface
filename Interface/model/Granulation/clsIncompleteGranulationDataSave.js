const ClsProduct = require('../clsProductDetailModel');
const proObj = new ClsProduct();
const Database = require('../../database/clsQueryProcess');
const database = new Database();
const globalData = require('../../global/globalData');
const date = require('date-and-time');
class IncompleteGranulationData {
    async saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo) {

        var actualWt = protocol.split(" ");
        var now = new Date();
        var side = actualWt[0].substring(4, 3);
        var actualSampleValue = actualWt[1].substring(4, 3);
        actualSampleValue = parseInt(actualSampleValue);
        var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
        var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
        var currentCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
        var sideValue, weight, decimalValue, actualUnit, newWeight, masterTable, detailTable, typeVal, WgmtModeNo;
        if (side == 'N') {
            sideValue = 'NA';
        } else if (side == 'L') {
            sideValue = 'LHS';
        } else if (side == 'R') {
            sideValue = 'RHS';
        }

        var wtVal = actualWt[2].split(",")[0];//weight value
        actualUnit = actualWt[3].substring(0, 1);//unit value
        //var numval = wtVal.length;
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
        if (typeValue == 'P') {
            if (ProductType.productType == 1) {
                masterTable = 'tbl_tab_master18_incomplete';
                detailTable = 'tbl_tab_detail18_incomplete';
            } else {
                masterTable = 'tbl_cap_master18_incomplete';
                detailTable = 'tbl_cap_detail18_incomplete';
            }
            typeVal = 9;
            WgmtModeNo = 18;
        } else {
            if (ProductType.productType == 1) {
                masterTable = 'tbl_tab_master17_incomplete';
                detailTable = 'tbl_tab_detail17_incomplete';
            } else {
                masterTable = 'tbl_cap_master17_incomplete';
                detailTable = 'tbl_cap_detail17_incomplete';
            }
            typeVal = 8;
            WgmtModeNo = 17;
        }


        var noOfSample = intNos;

        if (actualSampleValue <= noOfSample) {
            const res = await proObj.productData(cubicalObj)

            var paramT1Neg = `Param${typeVal}_Low`;
            var paramT1Pos = `Param${typeVal}_Upp`;
            const masterData = {
                str_tableName: masterTable,
                data: 'MAX(RepSerNo) AS serialNo',
                condition: [
                    { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                ]
            }
            await database.select(masterData)
            var intMstSerNo;
            if (actualSampleValue == 1) {
                intMstSerNo = 1;
                const masterObj = {
                    str_tableName: masterTable,
                    data: [
                        { str_colName: 'MstSerNo', value: intMstSerNo },
                        { str_colName: 'InstruId', value: 1 },
                        { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode },
                        { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName },
                        { str_colName: 'ProductType', value: ProductType.productType },
                        { str_colName: 'Qty', value: noOfSample },
                        { str_colName: 'GrpQty', value: noOfSample },
                        { str_colName: 'GrpFreq', value: noOfSample },
                        { str_colName: 'Idsno', value: cubicalObj.Sys_IDSNo },
                        { str_colName: 'CubicalNo', value: cubicalObj.Sys_CubicNo },
                        { str_colName: 'BalanceId', value: currentCubic.Sys_BalID },
                        //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                        { str_colName: 'VernierId', value: currentCubic.Sys_VernierID },
                        //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                        { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch },
                        { str_colName: 'UserId', value: tempUserObject.UserId },
                        { str_colName: 'UserName', value: tempUserObject.UserName },
                        { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                        { str_colName: 'Side', value: sideValue },
                        { str_colName: 'Unit', value: actualUnit },
                        { str_colName: 'DecimalPoint', value: decimalValue },
                        { str_colName: 'WgmtModeNo', value: WgmtModeNo },
                        { str_colName: 'Nom', value: 0 },
                        { str_colName: 'T1NegTol', value: res[1][paramT1Neg] },
                        { str_colName: 'T1PosTol', value: res[1][paramT1Pos] },
                        // { str_colName: 'T2NegTol', value: res[paramT2Neg] },
                        // { str_colName: 'T2PosTol', value: res[paramT2Pos] },
                        // { str_colName: 'limitOn', value: res[limitNo].readUIntLE() },
                        //{ str_colName: 'NomEmpty', value:  },
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
                        { str_colName: 'RepoLabel10', value: res[0].IsBilayerLbl },
                        { str_colName: 'RepoLabel11', value: cubicalObj.Sys_Validation },
                        // { str_colName: 'RepoLabel12', value:  },
                        // { str_colName: 'RepoLabel13', value:  },
                        { str_colName: 'PrintNo', value: 0 },
                        { str_colName: 'IsArchived', value: 0 },
                        { str_colName: 'GraphType', value: 0 },
                        { str_colName: 'BatchComplete', value: 0 },
                        { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion },
                        { str_colName: 'Version', value: cubicalObj.Sys_Version },
                        { str_colName: 'Lot', value: objLotData.LotNo },
                        // { str_colName: 'Area', value: cubicalObj.Sys_Area },
                        { str_colName: 'AppearanceDesc', value: cubicalObj.Sys_Appearance },
                        { str_colName: 'MachineSpeed_Min', value: cubicalObj.Sys_MachineSpeed_Min },
                        { str_colName: 'MachineSpeed_Max', value: cubicalObj.Sys_MachineSpeed_Max },
                        { str_colName: 'GenericName', value: cubicalObj.Sys_GenericName },
                        { str_colName: 'BMRNo', value: cubicalObj.Sys_BMRNo },
                        // { str_colName: 'CheckedByID', value: },
                        // { str_colName: 'CheckedByName', value:  },
                        // { str_colName: 'CheckedByDate', value:  },
                        // { str_colName: 'BRepSerNo', value:  }
                    ]
                }
                const masterResult = await database.save(masterObj)
                var lastInsertedID = masterResult[0].insertId;


                let objUpdatepowerbackup = {
                    str_tableName: 'tbl_powerbackup',
                    data: [
                        { str_colName: 'Incomp_RepSerNo', value: lastInsertedID }
                    ],
                    condition: [
                        { str_colName: 'Idsno', value: IdsNo },
                        { str_colName: 'Sys_BFGCode', value: cubicalObj.Sys_BFGCode },
                        { str_colName: 'Sys_Batch', value: cubicalObj.Sys_Batch }

                    ]
                }
                await database.update(objUpdatepowerbackup);

                const checkTabDetails = {
                    str_tableName: detailTable,
                    data: '*',
                    condition: [
                        { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
                    ]
                }
                var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == IdsNo);
                if (tempObj == undefined) {
                    globalData.arrIncompleteRemark.push({ weighment: true, RepoSr: lastInsertedID, Type: typeValue, IdsNo: IdsNo });
                }
                else {
                    tempObj.weighment = true;
                    tempObj.RepoSr = lastInsertedID;
                    tempObj.Type = typeValue;
                    //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                }
                const detaildata = await database.select(checkTabDetails)

                if (detaildata[0].length == 0) {
                    const detailObj = {
                        str_tableName: detailTable,
                        data: [
                            { str_colName: 'RepSerNo', value: lastInsertedID },
                            { str_colName: 'MstSerNo', value: 0 },
                            { str_colName: 'RecSeqNo', value: 1 },
                            { str_colName: 'DataValue', value: newWeight },
                            { str_colName: 'DecimalPoint', value: decimalValue },
                        ]
                    }
                    await database.save(detailObj)
                    return 'success'
                }
            } else {

                const checkTabDetails = {
                    str_tableName: detailTable,
                    data: 'MAX(RecNo) AS SeqNo',
                }
                const tabDetails = await database.select(checkTabDetails)
                const selrepo = {
                    str_tableName: detailTable,
                    data: '*',
                    condition: [
                        { str_colName: 'RecNo', value: tabDetails[0][0].SeqNo }
                    ]

                }
                const resRepoSr = await database.select(selrepo)
                var recSeqNo = resRepoSr[0][0].RecSeqNo + 1;
                const insertIncompleteDetailObj = {
                    str_tableName: detailTable,
                    data: [
                        { str_colName: 'RepSerNo', value: resRepoSr[0][0].RepSerNo },
                        { str_colName: 'MstSerNo', value: 0 },
                        { str_colName: 'RecSeqNo', value: recSeqNo },
                        { str_colName: 'DataValue', value: newWeight },
                        { str_colName: 'DecimalPoint', value: decimalValue }
                    ]
                }
                await database.save(insertIncompleteDetailObj)
                const updateEndTimeObj = {
                    str_tableName: masterTable,
                    data: [
                        { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
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
                await database.update(updateEndTimeObj)
                return 'success';
            }
        }

    }
}
module.exports = IncompleteGranulationData;