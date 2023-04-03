const Database = require('../../database/clsQueryProcess');
const globalData = require('../../global/globalData');
const database = new Database();
const clsRemarkInComplete = require('../../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();

const serverConfig = require('../../global/severConfig');
const PowerBackup = require('../../model/clsPowerBackupModel');
const clspowerbackup = new PowerBackup();
class Product {
    /**
     * 
     * @param {*} objProduct 
     * @param {*} idsNo //For IPQC this is selected IDSNO otherWise it is current 
     * @param {*} actualIdsNo // for IPQC this is actual IDS no otherWise it will be 0
     */
    async checkProductActivate(objProduct, idsNo, str_Protocol, actualIdsNo = 0, strBatchNo = '') {
        try {
            //console.log(objProduct.result.Sys_BFGCode);
            let tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            let responseObj = {};
            const productObjEx = {
                str_tableName: "tbl_product_master",
                data: '*',
                condition: [
                    { str_colName: 'ProductId', value: objProduct.result.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: objProduct.result.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'Version', value: objProduct.result.Sys_Version, comp: 'eq' },
                    { str_colName: 'ProductVersion', value: objProduct.result.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'IsActive', value: 1, comp: 'eq' },
                ]
            }
            //console.log(productObjEx);
            let resultset = await database.select(productObjEx);
            if (resultset[0].length > 0) {
                var dataSet = resultset[0][0];
                var active = dataSet.IsActive;
                var activeValue = active.readUIntLE();
                if (activeValue == 0) {
                    Object.assign(responseObj, { result: 'SETPRODUCT' })
                    return responseObj
                } else {
                    const cubicleObj = {
                        str_tableName: "tbl_cubical",
                        data: '*',
                        condition: [
                            { str_colName: 'Sys_BFGCode', value: objProduct.result.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'Sys_ProductName', value: objProduct.result.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'Sys_Version', value: objProduct.result.Sys_Version, comp: 'eq' },
                            { str_colName: 'Sys_PVersion', value: objProduct.result.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Sys_IDSNo', value: idsNo, comp: 'eq' }
                        ]
                    }
                    let resultdata = await database.select(cubicleObj);
                    var dataValue = resultdata[0][0];
                    const productSampleObj = {
                        str_tableName: "tbl_cubicle_product_sample",
                        data: '*',
                        condition: [
                            { str_colName: 'Sys_BFGCode', value: objProduct.result.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'Sys_ProductName', value: objProduct.result.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'Sys_Version', value: objProduct.result.Sys_Version, comp: 'eq' },
                            { str_colName: 'Sys_PVersion', value: objProduct.result.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Sys_CubicNo', value: tempCubicInfo.Sys_CubicNo, comp: 'eq' },
                        ]
                    }
                    let prodSampleRes = await database.select(productSampleObj);
                    if (prodSampleRes[0].length > 0) {
                        var noOfSample = prodSampleRes[0][0].Individual;
                        var machineCode = dataValue.Sys_MachineCode;
                        var noofSample = dataValue.Sys_NoOfSample;
                        //console.log(noofSample);
                        // const machineObj = {
                        //     str_tableName: "tbl_machine",
                        //     data: '*',
                        //     condition: [
                        //         { str_colName: 'Machine_ID', value: machineCode, comp: 'eq' },
                        //         { str_colName: 'Machine_Active', value: 1, comp: 'eq' }
                        //     ]
                        // }
                        // database.select(machineObj).then((result) => {
                        // var data = result[0][0];
                        // if (result[0].length == 0) {
                        //     Object.assign(responseObj, { result: 'SETMACHINE' })
                        //     resolve(responseObj)
                        // } else {
                        // Taking rotory from cubicle
                        var rotary = dataValue.Sys_RotaryType;
                        var rotaryValue;
                        if (rotary == 'Single') {
                            rotaryValue = '01';
                        } else {
                            rotaryValue = '02';
                        }
                        /**
                         * CHECK FOR INCOMPLETE RECORD, IF INCOMPLETE RECORD FOR ANY WEIGHMENT PENDING FROM IDS 
                         * THEN SHOW MSG TO INSERT REMARK FOR INCOMPLETE RECORD ON ANGULAR
                         */
                        //let objPowerBackup = await clspowerbackup.fetchPowerBackupData(actualIdsNo);  //these line is changeing for testing of hardness 
                        // let objPowerBackup = tempCubicInfo.Sys_Area == 'IPQC' ?
                        //     await clspowerbackup.fetchPowerBackupData(actualIdsNo) :
                        //     await clspowerbackup.fetchPowerBackupData(idsNo)
                        // let objPowerBackup;

                        // if(actualIdsNo != 0){
                        //    objPowerBackup = await clspowerbackup.fetchPowerBackupData(actualIdsNo);
                        // }else {
                        //    objPowerBackup = await clspowerbackup.fetchPowerBackupData(idsNo);
                        // }

                        // // let response = await objRemarkInComplete.checkEntry(idsNo, actualIdsNo, strBatchNo);
                        // // if (objPowerBackup.status && objPowerBackup.result.length > 0) {
                        // //     var actualData = "MP" + objProduct.result.Sys_BFGCode + "," + noOfSample + "," + dataValue.Sys_Batch + "," + rotaryValue;
                        // //     Object.assign(responseObj, { result: actualData })
                        // //     return responseObj;
                        // // } else if (response != false) {
                        // //     //var actualData = `ID3 INCOMPLETE REMARK IS,PENDING FOR,${response.param.toUpperCase()} WEIGHMENT,`;
                        // //     var actualData = `ID3 Remark Pending For,${response.param.toUpperCase()} Test,,`;
                        // //     Object.assign(responseObj, { result: actualData })
                        // //     return responseObj
                        // //     // this.sendProtocol(, str_IpAddress);
                        // // } else {
                        // var actualData = "MP" + objProduct.result.Sys_BFGCode + "," + noOfSample + "," + dataValue.Sys_Batch + "," + rotaryValue;
                        // Object.assign(responseObj, { result: actualData })
                        // return responseObj;
                        // // }
                        // //

                        // // }
                    
                            var actualData = "MP" + objProduct.result.Sys_BFGCode + "," + noOfSample + "," + dataValue.Sys_Batch + "," + rotaryValue;
                            Object.assign(responseObj, { result: actualData })
                            return responseObj;

                        // }).catch(err => console.log(err));
                    } else {
                        console.log('No record found in product sample for the produt combination')
                        return '+';
                    }


                }
            } else {
                // Object.assign(responseObj, { result: "ID3 PRODUCT NOT SET, TRY AGAIN,,," })
                Object.assign(responseObj, { result: "ID3 Product Not Set,,," })
                //resolve(responseObj);
                return responseObj;
            }//
            //resolve(resultset[0][0]);



        } catch (err) {
            throw new Error(err);
        }
    }


    async instrumentCheck(menuType) {
        var instrument;
        switch (menuType) {
            case '1':
                instrument = "BALANCE";
                break;
            case 'K':
                instrument = "BALANCE";
                break;
            case '2':
                instrument = "BALANCE";
            case '3':
                instrument = 'VERNIER'
                break;
            case '4':
                instrument = 'VERNIER'

            case '5':
                instrument = 'VERNIER'

            case '6':

                instrument = 'VERNIER'
            case '8':

                instrument = "BALANCE";
            case '9':
                instrument = "BALANCE";
            case 'L':
                instrument = "BALANCE";
            case '9':
                instrument = "BALANCE";
            case 'P':
                instrument = "BALANCE";
            case 'F':
                instrument = "BALANCE";
        }
        return instrument;
    }


}
module.exports = Product;
