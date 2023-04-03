const implementjs = require('implement-js')
const implement = implementjs.default;
const IProduct = require('../../../Interfaces/productInterface');
const globalData = require('../../global/globalData');
const Database = require('../../database/clsQueryProcess');
const CubicalSetting = require('../Cubical/clsCubicalSetting');
const ProductDetail = require('../Product/clsProductModel');
const objCheckSum = require('../../middleware/checksum');
const objEncryptDecrypt = require('../../middleware/encdecAlgo');
const objServer = require('../../../index.js');
const clsProtocolStore = require('../../global/protocolStore');
var logFromPC = require('../../model/clsLogger');
const date = require('date-and-time');
const IBin = require('../../../Interfaces/IBin.interface');
const MenuSelectModel = require('../Product/clsMenuSelectModel');
const clsContainer = require('../Container/Container.class');
const serverConfig = require('../../global/severConfig');
const LoginModel = require('../clsLoginModal');
const objloginModel = new LoginModel();
const clsActivityLog = require('../clsActivityLogModel');
const objActivityLog = new clsActivityLog();
const menuSelectModel = new MenuSelectModel();

// const clsLogger = require('../../model/clsLogger');
// const clsProtocolHandler = require('../../controller/protocolHandlerController');
const cubicleSetting = new CubicalSetting();
const productdetail = new ProductDetail();
const database = new Database();
const objProtocolStore = new clsProtocolStore();
var objContainer = new clsContainer();
const clsArea = require('../clsAreaSelection');
var objArea = new clsArea();
var now = new Date();
// const objClsLogger = new clsLogger();
// const objProtocolHandler = new clsProtocolHandler();
class MenuRequestModel {
    //******************************************************************************************** */
    // very first we are getting Product details from tbl_cubical based on Ids
    //******************************************************************************************** */
    async getProductDetail(strIdsIP) {
        try {
            var tempIPQCobj = globalData.arr_IPQCRelIds.find(k => k.idsNo == strIdsIP);
            let selectedIds;
            if (tempIPQCobj != undefined) { // IPQC Cubicles
                selectedIds = tempIPQCobj.selectedIds;
            } else {
                selectedIds = strIdsIP;
            }
            var selectProdDetObj = {
                str_tableName: 'tbl_cubical',
                data: '*',
                condition: [
                    { str_colName: 'Sys_IDSNo', value: selectedIds, comp: 'eq' },
                ]
            }
            var result = await database.select(selectProdDetObj);
            // After selecting product details we need only 4 params
            var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == strIdsIP);
            var IDStype = tempCubicInfo.Sys_PortNo;
            const Product = implement(IProduct)({
                ProductId: result[0][0].Sys_BFGCode,
                ProductName: result[0][0].Sys_ProductName,
                ProductVersion: result[0][0].Sys_PVersion,
                Version: result[0][0].Sys_Version,
            })
            // checking if cubicle type is compression, coating or IPQC
            if (result[0][0].Sys_CubType == 'Compression' && (result[0][0].Sys_Area == 'Compression' || result[0][0].Sys_Area == 'Effervescent Compression' || result[0][0].Sys_Area == 'Strepsils' || result[0][0].Sys_Area == 'Allopathic' || result[0][0].Sys_Area == 'Personal Care')) {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;
            }
            else if (result[0][0].Sys_CubType == 'Coating' && result[0][0].Sys_Area == 'Coating') {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;

            }
            else if (result[0][0].Sys_CubType == 'IPQC' && (result[0][0].Sys_Area == 'Effervescent Granulation' || result[0][0].Sys_Area == 'Granulation' || result[0][0].Sys_Area == 'Pallet Coating')) {
                // This path is for standalone IPQC
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;

            }
            else if (result[0][0].Sys_CubType == 'IPQC' && result[0][0].Sys_Area == 'Capsule Filling') {
                // This path is for standalone IPQC
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;

            }
            else if (result[0][0].Sys_CubType == 'IPQC' && (result[0][0].Sys_Area != 'Effervescent Granulation' || result[0][0].Sys_Area != 'Granulation' || result[0][0].Sys_Area != 'Pallet Coating')) {
                //This path is for IPQC i-e Tablet coating capsule
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;
            }
            else if (result[0][0].Sys_CubType == 'Capsule Filling' && (result[0][0].Sys_Area == 'Capsule Filling' || result[0][0].Sys_Area == 'Pellets-II' || result[0][0].Sys_Area == 'CheckWeigher')) {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;

            } else if (result[0][0].Sys_CubType == 'Multihaler' && result[0][0].Sys_Area == 'Multihaler') {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;

            } else if (result[0][0].Sys_CubType == 'Granulation') {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;

            } else if (result[0][0].Sys_Area == 'Softshell' && serverConfig.ProjectName == 'SunHalolGuj1') {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                let objLot = globalData.arrLot.find(k => k.idsNo == strIdsIP);
                if (objLot == undefined) {
                    globalData.arrLot.push({
                        idsNo: strIdsIP,
                        MS: 'MSDN^',
                        LotNo: "NA"
                    })
                } else {
                    objLot.MS = 'MSDN^',
                        objLot.LotNo = "NA";
                }
                var returnProtocol = await menuSelectModel.processMS(strIdsIP, 'MSDN^');
                return returnProtocol;
            } else if (result[0][0].Sys_Area == 'Dosa Dry Syrup') {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                let objLot = globalData.arrLot.find(k => k.idsNo == strIdsIP);
                if (objLot == undefined) {
                    globalData.arrLot.push({
                        idsNo: strIdsIP,
                        MS: 'MS1N^',
                        LotNo: ""
                    })
                } else {
                    objLot.MS = 'MS1N^',
                        objLot.LotNo = "";
                }
                var strProtocol = await menuSelectModel.processMS(strIdsIP, 'MS1N^');
                return strProtocol;
            } else if (result[0][0].Sys_CubType == 'IPQA') {
                var processResult = await this.processCubical(Product, strIdsIP, result[0][0].Sys_CubType, result[0][0].Sys_Area, IDStype, result);
                return processResult;
            }
            // else if (result[0][0].Sys_CubType == globalData.objNominclature.BinText && result[0][0].Sys_Area == 'Compression') {
            //     var processResult = await this.sendIPCProductList(result[0][0].Sys_CubType, strIdsIP);
            //     return processResult;
            // }

            // check if array hold the object w.r.t to current Ids if not then we push otherwise we can update that
            // object w.r.t Current Ids fot the future use
            var tempCubicType = globalData.arrCubicleType.find(k => k.idsNo == strIdsIP);
            if (tempCubicType == undefined) {
                globalData.arrCubicleType.push({ idsNo: strIdsIP, cubicType: result[0][0].Sys_CubType, cubicArea: result[0][0].Sys_Area });
            } else {
                tempCubicType.cubicType = result[0][0].Sys_CubType;
                tempCubicType.cubicArea = result[0][0].Sys_Area;
            }

        } catch (error) {
            return error;
        }
    }
    //*************************************************************************************************** */
    // below function is same for if product is from coating or compression based on flag set in db
    //*************************************************************************************************** */
    async processCubical(Product, strIdsIP, CubicType, CubicArea, IDStype, CubicleInfo) {
        try {
            // console.log(CubicleInfo[0][0].Sys_CubicNo)
            var cno = CubicleInfo[0][0].Sys_CubicNo;
            var str_qry = "";
            var rotaryType = CubicleInfo[0][0].Sys_RotaryType;
            var batch = CubicleInfo[0][0].Sys_Batch;
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == strIdsIP);
            var side;
            if (rotaryType == 'Single' || rotaryType == 'NA') {
                side = 'N';
            } else if (rotaryType == 'Double') {
                side = 'L';
            }
            //checking if for the product type
            var selectProdTypeObj = {
                str_tableName: 'tbl_product_master',
                data: '*',
                condition: [
                    { str_colName: 'ProductName', value: Product.ProductName },
                    { str_colName: 'ProductId', value: Product.ProductId },
                    { str_colName: 'ProductVersion', value: Product.ProductVersion },
                    { str_colName: 'Version', value: Product.Version }
                ]
            }
            var result = await database.select(selectProdTypeObj);
            var productType = result[0][0].ProductType;
            var productMasterData = result[0][0];
            //# pushing prodType to global array for further use along with IDS
            var tempObjProdType = globalData.arrProductTypeArray.find(k => k.idsNo == strIdsIP);
            if (tempObjProdType == undefined) {
                // if(currentCubicle.Sys_CubType == "IPQC")
                // {
                //     globalData.arrProductTypeArray.push({ idsNo: CubicleInfo[0][0].Sys_IDSNo, productType: productType });
                // }
                // else
                // {
                    globalData.arrProductTypeArray.push({ idsNo: strIdsIP, productType: productType });
                // }
            } else {
                tempObjProdType.productType = productType;
            }
            //  need to pop object on logOut
            /* # type 1->tablet # type 2->capsule
            # here product type is in product master
            */
            var result, cnt = 0;
            if (productType == 1) { // for tablet so get data from product_master and product_tablet 
                var tempTableName;
                /*modified by vivek on 15-11-2019*****************************************/
                // CubicArea == IPQC for Cipla7
                // if ((CubicArea == 'Compression' || CubicArea == 'Effervescent Compression' || CubicArea == 'Strepsils' || CubicArea == 'Allopathic' || CubicArea == 'Personal Care'
                //     || CubicArea.includes('IPQA') || CubicArea == 'IPQC' || CubicArea == 'Pharma Office' || CubicArea == 'Pellets-I') && IsCompress == 1) 
                if ((CubicArea == 'Compression' || CubicArea == 'Effervescent Compression' || CubicArea == 'Strepsils' || CubicArea == 'Allopathic' || CubicArea == 'Personal Care'
                    || CubicArea == 'IPQC' || CubicArea == 'Pharma Office')) {
                    /*if producType is 1 and Cubicle type is compression the we have to check from product tablet master */
                    tempTableName = 'tbl_product_tablet'

                }
                else if ((CubicArea == 'Coating' ||
                    CubicArea == 'Pallet Coating' ||
                    CubicArea == 'Pharma Office')) {
                    /* if producType is 1 and Cubicle type is Coating the we have to check from product tablet coating master */
                    if (CubicArea == 'Coating') {
                        switch (currentCubicle.Sys_IPQCType) {
                            case "Compression":
                                tempTableName = 'tbl_product_tablet'
                                break;
                            case "Coating":
                                tempTableName = 'tbl_product_tablet_coated'
                                break;
                            case "NA":
                                tempTableName = 'tbl_product_tablet_coated'
                                break;
                        }
                    }
                    else {
                        tempTableName = 'tbl_product_tablet_coated'
                    }
                }
                /* if producType is 1 and Cubicle type is Granulation the we have to check from product tablet coating master */
                else if ((CubicArea == 'Effervescent Granulation' || CubicArea == 'Granulation' || CubicArea == 'MFG-1 Processing Area'
                    || CubicArea == 'MFG-1 Blending Area' || CubicArea == 'MFG-3 IPQC' || CubicArea == 'MFG-2 Processing Area' || CubicArea == 'MFG-2 Blending Area'
                    || CubicArea == 'MFG-8 Processing Area' || CubicArea == 'MFG-8 IPQC' || CubicArea == 'MFG-5 Capsule' || CubicArea == 'MFG-6 Capsule' || CubicArea == 'Pellet IPQC')
                ) {
                    tempTableName = 'tbl_product_gran'
                }
                else if (CubicArea == "IPQA") // ML Hosur
                {
                    switch (currentCubicle.Sys_IPQCType) {
                        case "Compression":
                            tempTableName = 'tbl_product_tablet'
                            break;
                        case "Coating":
                            tempTableName = 'tbl_product_tablet_coated'
                            break;
                    }
                }
                else if (CubicArea == 'Pellets-I') {

                    if (currentCubicle.Sys_CubType == "IPQC") {
                        switch (currentCubicle.Sys_IPQCType) {
                            case "Compression":
                                tempTableName = 'tbl_product_tablet'
                                break;
                            case "Coating":
                                tempTableName = 'tbl_product_tablet_coated'
                                break;
                        }
                    }
                    else if (currentCubicle.Sys_CubType == "Compression") {
                        tempTableName = 'tbl_product_tablet'
                    }
                    else if (currentCubicle.Sys_CubType == "Coating") {
                        tempTableName = 'tbl_product_tablet_coated'
                    }
                }


                var selectObj = {
                    str_tableName: tempTableName,
                    data: '*',
                    condition: [
                        { str_colName: 'ProductName', value: Product.ProductName },
                        { str_colName: 'ProductId', value: Product.ProductId },
                        { str_colName: 'ProductVersion', value: Product.ProductVersion },
                        { str_colName: 'Version', value: Product.Version }
                    ]
                }
            }

            if (productType == 2 && (CubicArea == 'Capsule Filling' || CubicArea.includes('IPQA') || CubicArea == 'Pellets-I' || CubicArea == 'CheckWeigher' || (CubicArea == 'Pellets-II' && (CubicType == 'Capsule Filling' || CubicType == 'IPQC') && currentCubicle.Sys_MoistID == 'None'))) { // for tablet so get data from product_master and product_capsule
                /* if producType is 2 and Cubicle type is compression the we have to check from product capsule master */

                if (serverConfig.ProjectName == "CIPLA_INDORE") // if area is capsule filling and type is ipqc then display balance and MA, TD
                {
                    if (CubicType == "IPQC") {
                        cnt = 1;
                        var str_qry1 = `SELECT * FROM tbl_product_capsule`
                            + ` where ProductName='${Product.ProductName}' and ProductId='${Product.ProductId}' and ProductVersion='${Product.ProductVersion}' and Version='${Product.Version}'`;

                        var result1 = await database.execute(str_qry1);

                        var str_qry2 = `SELECT * FROM tbl_product_gran_cap`
                            + ` where ProductName='${Product.ProductName}' and ProductId='${Product.ProductId}' and ProductVersion='${Product.ProductVersion}' and Version='${Product.Version}'`;

                        var result2 = await database.execute(str_qry2);


                        if (result1[0].length > 0 && result2[0].length > 0) {
                            result = result1[0].concat(result2[0]);
                            console.log(result);
                        } else if (result2[0].length > 0) {
                            result = result2;
                        }
                        else {
                            result = result1;
                        }
                    }
                    else {
                        var selectObj = {
                            str_tableName: 'tbl_product_capsule',
                            data: '*',
                            condition: [
                                { str_colName: 'ProductName', value: Product.ProductName },
                                { str_colName: 'ProductId', value: Product.ProductId },
                                { str_colName: 'ProductVersion', value: Product.ProductVersion },
                                { str_colName: 'Version', value: Product.Version }
                            ]
                        }
                    }
                }
                else {
                    var selectObj = {
                        str_tableName: 'tbl_product_capsule',
                        data: '*',
                        condition: [
                            { str_colName: 'ProductName', value: Product.ProductName },
                            { str_colName: 'ProductId', value: Product.ProductId },
                            { str_colName: 'ProductVersion', value: Product.ProductVersion },
                            { str_colName: 'Version', value: Product.Version }
                        ]
                    }
                }

            }
            if (productType == 2 && (CubicArea == 'Pallet Coating' || CubicArea == 'Granulation' ||
                CubicArea == 'Effervescent Granulation' ||

                CubicArea == 'MFG-1 Processing Area'
                || CubicArea == 'MFG-1 Blending Area'
                || CubicArea == 'MFG-3 IPQC'
                || CubicArea == 'MFG-2 Processing Area'
                || CubicArea == 'MFG-2 Blending Area'
                || CubicArea == 'MFG-8 Processing Area'
                || CubicArea == 'MFG-8 IPQC'
                || CubicArea == 'MFG-5 Capsule'
                || CubicArea == 'MFG-6 Capsule' || CubicArea == 'Pellet IPQC' ||
                (CubicArea == 'Pellets-II' && (CubicType == 'IPQC' || CubicType == 'Capsule Filling') && currentCubicle.Sys_MoistID != 'None'))) {

                var selectObj = {
                    str_tableName: 'tbl_product_gran_cap',
                    data: '*',
                    condition: [
                        { str_colName: 'ProductName', value: Product.ProductName },
                        { str_colName: 'ProductId', value: Product.ProductId },
                        { str_colName: 'ProductVersion', value: Product.ProductVersion },
                        { str_colName: 'Version', value: Product.Version }
                    ]
                }
            }
            if (productType == 3 && CubicArea == 'Multihaler') {
                /* if producType is 1 and Cubicle type is Granulation the we have to check from product tablet coating master*/
                var selectObj = {
                    str_tableName: 'tbl_product_multihaler',
                    data: '*',
                    condition: [
                        { str_colName: 'ProductName', value: Product.ProductName },
                        { str_colName: 'ProductId', value: Product.ProductId },
                        { str_colName: 'ProductVersion', value: Product.ProductVersion },
                        { str_colName: 'Version', value: Product.Version }
                    ]
                }
            }
            if (productType == 4 && CubicArea == 'Softshell') {
                // for softshell we take batch as well in combination as there would be same product
                // with different batch also
                var selectObj = {
                    str_tableName: 'tbl_product_softshell',
                    data: '*',
                    condition: [
                        { str_colName: 'ProductName', value: Product.ProductName },
                        { str_colName: 'ProductId', value: Product.ProductId },
                        { str_colName: 'ProductVersion', value: Product.ProductVersion },
                        { str_colName: 'Version', value: Product.Version },
                        { str_colName: 'BatchNo', value: batch }
                    ]
                }
            }
            if (productType == 5 && CubicArea == 'Dosa Dry Syrup') {
                var selectObj = {
                    str_tableName: 'tbl_product_dosadry',
                    data: '*',
                    condition: [
                        { str_colName: 'ProductName', value: Product.ProductName },
                        { str_colName: 'ProductId', value: Product.ProductId },
                        { str_colName: 'ProductVersion', value: Product.ProductVersion },
                        { str_colName: 'Version', value: Product.Version }
                    ]
                }
            }


            if (serverConfig.ProjectName == "CIPLA_INDORE") {
                if (cnt == 0) {
                    result = await database.select(selectObj);
                }
                else {
                    //result = await database.select(selectObj);
                    result = result;

                }
            }
            else {
                result = await database.select(selectObj);
            }


            // for fetching Capsule Parameter in pallet coating because for pallet coating there are two tables
            if (productType == 2 && (CubicArea == 'Pallet Coating')) {
                var selectObj1 = {
                    str_tableName: 'tbl_product_capsule',
                    data: '*',
                    condition: [
                        { str_colName: 'ProductName', value: Product.ProductName },
                        { str_colName: 'ProductId', value: Product.ProductId },
                        { str_colName: 'ProductVersion', value: Product.ProductVersion },
                        { str_colName: 'Version', value: Product.Version }
                    ]
                }
                var resultCapule = await database.select(selectObj1);
                result[0].push(resultCapule[0][0]);
            }
            // const index = globalData.arr_limits.findIndex(k => k.idsNo === strIdsIP);
            // here we have to place records ind respected arrays like nominal, upper and lower
            // here we check if if arr_limits has entry for respected IDS then we first remove and then
            // insert it
            var tempArrObj = globalData.arr_limits.find(k => k.idsNo == strIdsIP);
            if (tempArrObj == undefined) {
                globalData.arr_limits.push({ idsNo: strIdsIP });
            } else {
                globalData.arr_limits = globalData.arr_limits
                    .filter(k => k.idsNo != strIdsIP)
                globalData.arr_limits.push({ idsNo: strIdsIP });
            }
            var slectProductSamples = {
                str_tableName: 'tbl_cubicle_product_sample',
                data: '*',
                condition: [
                    { str_colName: 'Sys_CubicNo', value: cno, comp: 'eq' }
                ]
            }
            var productSamples = await database.select(slectProductSamples);
            // here in `CubicleInfo` we have cubicle info for selected cubic, but we have to
            // check instrument of current IDS so,
            var currentCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == strIdsIP);
            // check for which type of Ids type like // 101,102,103,104
            if (IDStype == 103 || IDStype == 104) {
                if (CubicArea == "Effervescent Granulation" || CubicArea == "Pallet Coating" || CubicArea == 'Granulation' || CubicArea == 'Capsule Filling'
                    || CubicArea == 'MFG-1 Processing Area' || CubicArea == 'MFG-1 Blending Area' || CubicArea == 'MFG-3 IPQC' || CubicArea == 'MFG-2 Processing Area' || CubicArea == 'MFG-2 Blending Area'
                    || CubicArea == 'MFG-8 Processing Area' || CubicArea == 'MFG-8 IPQC' || CubicArea == 'MFG-5 Capsule' || CubicArea == 'MFG-6 Capsule' || CubicArea == 'Pellet IPQC') {
                    var port1Intrument = currentCubic.Sys_Port1;
                    var port2Intrument = currentCubic.Sys_Port2;
                    var port3Instrument = currentCubic.Sys_Port3;
                    var port4Instrument = currentCubic.Sys_Port4;
                    //if (serverConfig.ProjectName == "CIPLA_INDORE") {
                    if (CubicType == "IPQC" && CubicArea == "Capsule Filling" && result.length == 2) {
                        for (const i of result) {
                            await this.portInstrumentCheck(port1Intrument, [[i]], strIdsIP, productType, IDStype, '1', productSamples, side);
                            await this.portInstrumentCheck(port2Intrument, [[i]], strIdsIP, productType, IDStype, '2', productSamples, side);
                            await this.portInstrumentCheck(port3Instrument, [[i]], strIdsIP, productType, IDStype, '3', productSamples, side);
                            await this.portInstrumentCheck(port4Instrument, [[i]], strIdsIP, productType, IDStype, '4', productSamples, side);

                        }
                    }
                    else {
                        await this.portInstrumentCheck(port1Intrument, result, strIdsIP, productType, IDStype, '1', productSamples, side);
                        await this.portInstrumentCheck(port2Intrument, result, strIdsIP, productType, IDStype, '2', productSamples, side);
                        await this.portInstrumentCheck(port3Instrument, result, strIdsIP, productType, IDStype, '3', productSamples, side);
                        await this.portInstrumentCheck(port4Instrument, result, strIdsIP, productType, IDStype, '4', productSamples, side);
                    }
                    //}
                    // else {
                    //     await this.portInstrumentCheck(port1Intrument, result, strIdsIP, productType, IDStype, '1', productSamples, side);
                    //     await this.portInstrumentCheck(port2Intrument, result, strIdsIP, productType, IDStype, '2', productSamples, side);
                    //     await this.portInstrumentCheck(port3Instrument, result, strIdsIP, productType, IDStype, '3', productSamples, side);
                    //     await this.portInstrumentCheck(port4Instrument, result, strIdsIP, productType, IDStype, '4', productSamples, side);
                    // }
                    let returnProtocol = await this.PrintMenu(strIdsIP)
                    return returnProtocol;
                }
                else {
                    // here we dont check for port 1 and port 2 which always for stream type instrument like
                    // Balance and Vernier
                    /*## so we will check for port 3 and port 4 which instrument is connected to them
                    */
                    var port3Instrument = currentCubic.Sys_Port3;
                    var port4Instrument = currentCubic.Sys_Port4;
                    // here BV parameter is (Balance & vernier) if we have GLCD we only check for port3 and port4 so
                    // there is chance that balance as well as vernier is connected so we passed 'BV'
                    // 1N2 is port 1AND2
                    await this.streamDataMenuMaking(result, strIdsIP, productType, 'BV', '1N2', productSamples, side);
                    await this.portInstrumentCheck(port3Instrument, result, strIdsIP, productType, IDStype, '3', productSamples, side);
                    await this.portInstrumentCheck(port4Instrument, result, strIdsIP, productType, IDStype, '4', productSamples, side);
                    let returnProtocol = await this.PrintMenu(strIdsIP);
                    return returnProtocol;
                }
                // console.log('CubicleInfo',CubicleInfo[0][0])
            } else if (IDStype == 101 || IDStype == 102) { //TWO PORT IDS
                /**
                 * here we have IDSof two ports
                 */
                var port1Instriment = currentCubic.Sys_Port1;
                var port2Instriment = currentCubic.Sys_Port2;

                if (CubicType == "IPQC" && CubicArea == "Capsule Filling" && result.length == 2) {
                    for (const i of result) {
                        await this.portInstrumentCheck(port1Instriment, [[i]], strIdsIP, productType, IDStype, '1', productSamples, side);
                        await this.portInstrumentCheck(port2Instriment, [[i]], strIdsIP, productType, IDStype, '2', productSamples, side);
                    }
                }
                else {
                    await this.portInstrumentCheck(port1Instriment, result, strIdsIP, productType, IDStype, '1', productSamples, side);
                    await this.portInstrumentCheck(port2Instriment, result, strIdsIP, productType, IDStype, '2', productSamples, side);
                }
                // console.log(port1Instriment, port2Instriment);
                
                let returnProtocol = await this.PrintMenu(strIdsIP);
                return returnProtocol;
            }
        } catch (err) {
            console.log(err);
            return err;
        }
    }

    async portInstrumentCheck(portInstrument, result, strIdsIP, productType, IDStype, portNo, productSamples, side) {
        try {
            if (IDStype == 103 || IDStype == 104) {
                var tempIPQCobj = globalData.arr_IPQCRelIds.find(k => k.idsNo == strIdsIP);
                let selectedIds;
                if (tempIPQCobj != undefined) { // IPQC Cubicles
                    selectedIds = tempIPQCobj.selectedIds;
                } else {
                    selectedIds = strIdsIP;
                }
                let CubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds)
                switch (portInstrument.toUpperCase()) {
                    case 'DISINTEGRATION TESTER':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'DT', portNo, productSamples, side)
                        break;
                    case 'VERNIER':
                        await this.streamDataMenuMaking(result, strIdsIP, productType, 'Vernier', portNo, productSamples, side)
                        break;
                    case 'TABLET TESTER':
                    case 'HARDNESS':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'Hardness', portNo, productSamples, side)
                        break;
                    case 'FRIABILATOR':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'Friability', portNo, productSamples, side)
                        break;
                    case 'TAPPED DENSITY':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'TDT', portNo, productSamples, side)
                        break;
                    case 'MOISTURE ANALYZER':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'LOD', portNo, productSamples, side)
                        break;
                    case 'BALANCE':
                        if (CubicInfo.Sys_Area == 'Effervescent Granulation' ||
                            CubicInfo.Sys_Area == 'Granulation' || CubicInfo.Sys_Area == 'Pallet Coating'
                            || CubicInfo.Sys_Area == 'MFG-1 Processing Area' || CubicInfo.Sys_Area == 'MFG-1 Blending Area' || CubicInfo.Sys_Area == 'MFG-3 IPQC'
                            || CubicInfo.Sys_Area == 'MFG-2 Processing Area' || CubicInfo.Sys_Area == 'MFG-2 Blending Area' || CubicInfo.Sys_Area == 'MFG-8 Processing Area' || CubicInfo.Sys_Area == 'MFG-8 IPQC'
                            | CubicInfo.Sys_Area == 'MFG-5 Capsule' || CubicInfo.Sys_Area == 'MFG-6 Capsule' || CubicInfo.Sys_Area == 'Pellet IPQC') {
                            this.bulkDataMenuMaking(result, strIdsIP, productType, 'Balance', portNo, productSamples, side)
                        } else {
                            await this.streamDataMenuMaking(result, strIdsIP, productType, 'Balance', portNo, productSamples, side)
                        }
                        break;
                    case 'MOISTURE ANALYZER':
                        break;

                }
                return 'Done';
            } else {
                var tempIPQCobj = globalData.arr_IPQCRelIds.find(k => k.idsNo == strIdsIP);
                let selectedIds;
                if (tempIPQCobj != undefined) { // IPQC Cubicles
                    selectedIds = tempIPQCobj.selectedIds;
                } else {
                    selectedIds = strIdsIP;
                }
                let CubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds)
                switch (portInstrument.toUpperCase()) {
                    case 'BALANCE':
                        if (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation' || CubicInfo.Sys_Area == 'Pallet Coating'
                            || CubicInfo.Sys_Area == 'MFG-1 Processing Area' || CubicInfo.Sys_Area == 'MFG-1 Blending Area' || CubicInfo.Sys_Area == 'MFG-3 IPQC'
                            || CubicInfo.Sys_Area == 'MFG-2 Processing Area' || CubicInfo.Sys_Area == 'MFG-2 Blending Area' || CubicInfo.Sys_Area == 'MFG-8 Processing Area' || CubicInfo.Sys_Area == 'MFG-8 IPQC'
                            | CubicInfo.Sys_Area == 'MFG-5 Capsule' || CubicInfo.Sys_Area == 'MFG-6 Capsule' || CubicInfo.Sys_Area == 'Pellet IPQC') {
                            this.bulkDataMenuMaking(result, strIdsIP, productType, 'Balance', portNo, productSamples, side)
                        } else {
                            await this.streamDataMenuMaking(result, strIdsIP, productType, 'Balance', portNo, productSamples, side)
                        }
                        break;
                    case 'VERNIER':
                        await this.streamDataMenuMaking(result, strIdsIP, productType, 'Vernier', portNo, productSamples, side)
                        break;
                    case 'DISINTEGRATION TESTER':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'DT', portNo, productSamples, side)
                        break;
                    case 'HARDNESS':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'Hardness', portNo, productSamples, side)
                        break;
                    case 'FRIABILATOR':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'Friability', portNo, productSamples, side)
                        break;
                    case 'TAPPED DENSITY':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'TDT', portNo, productSamples, side)
                        break;
                    case 'MOISTURE ANALYZER':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'LOD', portNo, productSamples, side)
                        break;
                    case 'SIEVE SHAKER':
                        this.bulkDataMenuMaking(result, strIdsIP, productType, 'SS', portNo, productSamples, side)
                        break;
                }
                return 'Done';
            }
        } catch (error) {
            return error;
        }
    }
    //************************************************************************************************* */
    //
    //************************************************************************************************* */
    bulkDataMenuMaking(result, strIdsIP, productType, instrument, portNo, productSamples, side) {
        productSamples = productSamples[0][0]
        // console.log(strIdsIP, productType, instrument)
        // finding index of object holding current idsNo
        const index = globalData.arr_limits.findIndex(k => k.idsNo == strIdsIP);
        const CubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(strIdsIP));
        for (var key in result[0][0]) {

            if (result[0][0].hasOwnProperty(key)) {
                if (key == 'Param6_T1Neg') {
                    if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                        if (productType == 2 && CubicInfo.Sys_DTID != 'None' && instrument == 'DT'
                            // && (CubicInfo.Sys_CubType != 'Effervescent Granulation' || CubicInfo.Sys_CubType != 'Granulation')
                        ) {

                            Object.assign(globalData.arr_limits[index], {
                                DT: {
                                    nominal: result[0][0].Param6_Nom,
                                    T1Neg: result[0][0].Param6_T1Neg,
                                    T1Pos: result[0][0].Param6_T1Pos,
                                    LimitOn: result[0][0].Param6_LimitOn,
                                    dp: result[0][0].Param6_DP,
                                    isonstd: result[0][0].Param6_IsOnStd,
                                    port: portNo,
                                    noOfSamples: productSamples.Individual,
                                    side: side,
                                    unit: ""
                                }
                            });
                        }
                    }
                } else if (key == 'Param7_T1Pos' || key == 'Param7_T1Neg') { // for Hardness // for hardness we are checking for upper not nominal
                    if (parseFloat(result[0][0][key]) >= 0 && parseFloat(result[0][0][key]) != 99999) {
                        // check for product type and check hardness is set 
                        if (productType == 1 && CubicInfo.Sys_HardID != 'None' && instrument == 'Hardness'
                            // && (CubicInfo.Sys_CubType != 'Effervescent Granulation' || CubicInfo.Sys_CubType != 'Granulation')
                        ) {
                        var temp_arr_limits = globalData.arr_limits.find(k => k.idsNo == strIdsIP);
                        if(!temp_arr_limits.Hardness){
                           
                            Object.assign(globalData.arr_limits[index], {
                                Hardness: {
                                    nominal: result[0][0].Param7_Nom,
                                    T1Neg: result[0][0].Param7_T1Neg,
                                    T1Pos: result[0][0].Param7_T1Pos,
                                    LimitOn: result[0][0].Param7_LimitOn,
                                    dp: result[0][0].Param7_Dp,
                                    isonstd: result[0][0].Param7_IsOnStd,
                                    port: portNo,
                                    noOfSamples: productSamples.Individual,
                                    side: side,
                                    unit: result[0][0].Param7_Unit
                                }

                            });
                        }    
                            if (globalData.arr_limits[index].Hardness.dp == undefined) {
                                globalData.arr_limits[index].Hardness.dp = result[0][0].Param7_Dp;
                            }
                            // Here we use Multiparameter Hardness so we check if already Lenght or bredth or diameter
                            var tempArrLimit = globalData.arr_limits.find(k => k.idsNo == strIdsIP)
                            if (tempArrLimit != undefined) {
                                if (tempArrLimit['Breadth'] == undefined &&
                                    (parseFloat(result[0][0]['Param4_Nom']) > 0 && parseFloat(result[0][0]['Param4_Nom']) != 99999)) {
                                    Object.assign(globalData.arr_limits[index], {
                                        Breadth: {
                                            nominal: result[0][0].Param4_Nom,
                                            T1Neg: result[0][0].Param4_T1Neg,
                                            T1Pos: result[0][0].Param4_T1Pos,
                                            T2Neg: result[0][0].Param4_T2Neg,
                                            T2Pos: result[0][0].Param4_T2Pos,
                                            LimitOn: result[0][0].Param4_LimitOn,
                                            dp: result[0][0].Param4_DP,
                                            isonstd: result[0][0].Param4_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: serverConfig.Vernier
                                        }
                                    });
                                }
                                if (tempArrLimit['Diameter'] == undefined &&
                                    (parseFloat(result[0][0]['Param6_Nom']) > 0 && parseFloat(result[0][0]['Param6_Nom']) != 99999)) {
                                    Object.assign(globalData.arr_limits[index], {
                                        Diameter: {
                                            nominal: result[0][0].Param6_Nom,
                                            T1Neg: result[0][0].Param6_T1Neg,
                                            T1Pos: result[0][0].Param6_T1Pos,
                                            T2Neg: result[0][0].Param6_T2Neg,
                                            T2Pos: result[0][0].Param6_T2Pos,
                                            LimitOn: result[0][0].Param6_LimitOn,
                                            dp: result[0][0].Param6_DP,
                                            isonstd: result[0][0].Param6_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: serverConfig.Vernier
                                        }
                                    });
                                }
                                if (tempArrLimit['Length'] == undefined &&
                                    (parseFloat(result[0][0]['Param5_Nom']) > 0 && parseFloat(result[0][0]['Param5_Nom']) != 99999)) {
                                    Object.assign(globalData.arr_limits[index], {
                                        Length: {
                                            nominal: result[0][0].Param5_Nom,
                                            T1Neg: result[0][0].Param5_T1Neg,
                                            T1Pos: result[0][0].Param5_T1Pos,
                                            T2Neg: result[0][0].Param5_T2Neg,
                                            T2Pos: result[0][0].Param5_T2Pos,
                                            LimitOn: result[0][0].Param5_LimitOn,
                                            dp: result[0][0].Param5_DP,
                                            isonstd: result[0][0].Param5_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: serverConfig.Vernier
                                        }
                                    });
                                }

                                if (tempArrLimit['Thickness'] == undefined &&
                                    (parseFloat(result[0][0]['Param3_Nom']) > 0 && parseFloat(result[0][0]['Param3_Nom']) != 99999)) {
                                    Object.assign(globalData.arr_limits[index], {
                                        Thickness: {
                                            nominal: result[0][0].Param3_Nom,
                                            T1Neg: result[0][0].Param3_T1Neg,
                                            T1Pos: result[0][0].Param3_T1Pos,
                                            T2Neg: result[0][0].Param3_T2Neg,
                                            T2Pos: result[0][0].Param3_T2Pos,
                                            LimitOn: result[0][0].Param3_LimitOn,
                                            dp: result[0][0].Param3_DP,
                                            isonstd: result[0][0].Param3_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: serverConfig.Vernier
                                        }
                                    });
                                }
                            }

                        }
                    }
                }else
                    if (key == 'Param8_Nom') { // for Friability
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check friability is set 
                            if (productType == 1 && CubicInfo.Sys_FriabID != 'None' && instrument == 'Friability'
                                && CubicInfo.Sys_CubType != 'Granulation') {
                                Object.assign(globalData.arr_limits[index], {
                                    Friability: {
                                        nominal: result[0][0].Param8_Nom,
                                        T1Neg: result[0][0].Param8_T1Neg,
                                        T1Pos: result[0][0].Param8_T1Pos,
                                        LimitOn: result[0][0].Param8_LimitOn,
                                        dp: result[0][0].Param8_DP,
                                        isonstd: result[0][0].Param8_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Friability == 0 ? productSamples.Individual : productSamples.Friability,
                                        side: side,
                                        unit: '%'
                                    }
                                });
                            }
                        }
                    }
                    else
                        if (key == 'Param13_T1Neg') { // for DT
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check DT is set 
                                if (productType == 1 && CubicInfo.Sys_DTID != 'None' && instrument == 'DT'
                                    // && (CubicInfo.Sys_CubType != 'Effervescent Granulation' || CubicInfo.Sys_CubType != 'Granulation')
                                ) {
                                    Object.assign(globalData.arr_limits[index], {
                                        DT: {
                                            nominal: result[0][0].Param13_Nom,
                                            T1Neg: result[0][0].Param13_T1Neg,
                                            T1Pos: result[0][0].Param13_T1Pos,
                                            LimitOn: result[0][0].Param13_LimitOn,
                                            dp: result[0][0].Param13_DP,
                                            isonstd: result[0][0].Param13_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.DT == 0 ? productSamples.Individual : productSamples.DT,
                                            side: side,
                                            unit: ''
                                        }
                                    });
                                }
                            }
                        } else if (key == 'Param15_T1Neg') { // for TDT
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check TDT is set 
                                if (productType == 1 && CubicInfo.Sys_TapDensityID != 'None' && instrument == 'TDT'
                                    // && (CubicInfo.Sys_CubType != 'Effervescent Granulation' || CubicInfo.Sys_CubType != 'Granulation'|| CubicInfo.Sys_Area == 'Pallet Coating')
                                ) {
                                    Object.assign(globalData.arr_limits[index], {
                                        TDT: {
                                            nominal: result[0][0].Param15_Nom,
                                            T1Neg: result[0][0].Param15_T1Neg,
                                            T1Pos: result[0][0].Param15_T1Pos,
                                            LimitOn: result[0][0].Param15_LimitOn,
                                            dp: result[0][0].Param15_DP,
                                            isonstd: result[0][0].Param15_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: ''
                                        }
                                    });
                                }
                            }
                        } else if (key == 'Param16_T1Pos') { // for LOD
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check LOD is set 
                                if (productType == 1 && CubicInfo.Sys_MoistID != 'None' &&
                                    instrument == 'LOD'
                                    //  && (CubicInfo.Sys_Area == 'Compression'
                                    //     || CubicInfo.Sys_Area == 'Coating' || CubicInfo.Sys_Area == 'Pallet Coating')
                                ) {
                                    Object.assign(globalData.arr_limits[index], {
                                        LOD: {
                                            nominal: result[0][0].Param16_Nom,
                                            T1Neg: result[0][0].Param16_T1Neg,
                                            T1Pos: result[0][0].Param16_T1Pos,
                                            LimitOn: result[0][0].Param16_LimitOn,
                                            dp: result[0][0].Param16_DP,
                                            isonstd: result[0][0].Param16_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: ''
                                        }
                                    });
                                }
                            }
                        } else if (key == 'Param8_Upp') { // for % fine and from tab_gran
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check LOD is set 
                                if ((productType == 1 || productType == 2) && CubicInfo.Sys_BalID != 'None' && instrument == 'Balance'
                                    // && (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation')
                                ) {
                                    Object.assign(globalData.arr_limits[index], {
                                        PerFine: {
                                            nominal: result[0][0].Param8_Nom,
                                            T1Neg: result[0][0].Param8_Low,
                                            T1Pos: result[0][0].Param8_Upp,
                                            LimitOn: 1,
                                            dp: result[0][0].Param8_Dp,
                                            isonstd: 1,
                                            port: portNo,
                                            side: side,
                                            noOfSamples: 2,
                                            unit: ''
                                        }
                                    });
                                }
                            }
                        }
                        else if (key == 'Param9_Upp') { // forParticke sizing and from tab_gran
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check LOD is set 
                                if ((productType == 1 || productType == 2) && CubicInfo.Sys_BalID != 'None' && instrument == 'Balance'
                                    //  && (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation')
                                ) {
                                    Object.assign(globalData.arr_limits[index], {
                                        PartSize: {
                                            nominal: result[0][0].Param9_Nom,
                                            T1Neg: result[0][0].Param9_Low,
                                            T1Pos: result[0][0].Param9_Upp,
                                            LimitOn: 1,
                                            dp: result[0][0].Param9_Dp,
                                            isonstd: 1,
                                            port: portNo,
                                            noOfSamples: 7,
                                            side: side,
                                            unit: ''
                                        }
                                    });
                                }
                            }
                        }
                        else if (key == 'Param7_Upp') { // for tab density and from tab_gran
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check TDT is set 
                                if ((productType == 1 || productType == 2) && CubicInfo.Sys_TapDensityID != 'None' && instrument == 'TDT'
                                    // && (CubicInfo.Sys_Area == 'Effervescent Granulation'|| CubicInfo.Sys_Area == 'Granulation')
                                ) {
                                    Object.assign(globalData.arr_limits[index], {
                                        TDT: {
                                            nominal: result[0][0].Param7_Nom,
                                            T1Neg: result[0][0].Param7_Low,
                                            T1Pos: result[0][0].Param7_Upp,
                                            LimitOn: 1,
                                            dp: result[0][0].Param7_Dp,
                                            isonstd: 1,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            unit: ''
                                        }
                                    });
                                }
                            }
                        } else if (key == 'Param1_Upp' || key == 'Param2_Upp' || key == 'Param3_Upp' ||
                            key == 'Param4_Upp' || key == 'Param5_Upp' || key == 'Param6_Upp') { // for LOD and from tab_gran
                            if (globalData.arr_limits.find(k => k.LOD == undefined)) {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        // && (CubicInfo.Sys_Area == 'Effervescent Granulation'|| CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            LOD: {
                                                nominal: result[0][0].Param1_Nom,
                                                T1Neg: result[0][0].Param1_Low,
                                                T1Pos: result[0][0].Param1_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param1_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            }
                            if (key == 'Param1_Upp') {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        // && (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            GRNDRY: {
                                                nominal: result[0][0].Param1_Nom,
                                                T1Neg: result[0][0].Param1_Low,
                                                T1Pos: result[0][0].Param1_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param1_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            } else if (key == 'Param2_Upp') {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        // && (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            GRNLUB: {
                                                nominal: result[0][0].Param2_Nom,
                                                T1Neg: result[0][0].Param2_Low,
                                                T1Pos: result[0][0].Param2_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param2_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            } else if (key == 'Param3_Upp') {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        //&& (CubicInfo.Sys_Area == 'Effervescent Granulation'|| CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            LAY1DRY: {
                                                nominal: result[0][0].Param3_Nom,
                                                T1Neg: result[0][0].Param3_Low,
                                                T1Pos: result[0][0].Param3_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param3_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            } else if (key == 'Param4_Upp') {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        // && (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            LAY1LUB: {
                                                nominal: result[0][0].Param4_Nom,
                                                T1Neg: result[0][0].Param4_Low,
                                                T1Pos: result[0][0].Param4_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param4_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            } else if (key == 'Param5_Upp') {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        // && (CubicInfo.Sys_Area == 'Effervescent Granulation'|| CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            LAY2DRY: {
                                                nominal: result[0][0].Param5_Nom,
                                                T1Neg: result[0][0].Param5_Low,
                                                T1Pos: result[0][0].Param5_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param5_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            } else if (key == 'Param6_Upp') {
                                if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                    // check for product type and check LOD is set 
                                    if ((productType == 1 || productType == 2) && CubicInfo.Sys_MoistID != 'None' && instrument == 'LOD'
                                        // && (CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Granulation')
                                    ) {
                                        Object.assign(globalData.arr_limits[index], {
                                            LAY2LUB: {
                                                nominal: result[0][0].Param6_Nom,
                                                T1Neg: result[0][0].Param6_Low,
                                                T1Pos: result[0][0].Param6_Upp,
                                                LimitOn: 1,
                                                dp: result[0][0].Param6_Dp,
                                                isonstd: 1,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                unit: ''
                                            }
                                        });
                                    }
                                }
                            }
                        }
            }

        }
        if (result[0].length == 2) {// this will check if granulation CAPSULE product have DT parameter or not
            for (var key in result[0][1]) {
                if (result[0][1].hasOwnProperty(key)) {
                    if (key == 'Param6_T1Neg') {
                        if (parseFloat(result[0][1][key]) > 0 && parseFloat(result[0][1][key]) != 99999) {
                            if (productType == 2 && CubicInfo.Sys_DTID != 'None' && instrument == 'DT'
                                // && (CubicInfo.Sys_CubType != 'Effervescent Granulation' || CubicInfo.Sys_CubType != 'Granulation')
                            ) {

                                Object.assign(globalData.arr_limits[index], {
                                    DT: {
                                        nominal: result[0][1].Param6_Nom,
                                        T1Neg: result[0][1].Param6_T1Neg,
                                        T1Pos: result[0][1].Param6_T1Pos,
                                        LimitOn: result[0][1].Param6_LimitOn,
                                        dp: result[0][1].Param6_DP,
                                        isonstd: result[0][1].Param6_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        unit: ''
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    //*************************************************************************************************** */
    // below function is responsible for Menu creation only for balance and vernier, it pushes all the visible
    // menus to globalArray - arrLimits
    //*************************************************************************************************** */
    async streamDataMenuMaking(result, strIdsIP, productType, instrument, portNo, productSamples, side) {

        // finding index of object holding current idsNo
        // Here if Cubicle type is IPQC then we find actual 
        productSamples = productSamples[0][0];
        const index = globalData.arr_limits.findIndex(k => k.idsNo == strIdsIP);
        const CubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(strIdsIP));
        /**********
         * For Sun Halol Gujrat we have to send Direct Menu Selection not Menu list so
         */
        if (CubicInfo.Sys_Area == 'Softshell' && productType == 4 && serverConfig.ProjectName == 'SunHalolGuj1') {
            Object.assign(globalData.arr_limits[index], {
                Differential: {
                    nominal: result[0][0].Param0_Nom,
                    T1Neg: result[0][0].Param0_T1Neg,
                    T1Pos: result[0][0].Param0_T1Pos,
                    T2Neg: result[0][0].Param0_T2Neg,
                    T2Pos: result[0][0].Param0_T2Pos,
                    T3Neg: result[0][0].Param0_T3Neg,
                    T3Pos: result[0][0].Param0_T3Pos,
                    LimitOn: result[0][0].Param0_LimitOn,
                    dp: result[0][0].Param0_DP,
                    isonstd: result[0][0].Param0_IsOnStd,
                    port: portNo,
                    noOfSamples: productSamples.Individual,
                    side: side,
                    // unit: serverConfig.Differential
                    unit: result[0][0].Param0_Unit == 'NULL' | result[0][0].Param0_Unit == null ? 'mg' : result[0][0].Param0_Unit
                }
            });
        } else if (CubicInfo.Sys_Area == 'Dosa Dry Syrup' && productType == 5) { // For VeerSAnrda Dosa dry we have to send Direct Menu Selection not Menu list so
            Object.assign(globalData.arr_limits[index], {
                Individual: {
                    nominal: result[0][0].Param1_Nom,
                    T1Neg: result[0][0].Param1_T1Neg,
                    T1Pos: result[0][0].Param1_T1Pos,
                    T2Neg: result[0][0].Param1_T2Neg,
                    T2Pos: result[0][0].Param1_T2Pos,
                    LimitOn: result[0][0].Param1_LimitOn,
                    dp: result[0][0].Param1_DP,
                    isonstd: result[0][0].Param1_IsOnStd,
                    port: portNo,
                    noOfSamples: productSamples.Individual,
                    side: side,
                    unit: 'gm' // hardcoded unit suggested by Parameter Team
                    // unit: serverConfig.Individual// added by vivek on 18-08-2020
                }
            });
        } else {
            for (var key in result[0][0]) {
                if (result[0][0].hasOwnProperty(key)) {
                    if (key == 'Param1_Nom') { // for Indivisual, producttype1,2
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                if ((productType == 1 || productType == 2)) {
                                    Object.assign(globalData.arr_limits[index], {
                                        Individual: {
                                            nominal: result[0][0].Param1_Nom,
                                            T1Neg: result[0][0].Param1_T1Neg,
                                            T1Pos: result[0][0].Param1_T1Pos,
                                            T2Neg: result[0][0].Param1_T2Neg,
                                            T2Pos: result[0][0].Param1_T2Pos,
                                            LimitOn: result[0][0].Param1_LimitOn,
                                            dp: result[0][0].Param1_DP,
                                            isonstd: result[0][0].Param1_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Individual,
                                            side: side,
                                            // unit: serverConfig.Individual// added by vivek on 18-08-2020
                                            unit: result[0][0].Param1_Unit == 'NULL' | result[0][0].Param1_Unit == null ? 'gm' : result[0][0].Param1_Unit
                                        }
                                    });
                                    //console.log(globalData.arr_limits[index])
                                } else if (productType == 3) {
                                    if (result[0][0].MutihalerType[0] == 1) { // FOR CARTRIAGE
                                        Object.assign(globalData.arr_limits[index], {
                                            DryCart: {
                                                nominal: result[0][0].Param1_Nom,
                                                T1Neg: result[0][0].Param1_T1Neg,
                                                T1Pos: result[0][0].Param1_T1Pos,
                                                T2Neg: result[0][0].Param1_T2Neg,
                                                T2Pos: result[0][0].Param1_T2Pos,
                                                LimitOn: result[0][0].Param1_LimitOn,
                                                isonstd: result[0][0].Param1_IsOnStd,
                                                dp: result[0][0].Param1_DP,
                                                NMTT1: result[0][0].Param1_NMTTab,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                // unit: serverConfig.DryCart// added by vivek on 18-08-2020
                                                unit: 'mg'
                                            },
                                            NetCart: {
                                                nominal: result[0][0].Param1_Nom,
                                                T1Neg: result[0][0].Param1_T1Neg,
                                                T1Pos: result[0][0].Param1_T1Pos,
                                                T2Neg: result[0][0].Param1_T2Neg,
                                                T2Pos: result[0][0].Param1_T2Pos,
                                                LimitOn: result[0][0].Param1_LimitOn,
                                                isonstd: result[0][0].Param1_IsOnStd,
                                                dp: result[0][0].Param1_DP,
                                                NMTT1: result[0][0].Param1_NMTTab,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                // unit: serverConfig.NetCart// added by vivek on 18-08-2020
                                                unit: 'mg'
                                            }
                                        });
                                    } else { // FOR DPI STRIP
                                        Object.assign(globalData.arr_limits[index], {
                                            DryPwd: {
                                                nominal: result[0][0].Param1_Nom,
                                                T1Neg: result[0][0].Param1_T1Neg,
                                                T1Pos: result[0][0].Param1_T1Pos,
                                                T2Neg: result[0][0].Param1_T2Neg,
                                                T2Pos: result[0][0].Param1_T2Pos,
                                                LimitOn: result[0][0].Param1_LimitOn,
                                                isonstd: result[0][0].Param1_IsOnStd,
                                                dp: result[0][0].Param1_DP,
                                                NMTT1: result[0][0].Param1_NMTTab,
                                                port: portNo,
                                                noOfSamples: productSamples.Individual,
                                                side: side,
                                                // unit: serverConfig.DryPwd// added by vivek on 18-08-2020
                                                unit: 'mg'
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    } else if (key == 'Param2_Nom') { // for Group,producttype1,2
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                if ((productType == 1 || productType == 2)) {
                                    Object.assign(globalData.arr_limits[index], {
                                        Group: {
                                            nominal: result[0][0].Param2_Nom,
                                            T1Neg: result[0][0].Param2_T1Neg,
                                            T1Pos: result[0][0].Param2_T1Pos,
                                            T2Neg: result[0][0].Param2_T2Neg,
                                            T2Pos: result[0][0].Param2_T2Pos,
                                            LimitOn: result[0][0].Param2_LimitOn,
                                            dp: result[0][0].Param2_DP,
                                            isonstd: result[0][0].Param2_IsOnStd,
                                            port: portNo,
                                            noOfSamples: productSamples.Group,
                                            side: side,
                                            // unit: serverConfig.Group// added by vivek on 18-08-2020
                                            unit: result[0][0].Param2_Unit == 'NULL' | result[0][0].Param2_Unit == null ? 'gm' : result[0][0].Param2_Unit
                                        }
                                    });
                                    //console.log(globalData.arr_limits[index])
                                } else {
                                    if (productType == 3) {
                                        if (result[0][0].MutihalerType[0] == 1) {
                                            Object.assign(globalData.arr_limits[index], {
                                                SealedCart: {
                                                    nominal: result[0][0].Param2_Nom,
                                                    T1Neg: result[0][0].Param2_T1Neg,
                                                    T1Pos: result[0][0].Param2_T1Pos,
                                                    T2Neg: result[0][0].Param2_T2Neg,
                                                    T2Pos: result[0][0].Param2_T2Pos,
                                                    LimitOn: result[0][0].Param2_LimitOn,
                                                    isonstd: result[0][0].Param2_IsOnStd,
                                                    dp: result[0][0].Param2_DP,
                                                    NMTT1: result[0][0].Param2_NMTTab,
                                                    port: portNo,
                                                    noOfSamples: productSamples.Group,
                                                    side: side,
                                                    // unit: serverConfig.SealedCart// added by vivek on 18-08-2020
                                                    unit: 'gm'
                                                },

                                            });
                                        }
                                    }
                                }
                            }
                        }
                    } else if (key == 'Param3_Nom') { // for Thickness producttype1
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (productType == 1 && CubicInfo.Sys_VernierID != 'None'
                                && (instrument == 'BV' || instrument == 'Vernier')) {
                                Object.assign(globalData.arr_limits[index], {
                                    Thickness: {
                                        nominal: result[0][0].Param3_Nom,
                                        T1Neg: result[0][0].Param3_T1Neg,
                                        T1Pos: result[0][0].Param3_T1Pos,
                                        T2Neg: result[0][0].Param3_T2Neg,
                                        T2Pos: result[0][0].Param3_T2Pos,
                                        LimitOn: result[0][0].Param3_LimitOn,
                                        dp: result[0][0].Param3_DP,
                                        isonstd: result[0][0].Param3_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Vernier// added by vivek on 18-08-2020
                                        unit: result[0][0].Param3_Unit == 'NULL' | result[0][0].Param3_Unit == null ? 'mm' : result[0][0].Param3_Unit
                                    }
                                });
                            } else if (productType == 2 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) { // for Differential producttype2
                                Object.assign(globalData.arr_limits[index], {
                                    Differential: {
                                        nominal: result[0][0].Param0_Nom,
                                        T1Neg: result[0][0].Param0_T1Neg,
                                        T1Pos: result[0][0].Param0_T1Pos,
                                        T2Neg: result[0][0].Param0_T2Neg,
                                        T2Pos: result[0][0].Param0_T2Pos,
                                        LimitOn: result[0][0].Param0_LimitOn,
                                        dp: result[0][0].Param0_DP,
                                        isonstd: result[0][0].Param0_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual// added by vivek on 18-08-2020
                                        unit: result[0][0].Param1_Unit == 'NULL' | result[0][0].Param1_Unit == null ? 'gm' : result[0][0].Param1_Unit // as discussed with pushkar and sheetal
                                    }
                                });
                                // Net Wgt details for Diff 
                                Object.assign(globalData.arr_limits[index], {
                                    Net: {
                                        nominal: result[0][0].Param3_Nom,
                                        T1Neg: result[0][0].Param3_T1Neg,
                                        T1Pos: result[0][0].Param3_T1Pos,
                                        T2Neg: result[0][0].Param3_T2Neg,
                                        T2Pos: result[0][0].Param3_T2Pos,
                                        LimitOn: result[0][0].Param3_LimitOn,
                                        dp: result[0][0].Param3_DP,
                                        isonstd: result[0][0].Param3_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual// added by vivek on 18-08-2020
                                        unit: result[0][0].Param1_Unit == 'NULL' | result[0][0].Param1_Unit == null ? 'gm' : result[0][0].Param1_Unit // as discussed with pushkar and sheetal
                                    }
                                });
                            }
                        }
                    } else if (key == 'Param4_Nom') { // for bredth
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check vernier is set 
                            if (productType == 1 && CubicInfo.Sys_VernierID != 'None'
                                && (instrument == 'BV' || instrument == 'Vernier')) { //for bredth, productType1
                                Object.assign(globalData.arr_limits[index], {
                                    Breadth: {
                                        nominal: result[0][0].Param4_Nom,
                                        T1Neg: result[0][0].Param4_T1Neg,
                                        T1Pos: result[0][0].Param4_T1Pos,
                                        T2Neg: result[0][0].Param4_T2Neg,
                                        T2Pos: result[0][0].Param4_T2Pos,
                                        LimitOn: result[0][0].Param4_LimitOn,
                                        dp: result[0][0].Param4_DP,
                                        isonstd: result[0][0].Param4_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Vernier// added by vivek on 18-08-2020
                                        unit: result[0][0].Param4_Unit == 'NULL' | result[0][0].Param4_Unit == null ? 'mm' : result[0][0].Param4_Unit
                                    }
                                });
                            } else if (productType == 2 && CubicInfo.Sys_VernierID != 'None'
                                && (instrument == 'BV' || instrument == 'Vernier')) { //for Diameter, productType2
                                Object.assign(globalData.arr_limits[index], {
                                    Diameter: {
                                        nominal: result[0][0].Param4_Nom,
                                        T1Neg: result[0][0].Param4_T1Neg,
                                        T1Pos: result[0][0].Param4_T1Pos,
                                        T2Neg: result[0][0].Param4_T2Neg,
                                        T2Pos: result[0][0].Param4_T2Pos,
                                        LimitOn: result[0][0].Param4_LimitOn,
                                        dp: result[0][0].Param4_DP,
                                        isonstd: result[0][0].Param4_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Vernier// added by vivek on 18-08-2020
                                        unit: result[0][0].Param4_Unit == 'NULL' | result[0][0].Param4_Unit == null ? 'mm' : result[0][0].Param4_Unit
                                    }
                                });
                            }
                        }
                    } else if (key == 'Param5_Nom') { // for Length, productType1,2
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check vernier is set 
                            if ((productType == 1 || productType == 2) && CubicInfo.Sys_VernierID != 'None'
                                && (instrument == 'BV' || instrument == 'Vernier')) {
                                Object.assign(globalData.arr_limits[index], {
                                    Length: {
                                        nominal: result[0][0].Param5_Nom,
                                        T1Neg: result[0][0].Param5_T1Neg,
                                        T1Pos: result[0][0].Param5_T1Pos,
                                        T2Neg: result[0][0].Param5_T2Neg,
                                        T2Pos: result[0][0].Param5_T2Pos,
                                        LimitOn: result[0][0].Param5_LimitOn,
                                        dp: result[0][0].Param5_DP,
                                        isonstd: result[0][0].Param5_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Vernier// added by vivek on 18-08-2020
                                        unit: result[0][0].Param5_Unit == 'NULL' | result[0][0].Param5_Unit == null ? 'mm' : result[0][0].Param5_Unit
                                    }
                                });
                            }
                        }
                    } else if (key == 'Param6_Nom') {
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check vernier is set 
                            if (productType == 1 && CubicInfo.Sys_VernierID != 'None'
                                && (instrument == 'BV' || instrument == 'Vernier')) {// for Diameter, productType1
                                Object.assign(globalData.arr_limits[index], {
                                    Diameter: {
                                        nominal: result[0][0].Param6_Nom,
                                        T1Neg: result[0][0].Param6_T1Neg,
                                        T1Pos: result[0][0].Param6_T1Pos,
                                        T2Neg: result[0][0].Param6_T2Neg,
                                        T2Pos: result[0][0].Param6_T2Pos,
                                        LimitOn: result[0][0].Param6_LimitOn,
                                        dp: result[0][0].Param6_DP,
                                        isonstd: result[0][0].Param6_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Vernier// added by vivek on 18-08-2020
                                        unit: result[0][0].Param6_Unit == 'NULL' | result[0][0].Param6_Unit == null ? 'mm' : result[0][0].Param6_Unit
                                    }
                                });
                            }
                        }
                    } else if (key == 'Param9_Nom') { // for Ind_Layer // content-1
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (productType == 1 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                var paramName = 'Ind_Layer';
                                if (serverConfig.ProjectName == "RBH") {
                                    paramName = 'Ind_Empty';
                                } else { }
                                globalData.arr_limits[index][paramName] = {

                                    nominal: result[0][0].Param9_Nom,
                                    T1Neg: result[0][0].Param9_T1Neg,
                                    T1Pos: result[0][0].Param9_T1Pos,
                                    T2Neg: result[0][0].Param9_T2Neg,
                                    T2Pos: result[0][0].Param9_T2Pos,
                                    LimitOn: result[0][0].Param9_LimitOn,
                                    dp: result[0][0].Param9_Dp,
                                    isonstd: result[0][0].Param9_IsOnStd,
                                    port: portNo,
                                    noOfSamples: productSamples.Individual,
                                    side: side,
                                    // unit: serverConfig.Individual// added by vivek on 18-08-2020
                                    unit: result[0][0].Param9_Unit == 'NULL' | result[0][0].Param9_Unit == null ? 'gm' : result[0][0].Param9_Unit

                                }

                            } else if (productType == 2 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    content1: {
                                        nominal: result[0][0].Param9_Nom,
                                        T1Neg: result[0][0].Param9_T1Neg,
                                        T1Pos: result[0][0].Param9_T1Pos,
                                        T2Neg: result[0][0].Param9_T2Neg,
                                        T2Pos: result[0][0].Param9_T2Pos,
                                        LimitOn: result[0][0].Param9_LimitOn,
                                        dp: result[0][0].Param9_DP,
                                        isonstd: result[0][0].Param9_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual,
                                        unit: result[0][0].Param9_Unit == 'NULL' | result[0][0].Param9_Unit == null ? 'gm' : result[0][0].Param9_Unit,
                                        contentType: result[0][0].Param9_ContentType
                                    }
                                });
                            }

                        }
                    } else if (key == 'Param10_Nom') { // for Grp_Layer //content-2
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (productType == 1 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    Grp_Layer: {
                                        nominal: result[0][0].Param10_Nom,
                                        T1Neg: result[0][0].Param10_T1Neg,
                                        T1Pos: result[0][0].Param10_T1Pos,
                                        T2Neg: result[0][0].Param10_T2Neg,
                                        T2Pos: result[0][0].Param10_T2Pos,
                                        LimitOn: result[0][0].Param10_LimitOn,
                                        dp: result[0][0].Param10_DP,
                                        isonstd: result[0][0].Param10_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Group,
                                        side: side,
                                        // unit: serverConfig.Group// added by vivek on 18-08-2020
                                        unit: result[0][0].Param10_Unit == 'NULL' | result[0][0].Param10_Unit == null ? 'gm' : result[0][0].Param10_Unit
                                    }
                                });
                            } else if (productType == 2 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    content2: {
                                        nominal: result[0][0].Param10_Nom,
                                        T1Neg: result[0][0].Param10_T1Neg,
                                        T1Pos: result[0][0].Param10_T1Pos,
                                        T2Neg: result[0][0].Param10_T2Neg,
                                        T2Pos: result[0][0].Param10_T2Pos,
                                        LimitOn: result[0][0].Param10_LimitOn,
                                        dp: result[0][0].Param10_DP,
                                        isonstd: result[0][0].Param10_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual,
                                        unit: result[0][0].Param10_Unit == 'NULL' | result[0][0].Param10_Unit == null ? 'gm' : result[0][0].Param10_Unit,
                                        contentType: result[0][0].Param10_ContentType
                                    }
                                });
                            }
                        }
                    } else if (key == 'Param11_Nom') { // for Ind_Layer1 // content-3
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (productType == 1 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    Ind_Layer1: {
                                        nominal: result[0][0].Param11_Nom,
                                        T1Neg: result[0][0].Param11_T1Neg,
                                        T1Pos: result[0][0].Param11_T1Pos,
                                        T2Neg: result[0][0].Param11_T2Neg,
                                        T2Pos: result[0][0].Param11_T2Pos,
                                        LimitOn: result[0][0].Param11_LimitOn,
                                        dp: result[0][0].Param11_DP,
                                        isonstd: result[0][0].Param11_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual// added by vivek on 18-08-2020
                                        unit: result[0][0].Param11_Unit == 'NULL' | result[0][0].Param11_Unit == null ? 'gm' : result[0][0].Param11_Unit
                                    }
                                });
                            } else if (productType == 2 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    content3: {
                                        nominal: result[0][0].Param11_Nom,
                                        T1Neg: result[0][0].Param11_T1Neg,
                                        T1Pos: result[0][0].Param11_T1Pos,
                                        T2Neg: result[0][0].Param11_T2Neg,
                                        T2Pos: result[0][0].Param11_T2Pos,
                                        LimitOn: result[0][0].Param11_LimitOn,
                                        dp: result[0][0].Param11_DP,
                                        isonstd: result[0][0].Param11_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual,
                                        unit: result[0][0].Param11_Unit == 'NULL' | result[0][0].Param11_Unit == null ? 'gm' : result[0][0].Param11_Unit,
                                        contentType: result[0][0].Param11_ContentType
                                    }
                                });
                            }
                        }
                    } else if (key == 'Param12_Nom') { // for Grp_Layer1 // content-4
                        if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                            // check for product type and check balance is set 
                            if (productType == 1 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    Grp_Layer1: {
                                        nominal: result[0][0].Param12_Nom,
                                        T1Neg: result[0][0].Param12_T1Neg,
                                        T1Pos: result[0][0].Param12_T1Pos,
                                        T2Neg: result[0][0].Param12_T2Neg,
                                        T2Pos: result[0][0].Param12_T2Pos,
                                        LimitOn: result[0][0].Param12_LimitOn,
                                        dp: result[0][0].Param12_DP,
                                        isonstd: result[0][0].Param12_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Group,
                                        side: side,
                                        // unit: serverConfig.Group// added by vivek on 18-08-2020
                                        unit: result[0][0].Param12_Unit == 'NULL' | result[0][0].Param12_Unit == null ? 'gm' : result[0][0].Param12_Unit
                                    }
                                });
                            } else if (productType == 2 && CubicInfo.Sys_BalID != 'None'
                                && (instrument == 'BV' || instrument == 'Balance')) {
                                Object.assign(globalData.arr_limits[index], {
                                    content4: {
                                        nominal: result[0][0].Param12_Nom,
                                        T1Neg: result[0][0].Param12_T1Neg,
                                        T1Pos: result[0][0].Param12_T1Pos,
                                        T2Neg: result[0][0].Param12_T2Neg,
                                        T2Pos: result[0][0].Param12_T2Pos,
                                        LimitOn: result[0][0].Param12_LimitOn,
                                        dp: result[0][0].Param12_DP,
                                        isonstd: result[0][0].Param12_IsOnStd,
                                        port: portNo,
                                        noOfSamples: productSamples.Individual,
                                        side: side,
                                        // unit: serverConfig.Individual,
                                        unit: result[0][0].Param12_Unit == 'NULL' | result[0][0].Param12_Unit == null ? 'gm' : result[0][0].Param12_Unit,
                                        contentType: result[0][0].Param12_ContentType
                                    }
                                });
                            }
                        }
                    } else
                        if (key == 'Param8_Nom') { // for Friability on Balance
                            if (parseFloat(result[0][0][key]) > 0 && parseFloat(result[0][0][key]) != 99999) {
                                // check for product type and check balance is set 

                                if (serverConfig.friabilityType == 'OB' || serverConfig.friabilityType == 'BFBO' || serverConfig.friabilityType == 'BFBT') {
                                    if (productType == 1 && CubicInfo.Sys_BalID != 'None' &&
                                        (instrument == 'BV' || instrument == 'Balance')
                                        // && CubicInfo.Sys_CubType != 'Effervescent Granulation'
                                    ) {
                                        if ('Friability' in globalData.arr_limits[index]) {
                                            // Do nothing console.log('Present')
                                        } else {
                                            Object.assign(globalData.arr_limits[index], {
                                                Friability: {
                                                    nominal: result[0][0].Param8_Nom,
                                                    T1Neg: result[0][0].Param8_T1Neg,
                                                    T1Pos: result[0][0].Param8_T1Pos,
                                                    LimitOn: result[0][0].Param8_LimitOn,
                                                    dp: result[0][0].Param8_DP,
                                                    isonstd: result[0][0].Param8_IsOnStd,
                                                    port: portNo,
                                                    noOfSamples:  productSamples.Friability,
                                                    side: side,
                                                    unit: '%'// added by vivek on 18-08-2020
                                                }
                                            });
                                        }
                                    }
                                }

                            }
                        }
                }
            }
        }
        return globalData.arr_limits[index]; // retuning here munuObj
    }
    //**************************************************************************************************8 */
    // Below function prints menu and takes argument as idsNo argument
    //************************************************************************************************** */
    async PrintMenu(idsNo) {
        try {
            var CubicleObj, CubicleInfo;
            // here CubicleObj holds the object of limits for that specific IDS which is in current cubicle
            CubicleObj = globalData.arr_limits.find(k => k.idsNo == idsNo)
            // CubicleInfo defines the cubicle related object like batch name, prname,prid, instrument info rtc.
            CubicleInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);

            var port1Instrument = CubicleInfo.Sys_Port1;
            var port2Instrument = CubicleInfo.Sys_Port2;
            var port3Instrument = CubicleInfo.Sys_Port3;
            var port4Instrument = CubicleInfo.Sys_Port4;
            const propOwn = Object.getOwnPropertyNames(CubicleObj);
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == idsNo)

            var lenght;
            if (CubicleInfo.Sys_Area == 'Effervescent Granulation' || CubicleInfo.Sys_Area == 'Granulation' || CubicleInfo.Sys_Area == 'Pallet Coating' ||
                CubicleInfo.Sys_Area == 'MFG-1 Processing Area' || CubicleInfo.Sys_Area == 'MFG-1 Blending Area' || CubicleInfo.Sys_Area == 'MFG-3 IPQC' ||
                CubicleInfo.Sys_Area == 'MFG-2 Processing Area' || CubicleInfo.Sys_Area == 'MFG-2 Blending Area' || CubicleInfo.Sys_Area == 'MFG-8 Processing Area' || CubicleInfo.Sys_Area == 'MFG-8 IPQC'
                || CubicleInfo.Sys_Area == 'MFG-5 Capsule' || CubicleInfo.Sys_Area == 'MFG-6 Capsule' || CubicleInfo.Sys_Area == 'Pellet IPQC'
                || (CubicleInfo.Sys_Area == 'Pellets-II' && CubicleInfo.Sys_CubType == 'IPQC' && CubicleInfo.Sys_MoistID != 'None')) {
                //CubicleInfo.Sys_Area == 'Pellets-II' && CubicleInfo.Sys_CubType == 'IPQC' && CubicleInfo.Sys_MoistID != 'None' // for kurkumbh pallet-II area CubicType IPQC LOD
                // Here we want to check in array imits how manu types of LOD we have so..
                let count = 0;
                if (CubicleObj["GRNDRY"] != undefined) { count = count + 1 };
                if (CubicleObj["GRNLUB"] != undefined) { count = count + 1 };
                if (CubicleObj["LAY1DRY"] != undefined) { count = count + 1 };
                if (CubicleObj["LAY1LUB"] != undefined) { count = count + 1 };
                if (CubicleObj["LAY2DRY"] != undefined) { count = count + 1 };
                if (CubicleObj["LAY2LUB"] != undefined) { count = count + 1 };
                lenght = propOwn.length - 1 - count;
            }
            else if (CubicleInfo.Sys_Area.includes('IPQA')) {
                if (CubicleInfo.Sys_IPQCType == 'Capsule Filling') {
                    if (CubicleObj.Net != undefined) {
                        lenght = propOwn.length - 2;
                    } else {
                        lenght = propOwn.length - 1;
                    }
                } else {
                    lenght = propOwn.length - 1;
                }
            } else if (CubicleInfo.Sys_Area == 'Capsule Filling' || CubicleInfo.Sys_Area == 'Pellets-II' || CubicleInfo.Sys_Area == 'CheckWeigher') {
                if (CubicleObj.Net != undefined) {
                    lenght = propOwn.length - 2;
                    if (CubicleObj.content1 != undefined) lenght = lenght - 1;
                    if (CubicleObj.content2 != undefined) lenght = lenght - 1;
                    if (CubicleObj.content3 != undefined) lenght = lenght - 1;
                    if (CubicleObj.content4 != undefined) lenght = lenght - 1;
                }
                else if (CubicleObj.LOD != undefined) {
                    lenght = propOwn.length - 1
                    if (CubicleObj.GRNDRY != undefined) lenght = lenght - 1;
                    if (CubicleObj.GRNLUB != undefined) lenght = lenght - 1;
                    if (CubicleObj.LAY1DRY != undefined) lenght = lenght - 1;
                    if (CubicleObj.LAY1LUB != undefined) lenght = lenght - 1;
                    if (CubicleObj.LAY2DRY != undefined) lenght = lenght - 1;
                    if (CubicleObj.LAY2LUB != undefined) lenght = lenght - 1;
                }
                else {
                    lenght = propOwn.length - 1;
                }

                //}
            }
            else {
                lenght = propOwn.length - 1; // 'length -1' is for cubicle object holds one more key that is IdsIp along with menus
            }
            // here we are checking for IMC3 for frability and balance so balance only used for calibration
            var tempIM = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
            var returnProtocol1 = 'MR'; //MR
            var returnProtocol = "";
            // returnProtocol += lenght;//MR##
            for (let key in CubicleObj) {
                if (CubicleObj.hasOwnProperty(key)) {
                    if (key !== 'idsNo') {
                        switch (key) {
                            case 'Individual':

                                if (tempIM.IM != 'IMC') {
                                    if (CubicleInfo.Sys_Area == 'Dosa Dry Syrup') {
                                        returnProtocol += '1DOSDRY,'; //MR##1Indi
                                    }
                                    else if (serverConfig.ProjectName == "RBH" && CubicleObj.Ind_Empty !== undefined) {//this if block is added by vivek on 08-06-2020 for "RBH"
                                        var result = await this.RBHCheckIndEptyData(idsNo)
                                        if (result == true) {
                                            returnProtocol += '1INDIVI,'; //MR##1Indi
                                        }
                                        else {
                                            lenght = lenght - 1;
                                        }
                                    }
                                    else {
                                        returnProtocol += '1INDIVI,'; //MR##1Indi
                                    }
                                } else {
                                    lenght = lenght - 1;
                                }
                                break;
                            case 'Group':
                                if (tempIM.IM != 'IMC') {
                                    if (serverConfig.ProjectName == "RBH" && CubicleObj.Ind_Empty !== undefined) {//this if block is added by vivek on 08-06-2020 for "RBH"
                                        var result = await this.RBHCheckIndEptyData(idsNo)
                                        if (result == true) {
                                            returnProtocol += '2GROUP,'; //MR##1Indi
                                        }
                                        else {
                                            lenght = lenght - 1;
                                        }
                                    }
                                    else {
                                        returnProtocol += '2GROUP ,'; //MR##1Indi,2.Group...... so on
                                    }
                                }
                                else {
                                    lenght = lenght - 1;
                                }

                                break;
                            case 'Thickness':

                                if ((port1Instrument == 'Vernier' || port2Instrument == 'Vernier'
                                    || port3Instrument == 'Vernier' || port3Instrument == 'Vernier') && CubicleInfo.Sys_VernierID != 'None') {
                                    returnProtocol += '3THICKN,';
                                } else {
                                    lenght = lenght - 1;
                                }
                                break;
                            case 'Differential':
                                returnProtocol += 'DDIFFER,';
                                break;
                            case 'Breadth':
                                //We have multiParameter Hardness so we also fills `DOLOB0` so in order
                                //to not show menu we have to check port Instrument vernier present or not
                                if ((port1Instrument == 'Vernier' || port2Instrument == 'Vernier'
                                    || port3Instrument == 'Vernier' || port3Instrument == 'Vernier') && CubicleInfo.Sys_VernierID != 'None') {
                                    returnProtocol += '4BREADT,';
                                } else {
                                    lenght = lenght - 1;
                                }
                                break;
                            case 'Length':
                                if ((port1Instrument == 'Vernier' || port2Instrument == 'Vernier'
                                    || port3Instrument == 'Vernier' || port4Instrument == 'Vernier') && CubicleInfo.Sys_VernierID != 'None') {
                                    returnProtocol += '5LENGTH,';
                                } else {
                                    lenght = lenght - 1;
                                }
                                break;
                            case 'Diameter':
                                if ((port1Instrument == 'Vernier' || port2Instrument == 'Vernier'
                                    || port3Instrument == 'Vernier' || port4Instrument == 'Vernier') && CubicleInfo.Sys_VernierID != 'None') {
                                    if (objProductType.productType == 2) {
                                        returnProtocol += '4DIAMTR,';
                                    }
                                    else {
                                        returnProtocol += '6DIAMTR,';
                                    }

                                } else {
                                    lenght = lenght - 1;
                                }
                                break;
                            case 'Hardness':
                                let hardnessMetaData = await this.CheckHardnessModel(idsNo);
                                let HardnessType = hardnessMetaData.Eqp_HT_IsMutliTester;
                                if (HardnessType == 0) {// Normal Hardness (Not multiparameters)
                                    var hexInfo = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                                    if (hexInfo.IM != 'IMG3') {
                                        if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                            returnProtocol += 'THARDNS,';
                                        } else {
                                            returnProtocol += 'HHARDNS,';
                                        }
                                    } else {
                                        if (CubicleObj[key].port == '3') {
                                            returnProtocol += 'THARDNS,';
                                        } else if (CubicleObj[key].port == '4') {
                                            returnProtocol += 'HHARDNS,';
                                        } else {
                                            returnProtocol += 'EHARDNS,';
                                        }
                                    }
                                } else {
                                    lenght = lenght - 1;
                                }
                                break;

                            case 'Friability':
                                var selectedIds;
                                var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                                if (IPQCObject != undefined) {
                                    selectedIds = IPQCObject.selectedIds;
                                } else {
                                    selectedIds = idsNo;
                                }
                                if (serverConfig.friabilityType == 'OB') {
                                    var tempFriMrnu = globalData.arrFriabilityMenuVisibility.find(k => k.idsNo == selectedIds);
                                    if (tempFriMrnu.ETS == 0) {
                                        returnProtocol += 'RFRIABL,';
                                    } else {
                                        lenght = lenght - 1;
                                    }
                                } else if (serverConfig.friabilityType == 'OF') {
                                    // IF FRIABLATOR INSTRUMENT PRESENT
                                    if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                        returnProtocol += 'TFRBLTR,';
                                    } else {
                                        returnProtocol += 'HFRBLTR,';
                                    }
                                } else if (serverConfig.friabilityType == 'BFBO') {
                                    var tempBFBO = globalData.arrBFBO.find(k => k.idsNo == selectedIds);//setParam
                                    if (!tempBFBO.before && !tempBFBO.setParam) {
                                        returnProtocol += 'RFRIABL,';
                                    } else if (tempBFBO.before && !tempBFBO.setParam) {
                                        if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                            returnProtocol += 'TFRBLTR,';
                                        } else {
                                            returnProtocol += 'HFRBLTR,';
                                        }
                                    } else {
                                        returnProtocol += 'RFRIABL,';
                                    }
                                } else
                                    if (serverConfig.friabilityType == 'BFBT') {
                                        var tempBFBO = globalData.arrBFBO.find(k => k.idsNo == selectedIds);//setParam
                                        if (!tempBFBO.before && !tempBFBO.setParam) {
                                            if (port1Instrument == 'Friabilator' || port2Instrument == 'Friabilator'
                                                || port3Instrument == 'Friabilator' || port3Instrument == 'Friabilator') {
                                                lenght = lenght - 1;
                                            } else {
                                                returnProtocol += 'RFRIABL,';
                                            }
                                        } else if (tempBFBO.before && !tempBFBO.setParam && (port1Instrument == 'Friabilator' || port2Instrument == 'Friabilator'
                                            || port3Instrument == 'Friabilator' || port3Instrument == 'Friabilator')) {
                                            if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                                returnProtocol += 'TFRIABL,';
                                            } else {
                                                returnProtocol += 'HFRIABL,';
                                            }
                                        } else if (tempBFBO.before && tempBFBO.setParam && !tempBFBO.after) {
                                            if (port1Instrument == 'Friabilator' || port2Instrument == 'Friabilator'
                                                || port3Instrument == 'Friabilator' || port3Instrument == 'Friabilator') {
                                                lenght = lenght - 1;
                                            } else {
                                                returnProtocol += 'RFRIABL,';
                                            }
                                        } else {
                                            lenght = lenght - 1;
                                        }
                                    } else {
                                        lenght = lenght - 1;
                                    }
                                break;
                            case 'Ind_Layer':
                                if (tempIM.IM != 'IMC') {
                                    returnProtocol += '8INDLA1,';
                                } else {
                                    lenght = lenght - 1;
                                }

                                break;
                            case 'Ind_Empty':
                                returnProtocol += '8INDEMP,';
                                break;
                            case 'Grp_Layer':
                                if (tempIM.IM != 'IMC') {
                                    returnProtocol += '9GRPLA1,';
                                } else {
                                    lenght = lenght - 1;
                                }


                                break;
                            case 'Ind_Layer1':
                                if (tempIM.IM != 'IMC') {
                                    returnProtocol += 'LINDLA2,';
                                } else {
                                    lenght = lenght - 1;
                                }

                                break;
                            case 'Grp_Layer1':
                                if (tempIM.IM != 'IMC') {
                                    returnProtocol += 'KGRPLA2,';
                                } else {
                                    lenght = lenght - 1;
                                }

                                break;
                            case 'DT':
                                // FETCHING HEXINFO
                                var hexInfo = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                                if (hexInfo.IM != 'IMG3') {
                                    if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                        returnProtocol += 'TDT,';
                                    } else {
                                        returnProtocol += 'HDT,';
                                    }
                                } else {
                                    if (CubicleObj[key].port == '3') {
                                        returnProtocol += 'TDT,';
                                    } else if (CubicleObj[key].port == '4') {
                                        returnProtocol += 'HDT,';
                                    } else {
                                        returnProtocol += 'EDT,';
                                    }
                                }
                                break;
                            case 'TDT':
                                var hexInfo = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                                if (hexInfo.IM != 'IMG3') {
                                    if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                        returnProtocol += 'TTDT,';
                                    } else {
                                        returnProtocol += 'HTDT,';
                                    }
                                } else {
                                    if (CubicleObj[key].port == '3') {
                                        returnProtocol += 'TTDT,';
                                    } else if (CubicleObj[key].port == '4') {
                                        returnProtocol += 'HTDT,';
                                    } else {
                                        returnProtocol += 'ETDT,';
                                    }
                                }
                                break;
                            case 'LOD':
                                var hexInfo = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                                if (hexInfo.IM != 'IMG3') {
                                    if (CubicleObj[key].port == '3' || CubicleObj[key].port == '2') {
                                        returnProtocol += 'TLOD,';
                                    } else {
                                        returnProtocol += 'HLOD,';
                                    }
                                } else {
                                    if (CubicleObj[key].port == '3') {
                                        returnProtocol += 'TLOD,';
                                    } else if (CubicleObj[key].port == '4') {
                                        returnProtocol += 'HLOD,';
                                    } else {
                                        returnProtocol += 'ELOD,';
                                    }
                                }
                                break;
                            case 'PerFine':
                                returnProtocol += "F%FINE,"
                                break;
                            case 'PartSize':
                                returnProtocol += "PPRTSIZ,"
                                break;
                            case 'DryCart':
                                returnProtocol += "WDRYCRT,"
                                break;
                            case 'DryPwd':
                                returnProtocol += "XDRYPWD,"
                                break;
                            case 'SealedCart':
                                returnProtocol += "YSLDCRT,"
                                break;
                            case 'NetCart':
                                returnProtocol += "ZNETCRT,"
                                break;
                        }
                    }

                }
            }
            if ((port3Instrument == 'IPC Balance' || port1Instrument == 'IPC Balance') && CubicleInfo.Sys_BinBalID != 'None') {
                returnProtocol += "BIPCWEIG,";
                lenght = lenght + 1;
            }
            // Tablet Tester Menu printing
            if ((CubicleInfo.Sys_HardID != 'None')) {
                let hardnessMetaDataObj = await this.CheckHardnessModel(idsNo);
                let HardnessIDType = hardnessMetaDataObj.Eqp_HT_IsMutliTester;
                if (CubicleObj['Hardness'] != undefined || CubicleObj['Length'] != undefined || CubicleObj['Breadth'] != undefined
                    || CubicleObj['Diameter'] != undefined || CubicleObj['Thickness'] != undefined) {
                    if ((CubicleInfo.Sys_Port3 == 'Hardness' || CubicleInfo.Sys_Port2 == 'Hardness' || CubicleInfo.Sys_Port3 == "Tablet Tester" || CubicleInfo.Sys_Port2 == 'Tablet Tester')) {

                        if (HardnessIDType != undefined && HardnessIDType == 1) {// Multiparameter
                            returnProtocol += 'TTABTES,';
                            lenght = lenght + 1;
                        }
                    } else {

                        if (HardnessIDType != undefined && HardnessIDType == 1) {// Multiparameter
                            returnProtocol += 'HTABTES,';
                            lenght = lenght + 1;
                        }
                    }
                }
            }
            // code need to be reviewed again
            // if (CubicleInfo.Sys_Area == 'Capsule Filling' && CubicleInfo.Sys_CubType == 'IPQC') {
            //     lenght = ("0" + (lenght - 1)).slice(-2); // this logic for capsule filling IPQC 
            // } else {
            //     lenght = ("0" + (lenght)).slice(-2);
            // }
            lenght = ("0" + (lenght)).slice(-2);


            var finalMenuProtocol = returnProtocol1 + lenght + returnProtocol;
            return finalMenuProtocol

        } catch (error) {
            console.log(error)
            return error;
        }


    }

    async CheckHardnessModel(idsNo, str_Protocol) {
        try {
            var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            var hardnessId = cubicInfo.Sys_HardID;
            // var selectOtherEquip = {
            //     str_tableName: 'tbl_otherequipment',
            //     data: '*',
            //     condition: [
            //         { str_colName: 'Eqp_ID', value: hardnessId },
            //         { str_colName: 'Eqp_Type', value: 'Hardness' }
            //     ]
            // }

            let qry = `select * from tbl_otherequipment where Eqp_ID='${hardnessId}' and Eqp_Type in ('Hardness','Tablet Tester')`
            //var result = await database.select(selectOtherEquip);

            var result = await database.execute(qry);
            return result[0][0];
        } catch (err) {
            throw new Error(err);
        }
    }

    async RBHCheckIndEptyData(idsNo) {
        try {
            //this function will check wheteher given batch,product combination data is present in
            //tabmaster8 if yes data is present the display associatd menu (i.e. group or individual)
            //if data is not present than dipaly ONLY INDIVIDUAL menu.

            var CubicleObj, TableName, CubicleInfo, BatchNamme, ProductName, ProductID, ProductVersion, Version;

            // here CubicleObj holds the object of limits for that specific IDS which is in current cubicle
            CubicleObj = globalData.arr_limits.find(k => k.idsNo == idsNo)
            // CubicleInfo defines the cubicle related object like batch name, prname,prid, instrument info rtc.
            CubicleInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);

            BatchNamme = CubicleInfo.Sys_Batch
            ProductName = CubicleInfo.Sys_ProductName
            ProductID = CubicleInfo.Sys_BFGCode
            ProductVersion = CubicleInfo.Sys_PVersion
            Version = CubicleInfo.Sys_Version
            TableName = 'tbl_tab_master9'

            var objselect = {
                str_tableName: TableName,
                data: '*',
                condition: [
                    { str_colName: 'BatchNo', value: BatchNamme, comp: 'eq' },
                    { str_colName: 'ProductName', value: ProductName, comp: 'eq' },
                    { str_colName: 'BFGCode', value: ProductID, comp: 'eq' },
                    { str_colName: 'PVersion', value: ProductVersion, comp: 'eq' },
                    { str_colName: 'VERSION', value: Version, comp: 'eq' },
                    { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD'), comp: 'eq' },

                ]
            }

            var objData = await database.select(objselect)
            if (objData[0].length > 0) {
                return true
            }
            else {
                return false
            }
        }
        catch (err) {
            throw new error(err)
        }

    }
    //****************************************************************************************************** */
    // Below function is for IPQC Area if current cubicle is IPQC, so we have to display list of product in that
    // specific area
    //***************************************************************************************************** */
    async processIPQC(strIdsIP, AreaSelectedFromIDS = "") {

        // finding area of logged in Ids
        var CubicalData = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == strIdsIP);
        var sysArea = CubicalData.Sys_Area;
        if (AreaSelectedFromIDS != "") {
            sysArea = AreaSelectedFromIDS;
            var areaRelated = globalData.arrAreaRelated.find(k => k.idsNo == strIdsIP);
            if (areaRelated == undefined) {
                globalData.arrAreaRelated.push({ idsNo: strIdsIP, selectedArea: sysArea });
            } else {
                areaRelated.idsNo = strIdsIP;
                areaRelated.selectedArea = sysArea;
            }
        }
        var query;
        if (sysArea == 'IPQC') { //This section only for RB project
            /** For RB Project they have single IPQC for All areas. so we are showing all areas IPQC list at one go
        * @description As in database for IPQC i-e SysCubicType = 'IPQC' and SysArea = 'IPQC'
        */
            query = `SELECT * FROM tbl_cubical WHERE 
            Sys_BFGCode != 'NULL' AND Sys_BFGCode != 'None' AND Sys_Batch != 'None'
            AND Sys_Batch != 'NULL' AND Sys_IDSNo != '0' AND Sys_CubType != 'IPC'`;
        } else if (sysArea.includes('IPQA')) {
            sysArea = CubicalData.Sys_IPQCType;
            query = `SELECT * FROM tbl_cubical WHERE (Sys_Area LIKE '${sysArea}%'|| Sys_Area LIKE 'IPQA%') 
            AND Sys_BFGCode != 'NULL' AND Sys_BFGCode != 'None' AND Sys_Batch != 'None'
            AND Sys_Batch != 'NULL' AND Sys_IDSNo != '0' AND Sys_CubType != 'IPC'`;
        } else if (sysArea.includes('Pharma Office')) {
            sysArea = CubicalData.Sys_IPQCType;
            query = `SELECT * FROM tbl_cubical WHERE (Sys_Area LIKE '${sysArea}%' || Sys_Area LIKE 'Pharma Office%') 
            AND Sys_BFGCode != 'NULL' AND Sys_BFGCode != 'None' AND Sys_Batch != 'None'
            AND Sys_Batch != 'NULL' AND Sys_IDSNo != '0' AND Sys_CubType != 'IPC'`;
        } else if (sysArea == 'Pellets-I') {
            sysArea = CubicalData.Sys_IPQCType;
            query = `SELECT * FROM tbl_cubical WHERE (Sys_Area LIKE '${sysArea}%' || Sys_Area LIKE 'Pellets-I%') 
            AND Sys_BFGCode != 'NULL' AND Sys_BFGCode != 'None' AND Sys_Batch != 'None'
            AND Sys_Batch != 'NULL' AND Sys_IDSNo != '0' AND Sys_CubType != 'IPC'`;
        } else {
            query = `SELECT * FROM tbl_cubical WHERE Sys_Area LIKE '${sysArea}%' 
            AND Sys_BFGCode != 'NULL' AND Sys_BFGCode != 'None' AND Sys_Batch != 'None'
            AND Sys_Batch != 'NULL' AND Sys_IDSNo != '0' AND Sys_CubType != 'IPC'`;
        }
        var result = await database.execute(query)
        //var result = await database.select(selectObj);
        var arrCubicleArray = result[0];
        if (arrCubicleArray.length > 0) {
            var strProtocol = 'LDP01';
            arrCubicleArray.forEach(element => {
                strProtocol += element.Sys_IDSNo + ':' + element.Sys_Batch + ',';
            });
            strProtocol += ';';
            return strProtocol;
        } else {
            //var strProtocol = 'LEP';
            var strProtocol = await objArea.areaSelection();
            return strProtocol;
        }
        // return strProtocol;
    }
    async friabilityIPQC(strIdsIP) {
        var query = "SELECT * FROM `tbl_tab_friability` WHERE (ActualCount=0 AND ActualRPM=0)";
        var result = await database.execute(query)
        var tempArray = [];
        if (result[0].length > 0) {
            for (let a of result[0]) {
                if (a.Side == 'Single') {
                    if (a.NWtBeforeTest != 0 && a.NWtAfterTest == 0) {
                        tempArray.push(a);
                    }
                } else {
                    if (a.LWtBeforeTest != 0 && a.RWtBeforeTest != 0 && a.LWtAfterTest == 0 && a.RWtAfterTest == 0) {
                        tempArray.push(a);
                    }
                }
            }
        }
        if (tempArray.length == 0) {
            return 'ID3 No Product, Available,,';
        } else {
            var strProtocol = 'LDP01';
            tempArray.forEach(element => {
                strProtocol += element.IdsNo + ':' + element.BatchNo + ',';
            });
            strProtocol += ';';
            return strProtocol;
        }
    }
    //************************************************************************************************** */
    // this function called when list is selected from IDS, based on selected product menus will drow
    //************************************************************************************************** */
    async listSelection(IdsSrNo, str_Protocol, str_IpAddress) {
        try {
            var selectedIds;
            var objLocation = globalData.arrIPCLocation.find(k => k.idsNo == IdsSrNo);
            // added on 16/12/2020
            var tempForBinFlag = false;
            var tempCheck = globalData.arrisIMGBForBin.find(k => k.idsNo == IdsSrNo);
            tempForBinFlag = tempCheck == undefined ? tempForBinFlag = false : tempForBinFlag = tempCheck.flag;
            if (objLocation != undefined) {
                var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsSrNo); // for VeerSAndra IPQC 
                if (IPQCObject != undefined) {
                    selectedIds = IPQCObject.selectedIds;
                } else {
                    selectedIds = IdsSrNo;
                }
            } else {
                selectedIds = IdsSrNo;
            }

            let CubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var objIPClocation = globalData.arrIPCLocation.find(k => k.idsNo == IdsSrNo)
            var str_ProtocolIdentification = str_Protocol.substring(2, 3);

            if (str_ProtocolIdentification == "A") {
                var areaSelectedOnIDS = str_Protocol.substring(3).split(",")[0];
                var strProtocol = await this.processIPQC(IdsSrNo, areaSelectedOnIDS)
                //this.sendProtocol(strProtocol, str_IpAddress);
                return strProtocol;
            }
            else if (str_ProtocolIdentification == "0") {
                var strProtocol = await objArea.areaSelection();
                return strProtocol;
            }
            else if (str_ProtocolIdentification == "E") {
                /**
                 * while on Area screen when user pres ESC then control comes here and control will shifted to the
                 * IPQC list of current IDS
                 */

                var strReturnProtocol = await this.processIPQC(IdsSrNo);
                if (globalData.arrAreaRelated != undefined) {
                    globalData.arrAreaRelated = globalData.arrAreaRelated
                        .filter(k => k.idsNo != IdsSrNo)
                }
                if (globalData.arr_IPQCRelIds != undefined) {
                    globalData.arr_IPQCRelIds = globalData.arr_IPQCRelIds
                        .filter(k => k.idsNo != IdsSrNo)
                }
                return strReturnProtocol;


            }
            else if ((CubicInfo.Sys_Area == "Compression" || CubicInfo.Sys_Area == "Capsule Filling"
                || CubicInfo.Sys_Area == "Coating" || CubicInfo.Sys_Area == 'Granulation'
                || CubicInfo.Sys_Area == 'Effervescent Compression' || CubicInfo.Sys_Area == 'Effervescent Granulation' || CubicInfo.Sys_Area == 'Inprocess' ||
                CubicInfo.Sys_Area.includes('IPQA'))
                && CubicInfo.Sys_CubType == globalData.objNominclature.BinText || tempForBinFlag) {

                var selectedTypeLS = str_Protocol.substr(2, 1); // if Protocol will be LSP then we will get P

                switch (selectedTypeLS) {
                    case 'P':
                        //  await handleLoginModal.updateWeighmentStatus(idsNo, 1);
                        var objLocation = globalData.arrIPCLocation.find(k => k.idsNo == IdsSrNo);
                        if (objLocation != undefined) {
                            var arrSelProduct = str_Protocol.split(":");
                            var selectedIDS = arrSelProduct[0].substr(3).trim();
                            var typeSelection = str_Protocol.substring(3, 4);
                        } else {
                            var arrSelProduct = str_Protocol.split(":");
                            var selectedIDS = arrSelProduct[0].substr(3).trim();
                        }
                        var resCubical = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIDS);

                        var selectedBatch = resCubical.Sys_Batch;
                        var selectedProductId = resCubical.Sys_BFGCode;
                        var selectedProductName = resCubical.Sys_ProductName;
                        var selectedProductVersion = resCubical.Sys_PVersion;
                        var selectedVersion = resCubical.Sys_Version;

                        var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsSrNo);//selectedIDS

                        var objBinIndex = globalData.arrBinIndex.find(k => k.idsNo == IdsSrNo);  //selectedIDS

                        if (objBin == undefined) {
                            globalData.arrBinInfo.push(
                                {
                                    idsNo: IdsSrNo,
                                    selIds: selectedIDS,
                                    selProductId: selectedProductId,
                                    selProductName: selectedProductName,
                                    selProductVersion: selectedProductVersion,
                                    selVersion: selectedVersion,
                                    selBatch: selectedBatch,
                                    selContainer: "",
                                    tareWt: 0,
                                    grossWt: 0,
                                    netWt: 0,
                                    prDate: "",
                                    prTime: "",
                                    balanceID: "",
                                    dp: 3, // if not specified then automatically it will take 3 decimal points
                                    userid: "",
                                    username: ""
                                })
                        }
                        else {
                            objBin.selIds = selectedIDS;
                            objBin.selProductId = selectedProductId;
                            objBin.selProductName = selectedProductName;
                            objBin.selProductVersion = selectedProductVersion;
                            objBin.selVersion = selectedVersion;
                            objBin.selBatch = selectedBatch;
                        }

                        if (objBinIndex == undefined) {
                            globalData.arrBinIndex.push({
                                idsNo: IdsSrNo,
                                startIndex: 0,
                                endIndex: 43
                            })
                        }
                        else {
                            objBinIndex.startIndex = 0;
                            objBinIndex.endIndex = 43;
                        }
                        if (objLocation != undefined) {
                            var result = await objContainer.sendIPCList(IdsSrNo, CubicInfo.Sys_Area, CubicInfo.Sys_CubType, true, typeSelection);
                            return result;
                        } else {
                            return "LSB" + selectedBatch + ",";
                        }
                        break;
                    case 'B':
                        //   await objloginModel.updateWeighmentStatus(IdsSrNo, 0);
                        var result = await objContainer.sendIPCList(IdsSrNo, CubicInfo.Sys_Area, CubicInfo.Sys_CubType, true);
                        return result;
                        break;
                    case 'N': // container list
                        //var selectedCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsSrNo);
                        await objloginModel.updateWeighmentStatus(IdsSrNo, 1);
                        var splitBin = str_Protocol.split(',');
                        var selectedContainer = splitBin[0].substring(3);
                        var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsSrNo);
                        objBin.selContainer = selectedContainer;
                        var dblTareWt = await objContainer.getTareWt(objBin.selContainer, IdsSrNo, CubicInfo.Sys_Area, CubicInfo.Sys_CubType);
                        /**
                         * @description If Tare wt is 0 then ask for tare wt
                         */
                        if (parseFloat(dblTareWt) == 0) {
                            var objActivity = {};
                            var userObj = globalData.arrUsers.find(k => k.IdsNo == IdsSrNo);
                            Object.assign(objActivity,
                                { strUserId: userObj.UserId },
                                {
                                    strUserName: userObj.UserName //sarr_UserData[0].UserName 
                                },
                                { activity: 'IPC weighing started on ' + IdsSrNo })
                            await objActivityLog.ActivityLogEntry(objActivity);
                            return "WTT0" + "PRODUCT:" + objBin.selProductId + "," + '00' + " ,";

                        } else {
                            var objActivity = {};
                            var userObj = globalData.arrUsers.find(k => k.IdsNo == IdsSrNo);
                            Object.assign(objActivity,
                                { strUserId: userObj.UserId },
                                {
                                    strUserName: userObj.UserName //sarr_UserData[0].UserName 
                                },
                                { activity: 'IPC weighing started on ' + IdsSrNo })
                            await objActivityLog.ActivityLogEntry(objActivity);
                            return "WTG0" + "PRODUCT:" + objBin.selProductId + "," + Number(dblTareWt).toFixed(2) + " Kg,";
                        }
                        break;
                    default:
                        break;
                }
            }
            else {
                let timeOutPeriod = ('0000' + (globalData.arrsAllParameters[0].tbl_config_TimeoutPeriod * 60)).slice(-4)

                if (str_ProtocolIdentification == "Q" && (CubicInfo.Sys_Area == 'Effervescent Granulation' ||
                    //here for testing capsule filling IpQC  and only for cipla 4 goa adding  
                    (CubicInfo.Sys_Area == 'Capsule Filling' && CubicInfo.Sys_CubType == 'IPQC') ||
                    CubicInfo.Sys_Area == 'Granulation' || CubicInfo.Sys_Area == 'Pallet Coating' || CubicInfo.Sys_Area == 'Pellets-II'
                    || CubicInfo.Sys_Area == 'MFG-1 Processing Area' || CubicInfo.Sys_Area == 'MFG-1 Blending Area' || CubicInfo.Sys_Area == 'MFG-3 IPQC' || CubicInfo.Sys_Area == 'MFG-2 Processing Area' || CubicInfo.Sys_Area == 'MFG-2 Blending Area'
                    || CubicInfo.Sys_Area == 'MFG-8 Processing Area' || CubicInfo.Sys_Area == 'MFG-8 IPQC'
                    || CubicInfo.Sys_Area == 'MFG-5 Capsule' || CubicInfo.Sys_Area == 'MFG-6 Capsule' || CubicInfo.Sys_Area == 'Pellet IPQC')) { // IF LIST OF GRAN LODs
                    var side = CubicInfo.Sys_RotaryType;
                    str_Protocol = str_Protocol.split(',')[0].substring(3);
                    // here we store which menu is selected based on incoming protocol
                    if (globalData.arrLODTypeSelectedMenu.find(k => k.idsNo == IdsSrNo) == undefined) {
                        globalData.arrLODTypeSelectedMenu.push({ idsNo: IdsSrNo, selectedLOD: str_Protocol })
                    } else {
                        let tempObj = globalData.arrLODTypeSelectedMenu.find(k => k.idsNo == IdsSrNo);
                        tempObj.selectedLOD = str_Protocol;
                    }
                    if (side == 'Single' || side == 'NA') {
                        side = 'N';
                    } else if (side == 'Double') {
                        side = 'L';
                    }
                    var cno = CubicInfo.Sys_CubicNo; // Cubicle number
                    // finding Out how many sample required from 'tbl_cubicle_product_sample' table
                    var slectProductSamples = {
                        str_tableName: 'tbl_cubicle_product_sample',
                        data: '*',
                        condition: [
                            { str_colName: 'Sys_CubicNo', value: cno, comp: 'eq' }
                        ]
                    }
                    var result = await database.select(slectProductSamples);
                    var LODType;
                    switch (str_Protocol) {
                        case 'GRANULES DRY':
                            LODType = "GRNDRY"; //  COMPDRY
                            break;
                        case 'GRANULES LUB':
                            LODType = "GRNLUB"; //  COMPLUB
                            break;
                        case 'LAYER1 DRY':
                            LODType = "LAY1DRY";
                            break;
                        case 'LAYER1 LUB':
                            LODType = "LAY1LUB";
                            break;
                        case 'LAYER2 DRY':
                            LODType = "LAY2DRY";
                            break;
                        case 'LAYER2 LUB':
                            LODType = "LAY2LUB";
                            break;
                    }
                    //clearing and reiniting LOD DATA
                    var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsSrNo);
                    if (objLodData == undefined) {
                        globalData.arrLodData.push({ idsNo: IdsSrNo, arr: [], counter: 0 })
                    }
                    else {
                        objLodData.arr = [];
                    }
                    var Obj = globalData.arr_menuList.find(k => k.MenuName == 'LOD');
                    var objArrLimits = globalData.arr_limits.find(k => k.idsNo == IdsSrNo);
                    var MenuTypeObj = globalData.arrGranulationMenuType.find(k => k.idsNo == IdsSrNo)
                    var Limit = objArrLimits[LODType];
                    var noOfsamples = objArrLimits[LODType].noOfSamples;
                    noOfsamples = ("00" + noOfsamples).slice(-3);
                    var intInstrumentID;
                    if (MenuTypeObj.LODMenuType == 'H') {
                        intInstrumentID = 4;
                    } else {
                        intInstrumentID = 3;
                    }
                    //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                    //let strReturnProtocol = `MS${MenuTypeObj.LODMenuType}${intInstrumentID}${side}${LODType},${Limit.T1Pos},${Limit.T1Neg},N.A,0000,1`;
                    let strReturnProtocol = `MS${MenuTypeObj.LODMenuType}${intInstrumentID}${side}${LODType},${Limit.T1Pos},${Limit.T1Neg},N.A,0000,1,${objArrLimits[LODType].unit},`;
                    //************************************************************************* *****************************************************/
                    return strReturnProtocol;
                } else { // IF LIST OF IPQC
                    var strSelectedIds = str_Protocol.split(':')[0].substring(3, 6);
                    // check if array hold the object w.r.t to current Ids if not then we push otherwise we can update that
                    // object w.r.t Current Ids fot the future use
                    if (globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsSrNo) == undefined) {
                        globalData.arr_IPQCRelIds.push({ idsNo: IdsSrNo, selectedIds: strSelectedIds });
                    } else {
                        for (var i in globalData.arr_IPQCRelIds) {
                            if (globalData.arr_IPQCRelIds[i].idsNo == IdsSrNo) {
                                globalData.arr_IPQCRelIds[i].selectedIds = strSelectedIds;
                                break; //Stop this loop, we found it!
                            }
                        }
                    }
                    // console.log('IPQC',globalData.arr_IPQCRelIds);
                    var strBatchNo = str_Protocol.split(':')[1].split(',')[0];
                    var selectProdDetObj = {
                        str_tableName: 'tbl_cubical',
                        data: '*',
                        condition: [
                            { str_colName: 'Sys_IDSNo', value: strSelectedIds, comp: 'eq' },
                        ]
                    }
                    var result = await database.select(selectProdDetObj);
                    var IDStype = result[0][0].Sys_PortNo;
                    // After selecting product details we need only 4 params
                    const Product = implement(IProduct)({
                        ProductId: result[0][0].Sys_BFGCode,
                        ProductName: result[0][0].Sys_ProductName,
                        ProductVersion: result[0][0].Sys_PVersion,
                        Version: result[0][0].Sys_Version,
                    })
                    var res = await cubicleSetting.checkProductSet(strSelectedIds);
                    if (res.result == false) {
                        var strProtocol = "ID3 Product Not Set,,,";
                        this.sendProtocol(strProtocol, str_IpAddress);
                    }
                    else {
                        var resData = await productdetail.checkProductActivate(res, strSelectedIds, str_Protocol, IdsSrNo, strBatchNo);
                        var strProtocol
                        if (resData.result == "SETPRODUCT") {
                            strProtocol = "ID3 Product Not,Activated,,";
                        }
                        else if (resData.result == "SETMACHINE") {
                            strProtocol = "ID3 Machine Not, Activated,,";
                        } else {
                            strProtocol = resData.result;
                        }
                        this.sendProtocol(strProtocol, str_IpAddress);

                    }
                    return '+';
                }
            }

        } catch (error) {
            return error;
        }


    }
    async SelectedBin(IdsSrNo, str_Protocol, str_IpAddress) {
        //var selectedCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsSrNo);
        let CubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsSrNo);
        var splitBin = str_Protocol.split(',');
        var selectedContainer = splitBin[0].substring(2);
        var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsSrNo);
        objBin.selContainer = selectedContainer;
        return true;
    }
    async saveEmptyWt(IdsSrNo, str_Protocol, str_IpAddress) {
        try {
            var dblTareWt = str_Protocol.substring(2, str_Protocol.indexOf(' ') + 1).trim();
            var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsSrNo);
            if (0 >= parseFloat(dblTareWt)) {
                //return "DM000TARE WT CANNOT BE,LESS THAN OR,EQUAL 0,,";
                return "DM000Tare Weight must be,> 0,,";
            } else {
                var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsSrNo);
                objBin.tareWt = parseFloat(dblTareWt);
                var curentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objBin.selIds);
                var area = curentCubicle.Sys_Area;
                var cubType = curentCubicle.Sys_CubType;
                var updateObjTare = {
                    str_tableName: '',
                    data: [
                        { str_colName: 'Bin_TareWt', value: objBin.tareWt }
                    ],
                    condition: [
                        { str_colName: 'Bin_IDSNo', value: objBin.selIds, comp: 'eq' },
                        { str_colName: 'Bin_ProductID', value: objBin.selProductId, comp: 'eq' },
                        { str_colName: 'Bin_ProductName', value: objBin.selProductName, comp: 'eq' },
                        { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion, comp: 'eq' },
                        { str_colName: 'Bin_Version', value: objBin.selVersion, comp: 'eq' },
                        { str_colName: 'Bin_BinID', value: objBin.selContainer, comp: 'eq' },
                    ]
                }
                if ((area.toUpperCase() == "COMPRESSION" || area.toUpperCase() == "EFFERVESCENT COMPRESSION"
                    || area.toUpperCase() == "EFFERVESCENT GRANULATION" || area.toUpperCase() == "GRANULATION")
                    && cubType.toUpperCase() != 'IPC') {
                    updateObjTare.str_tableName = "tbl_bin_master_comp";
                }
                else if (area.toUpperCase() == "COATING" && cubType.toUpperCase() != 'IPC') {
                    updateObjTare.str_tableName = "tbl_bin_master_coat";
                }
                else if (area.toUpperCase() == "CAPSULE FILLING" && cubType.toUpperCase() != 'IPC') {
                    updateObjTare.str_tableName = "tbl_bin_master_cap";
                } else if (cubType.toUpperCase() == 'IPC') {
                    updateObjTare.str_tableName = "tbl_bin_master_ipc";
                }
                var userObj = globalData.arrUsers.find(k => k.IdsNo == IdsSrNo);
                var objActivity = {};
                Object.assign(objActivity,
                    { strUserId: userObj.UserId },
                    {
                        strUserName: userObj.UserName //sarr_UserData[0].UserName 
                    },
                    { activity: `Tare Wt of Bin - ${objBin.selContainer} taken` + IdsSrNo })
                await objActivityLog.ActivityLogEntry(objActivity);
                await database.update(updateObjTare);
                return 'WL212;';
                // return "WTG0" + "PRODUCT:" + objBin.selProductId + "," + Number(dblTareWt).toFixed(2) + " ,";
            }
        } catch (err) {
            throw new Error(err);
        }
    }
    async saveGrossWt(IdsSrNo, str_Protocol, str_IpAddress) {
        var objCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsSrNo);
        var dblGrossWt = str_Protocol.substring(2, str_Protocol.indexOf(' ') + 1).trim();
        var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsSrNo);
        var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsSrNo);
        var dblTareWt = await objContainer.getTareWt(objBin.selContainer, IdsSrNo, objCubicInfo.Sys_Area, objCubicInfo.Sys_CubType);
        objBin.tareWt = dblTareWt;
        if (parseFloat(objBin.tareWt) >= parseFloat(dblGrossWt)) {
            //return "DM000GROSS WT CANNOT BE,LESS THAN OR,EQUAL TO TARE WT,,";
            return "DM000Gross Weight must be,>" + parseFloat(objBin.tareWt).toFixed(2) + ",,,";
        }
        else {
            objBin.grossWt = dblGrossWt;
            objBin.netWt = Number(dblGrossWt - objBin.tareWt).toFixed(2);
            objBin.balanceID = objCubicInfo.Sys_BinBalID;
            objBin.prDate = date.format(now, 'YYYY-MM-DD');
            objBin.prTime = date.format(now, 'HH:mm:ss');
            objBin.dp = dblGrossWt.substring(dblGrossWt.indexOf('.') + 1, dblGrossWt.length).trim().length;
            objBin.userid = tempUserObject.UserId;
            objBin.username = tempUserObject.UserName;
            var result = await objContainer.saveContainerWeighment(objBin, objCubicInfo.Sys_Area, objCubicInfo.Sys_CubType, IdsSrNo);
            return 'WL212;';
        }
    }
    /**
     * 
     * @param {*} IdsSrNo 
     * @param {*} str_Protocol 
     * @param {*} str_IpAddress 
     * @description listCancle Function handles when area list escaped 
     */
    async listCancle(IdsSrNo, str_Protocol, str_IpAddress) {
        const IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsSrNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds
        } else {
            selectedIds = IdsSrNo; // for compression and coating
        };
        var selectedCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        var str_ProtocolIdentification = str_Protocol.substring(2, 3);
        /**
               * while on Area screen when user pres ESC then control comes here and control will shifted to the
               * IPQC list of current IDS
               */
        if (str_ProtocolIdentification == "A") {
            //Commented by Pradip as when Escaping from Area list user gets logout 18/09/2020
            // var strReturnProtocol = await this.processIPQC(IdsSrNo);
            // if (globalData.arrAreaRelated != undefined) {
            //     globalData.arrAreaRelated = globalData.arrAreaRelated
            //         .filter(k => k.idsNo != IdsSrNo)
            // }
            // if (globalData.arr_IPQCRelIds != undefined) {
            //     globalData.arr_IPQCRelIds = globalData.arr_IPQCRelIds
            //         .filter(k => k.idsNo != IdsSrNo)
            // }
            // return strReturnProtocol;
            return 'LO';
        } else if (str_ProtocolIdentification == "N") { // Bin List escape
            return 'LO'
        } else if (str_ProtocolIdentification == "Q") {
            let returnProtocol = await this.getProductDetail(IdsSrNo);
            return returnProtocol;
        } else {
            return '+';
        }

    }
    /**
     * 
     * @param {*} str_Protocol 
     * @param {*} str_IpAddress 
     */
    async sendProtocol(str_Protocol, str_IpAddress) {
        // encrypting text
        //console.log('4');
        var encryptedProtocol
        if (str_Protocol != "+") {
            encryptedProtocol = await objEncryptDecrypt.encrypt(str_Protocol);
        }
        else {
            encryptedProtocol = str_Protocol;
        }

        // calculating checksum for enc protocol and appending to protocol
        var arrEncryptProtocol = [];
        arrEncryptProtocol.push(...Buffer.from(encryptedProtocol, 'utf8'));
        let protocolWithCheckum = await objCheckSum.getCheckSumBuffer(arrEncryptProtocol);
        // finally send protocol to requested Ids
        objServer.server.send(protocolWithCheckum, 8080, str_IpAddress, function (error) {
            if (error) {
                console.log('new error on protocolHandlerController', error)
            } else {
                var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , (SENT)From PC : To  " + str_IpAddress + " : " + str_Protocol;
                console.log(logQ);
                //commented by vivek on 31-07-2020********************************
                //logFromPC.info(logQ);
                //logFromPC.addtoProtocolLog(logQ)
                //************************************************************** */
                if (str_Protocol != 'DM0G0Group Weighment, Pending,,,,') {
                    // objClsLogger.protocolLogFromPC(str_Protocol,str_IpAddress);
                    // console.log('Protocol sent ' + str_Protocol + "ip" + str_IpAddress);
                    objProtocolStore.storeresponse(str_IpAddress.split('.')[3], str_Protocol, str_IpAddress);
                }
            }

        });
    }









}
module.exports = MenuRequestModel;