const globalData = require('../../global/globalData');
const Database = require('../../database/clsQueryProcess');
const ErrorLog = require('../../model/clsErrorLog');
const projectconfig = require('../../global/severConfig')
const database = new Database();
const date = require('date-and-time');
const ProductDetail = require('../clsProductDetailModel');
const proObj = new ProductDetail();
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const objMonitor = new clsMonitor();
var BatchSummary = require('../Weighments/clsBatchSummaryDataTransfer');
var objBatchSummary = new BatchSummary();
const printReport = require('../Weighments/clsPrintReport');
const objPrintReport = new printReport();
const clsActivityLog = require('../clsActivityLogModel');
const objActivityLog = new clsActivityLog();
class LOD {
    async saveLodData(productObj, arrLodData, tempUserObject, IdsNo, protocolIncomingType) {
        try {
            var department = "";
            let responseObj = {};
            var selectedCubicle;
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var cubicType, GranuRepoHeading = 0, decimalPoint;
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            //productObj.Sys_CubType == 'Capsule Filling' below for pallet-II in cipla kurkumbh

            if ((productObj.Sys_CubType == 'IPQC' ||
                productObj.Sys_CubType == 'Granulation') && (productObj.Sys_Area == 'Granulation' || productObj.Sys_Area == 'Effervescent Granulation'
                    || productObj.Sys_Area == 'Pallet Coating' ||
                    productObj.Sys_Area == 'Capsule Filling' ||
                    productObj.Sys_Area == 'Pellets-II' || productObj.Sys_Area == 'MFG-1 Processing Area'
                    || productObj.Sys_Area == 'MFG-1 Blending Area' || productObj.Sys_Area == 'MFG-3 IPQC'
                    || productObj.Sys_Area == 'MFG-2 Processing Area' || productObj.Sys_Area == 'MFG-2 Blending Area'
                    || productObj.Sys_Area == 'MFG-8 Processing Area' || productObj.Sys_Area == 'MFG-8 IPQC'
                    || productObj.Sys_Area == 'MFG-5 Capsule' || productObj.Sys_Area == 'MFG-6 Capsule' || productObj.Sys_Area == 'Pellet IPQC')) {
                department = productObj.Sys_dept;
                selectedCubicle = productObj;
                cubicType = 1;

                // var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                // if (IPQCObject != undefined) {
                //     selectedIds = IPQCObject.selectedIds
                // } else {
                //     selectedIds = idsNo;
                // };



                if (globalData.arrLODTypeSelectedMenu.find(k => k.idsNo == IdsNo) == undefined) {
                    globalData.arrLODTypeSelectedMenu.push({ idsNo: IdsNo, selectedLOD: "GRANULES DRY" })
                }
                let tempMenuLOD = globalData.arrLODTypeSelectedMenu.find(k => k.idsNo == IdsNo);
                switch (tempMenuLOD.selectedLOD) {
                    case 'GRANULES DRY': // COMPRESSED DRY
                        GranuRepoHeading = 1;
                        break;
                    case 'GRANULES LUB': //COMPRESSED LUB
                        GranuRepoHeading = 2;
                        break;
                    case 'LAYER1 DRY':
                        GranuRepoHeading = 3;
                        break;
                    case 'LAYER1 LUB':
                        GranuRepoHeading = 4;
                        break;
                    case 'LAYER2 DRY':
                        GranuRepoHeading = 5;
                        break;
                    case 'LAYER2 LUB':
                        GranuRepoHeading = 6;
                        break;
                    default:
                        // for coating and compression
                        // Finding Out the department of selected for coating and compression
                        var objGranuInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                        let objCompCoatInfo = globalData.arrIdsInfo.find(k => k.Sys_ProductName == objGranuInfo.Sys_ProductName
                            && k.Sys_BFGCode == objGranuInfo.Sys_BFGCode && k.Sys_PVersion == objGranuInfo.Sys_PVersion
                            && k.Sys_Version == objGranuInfo.Sys_Version && (k.Sys_Area != 'Granulation' || k.Sys_Area != 'Effervescent Granulation'));

                        department = objCompCoatInfo.Sys_dept;
                        selectedCubicle = objCompCoatInfo;
                        GranuRepoHeading = 0;
                        cubicType = 0;
                }
            } else {
                // For Compression and coating
                cubicType = 0;
                GranuRepoHeading = 0;
            }
            let now = new Date();
            let tempLODdata = globalData.arrLodData.find(lod => lod.idsNo == IdsNo);
            if ((tempLODdata.arr.length != 0) && tempLODdata.arr.length >= 2) {

                if ((tempLODdata.arr[0].Modal == 'HS153' && tempLODdata.arr.length == 3) || (tempLODdata.arr[0].Modal == 'HX204' && tempLODdata.arr.length == 3)) {
                    var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                    if (objLodData == undefined) {
                        globalData.arrLodData.push({ idsNo: IdsNo, arr: [], counter: 0 })
                    }
                    else {
                        objLodData.arr = [];
                    }
                    console.log('InValid LOD data string');
                    return 'Invalid data string';
                }
                if (tempLODdata.arr[1].flag == true) {
                    // here check product is from granulation or COMP & COAT
                    let objSelectedLOD = globalData.arrLODTypeSelectedMenu.find(k => k.idsNo == IdsNo);
                    var productTableName = "";
                    if (objSelectedLOD != undefined) {
                        if (objSelectedLOD.selectedLOD == "LOD COATING") {
                            productTableName = "tbl_product_tablet_coated";
                        } else if (objSelectedLOD.selectedLOD == "LOD COMPRESSION") {
                            productTableName = "tbl_product_tablet";
                        }
                    } else if (productObj.Sys_Area == 'Compression' || productObj.Sys_Area == 'Effervescent Compression') {
                        productTableName = "tbl_product_tablet";
                    } else if (productObj.Sys_Area == 'Coating') {
                        productTableName = "tbl_product_tablet_coated";
                    }

                    if (productObj.Sys_Area == 'Pellets-II') {
                        productTableName = "tbl_product_gran_cap";
                    }
                    var res = await proObj.productData(productObj, productTableName);

                    if (GranuRepoHeading != 0) {
                        var paramNom = `Param${GranuRepoHeading}_Nom`;
                        var paramLow = `Param${GranuRepoHeading}_Low`;
                        var paramUpp = `Param${GranuRepoHeading}_Upp`;
                        var paramDp = `Param${GranuRepoHeading}_DP`;
                        var paramIsOnStd = `Param${GranuRepoHeading}_IsOnStd`;
                    } else {
                        var paramNom = `Param16_Nom`;
                        var paramLow = `Param16_T1Neg`;
                        var paramUpp = `Param16_T1Pos`;
                        var paramDp = `Param16_DP`;
                        var paramIsOnStd = `Param16_LimitOn`;
                    }


                    const checkData = {
                        str_tableName: 'tbl_lodmaster',
                        data: 'MAX(MstSerNo) AS SeqNo',
                        condition: [
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                            { str_colName: 'IdsNo', value: IdsNo, comp: 'eq' },
                        ]
                    }
                    let result = await database.select(checkData);
                    var intMstSerNo;
                    if (result[0][0].SeqNo == null) {
                        intMstSerNo = 1;
                    } else {
                        var newMstSerNo = result[0][0].SeqNo + 1;
                        intMstSerNo = newMstSerNo;
                    }
                    const checkBRepSer = {
                        str_tableName: 'tbl_lodmaster',
                        data: 'MAX(BRepSerNo) AS BRepSeqNo',
                        condition: [
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                            { str_colName: 'ReportType', value: productObj.Sys_RptType, comp: 'eq' },
                            { str_colName: 'Side', value: productObj.Sys_RotaryType, comp: 'eq' },
                        ]
                    }
                    let batchResult = await database.select(checkBRepSer);
                    var intBRepSerNo;
                    if (batchResult[0][0].BRepSeqNo == null) {
                        intBRepSerNo = 1;
                    } else {
                        var newBRepSerNo = batchResult[0][0].BRepSeqNo + 1;
                        intBRepSerNo = newBRepSerNo;
                    }


                    let arrToObj = arrLodData.reduce(((r, c) => Object.assign(r, c)), {})
                    if (arrToObj.hasOwnProperty("iniWt") && arrToObj.hasOwnProperty("setTemp")) {
                        if ((isNaN(parseInt(arrToObj['iniWt']))) || (isNaN(parseInt(arrToObj['setTemp'])))) {
                            return 'Invalid data string';
                        }
                    }


                    // if (arrToObj.hasOwnProperty("iniWt")) {
                    var isModalExist = arrToObj.hasOwnProperty("Modal")
                    var arrTempSplit = isModalExist ?
                        arrLodData[2].iniWt.split(".") :
                        arrLodData[1].iniWt.split(".")
                    //}


                    decimalPoint = arrTempSplit[1] == undefined ? 0 : arrTempSplit[1].length;
                    var lossOnWt;
                    var finwt = arrLodData.filter(k => k.hasOwnProperty('finalWt'))
                    if (finwt.length == 0) {

                        //arrLodData[2].finalWt == undefined || 
                        lossOnWt = 0;
                    }
                    else {
                        lossOnWt = finwt[0].finalWt
                        //lossOnWt = arrLodData[2].finalWt

                    }


                    if (!lossOnWt == 0) {
                        var saveLodData = {
                            str_tableName: 'tbl_lodmaster',
                            data: [
                                { str_colName: 'MstSerNo', value: intMstSerNo },
                                { str_colName: 'BRepSerNo', value: intBRepSerNo },
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                { str_colName: 'ProductType', value: ProductType.productType },
                                { str_colName: 'IdsNo', value: IdsNo },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                { str_colName: 'StartTm', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                { str_colName: 'CubicleLocation', value: department },
                                { str_colName: 'InstruId', value: 0 },
                                { str_colName: 'Side', value: productObj.Sys_RotaryType },
                                { str_colName: 'DryingTemp', value: 0 },
                                { str_colName: 'SampleWt', value: 0 },
                                //{ str_colName: 'LossOnWt', value: 0 },
                                { str_colName: 'UserId', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'PrintNo', value: 0 },
                                { str_colName: 'Remark', value: 0 },
                                { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                { str_colName: 'MachineId', value: productObj.Sys_MachineCode },
                                { str_colName: 'MinLimit', value: res[1][paramLow] },
                                { str_colName: 'MaxLimit', value: res[1][paramUpp] },
                                { str_colName: 'Stage', value: productObj.Sys_Stage },
                                { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Unit', value: 0 },
                                { str_colName: 'DecimalPoint', value: decimalPoint },
                                { str_colName: 'WgmtModeNo', value: 0 },
                                { str_colName: 'BatchComplete', value: 0 },
                                { str_colName: 'LODID', value: currentCubicle.Sys_MoistID },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                { str_colName: 'Version', value: productObj.Sys_Version },
                                //  { str_colName: 'CheckedByID', value: nwtAfterTest },
                                //  { str_colName: 'CheckedByName', value: lwtBeforeTest },
                                //  { str_colName: 'CheckedByDate', value: lwtAfterTest },
                                { str_colName: 'LotNumber', value: productObj.Sys_LotNo },
                                // { str_colName: 'RunTime', value: rwtBeforeTest },
                                { str_colName: 'DryWt', value: isModalExist ? arrLodData[2].iniWt : arrLodData[1].iniWt },
                                { str_colName: 'LossOnWt', value: lossOnWt },
                                { str_colName: 'MoistCont', value: 0 },
                                { str_colName: 'RotaryType', value: 0 },
                                //{ str_colName: 'SerialNo', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'Layer', value: res[0].IsBilayerLbl },
                                { str_colName: 'SetTemp', value: isModalExist ? arrLodData[1].setTemp : arrLodData[0].setTemp },
                                { str_colName: 'IsRepoComp', value: cubicType },
                                { str_colName: 'GranuRepoHeading', value: GranuRepoHeading },
                                { str_colName: 'RepoLabel11', value: currentCubicle.Sys_Validation },
                                { str_colName: 'Lot', value: objLotData.LotNo },
                                { str_colName: 'Area', value: productObj.Sys_Area },
                                { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },

                            ]
                        }

                        await database.save(saveLodData);
                        Object.assign(responseObj, { status: 'success' });
                        // If Initial weight completes then set initWt flag to false
                        objMonitor.monit({ case: 'LODFINWT', idsNo: IdsNo, data: { test: 'MOISTURE ANALYZER' } });
                        tempLODdata.arr[0].flag = false;
                    }
                    //resolve(responseObj);

                    let initwt = isModalExist ? arrLodData[2].iniWt : arrLodData[1].iniWt
                    if (initwt != undefined && lossOnWt != 0) {

                        let result = await this.SaveLodLastPortion(productObj, tempUserObject, IdsNo, protocolIncomingType, tempLODdata, cubicType, responseObj);

                        return result;
                    }
                    else {

                        return `${protocolIncomingType}R0,,,,,`;
                    }

                }
                else {


                    const objMasterData = {
                        str_tableName: "tbl_lodmaster",
                        data: 'max(RepSerNo) as RepSerNo',
                        condition: [
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                            { str_colName: 'IdsNo', value: IdsNo, comp: 'eq' },
                            { str_colName: 'IsRepoComp', value: cubicType, comp: 'eq' },
                        ]
                    }

                    let res = await database.select(objMasterData);
                    var maxRepNo = res[0][0].RepSerNo;

                    const updateData = {
                        str_tableName: 'tbl_lodmaster',
                        data: [
                            { str_colName: 'LossOnWt', value: tempLODdata.arr[2].finalWt },
                        ],
                        condition: [
                            { str_colName: 'RepSerNo', value: maxRepNo, comp: 'eq' }
                        ]
                    }
                    await database.update(updateData);
                    let result = await this.SaveLodLastPortion(productObj, tempUserObject, IdsNo, protocolIncomingType, tempLODdata, cubicType, responseObj);

                    return result;

                }
            } else {
                //clearing and reiniting LOD DATA
                var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                if (objLodData == undefined) {
                    globalData.arrLodData.push({ idsNo: IdsNo, arr: [], counter: 0 })
                }
                else {
                    objLodData.arr = [];
                }
                console.log('InValid LOD data string');
                return 'Invalid data string';
            }
        } catch (err) {
            var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
            if (objLodData == undefined) {
                globalData.arrLodData.push({ idsNo: IdsNo, arr: [], counter: 0 })
            }
            else {
                objLodData.arr = [];
            }
            // Error loging in Error file
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err.stack)
            throw new Error(err);
        }
    }

    async SaveLodLastPortion(productObj, tempUserObject, IdsNo, protocolIncomingType, tempLODdata, cubicType, responseObj) {

        const objMasterData = {
            str_tableName: "tbl_lodmaster",
            data: 'max(RepSerNo) as RepSerNo',
            condition: [
                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                { str_colName: 'IdsNo', value: IdsNo, comp: 'eq' },
                { str_colName: 'IsRepoComp', value: cubicType, comp: 'eq' },
            ]
        }

        let res = await database.select(objMasterData);
        var maxRepNo = res[0][0].RepSerNo;

        var objActivity = {};
        Object.assign(objActivity,
            { strUserId: tempUserObject.UserId },
            { strUserName: tempUserObject.UserName },
            { activity: 'LOD Weighment Completed on IDS' + IdsNo });

        await objActivityLog.ActivityLogEntry(objActivity);
        var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
        if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {




            await objBatchSummary.saveBatchSummaryLOD(productObj, productObj.Sys_IDSNo, tempLODdata, tempUserObject);
        }
        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'MOISTURE ANALYZER', flag: 'COMPLETED' } });
        var resultRemark = `${protocolIncomingType}R3,,,,,`;
        var LOD = await database.execute(`SELECT ROUND(CAST((((DryWt-LossOnWt)/DryWt)*100) AS DECIMAL(20,15)),2) AS lodPer,ROUND(CAST(minLimit AS DECIMAL(20,15)),2)  AS MINWT,ROUND(CAST(maxLimit AS DECIMAL(20,15)),2) AS MAXWT FROM tbl_lodmaster WHERE RepSerNo=${maxRepNo}`);
        Object.assign(responseObj, { status: 'success' })
        if (parseFloat(LOD[0][0].MINWT) <= parseFloat(LOD[0][0].lodPer) &&
            parseFloat(LOD[0][0].lodPer) <= parseFloat(LOD[0][0].MAXWT)) {
            resultRemark = `${protocolIncomingType}R1,,,,,`;
        } else {
            resultRemark = `${protocolIncomingType}R2,,,,,`;
        }

        if (productObj.Sys_RptType == 0) {
            var objOnlineReport = {
                SelectedAction: maxRepNo,
                UserId: tempUserObject.UserId,
                UserName: tempUserObject.UserName,
                waterMark: true,
                SelectedValue: LOD[0][0].lodPer,
            }
            const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

            var objReport = {
                reportOption: 'Moisture Analyzer',
                RepSerNo: maxRepNo
            }
            await objPrintReport.printReport(objOnlineReport, objReport, objPrinterName.Sys_PrinterName);
        } else {
            // console.log('Initial report')
        }
        //clearing and reiniting LOD DATA
        var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
        if (objLodData == undefined) {
            globalData.arrLodData.push({ idsNo: IdsNo, arr: [], counter: 0 })
        }
        else {
            objLodData.arr = [];
        }
        return resultRemark;


    }


}
module.exports = LOD;