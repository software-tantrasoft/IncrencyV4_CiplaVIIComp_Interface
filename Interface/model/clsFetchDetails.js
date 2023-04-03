const request = require('request');
const serverConfig = require('../global/severConfig');
const Database = require('../database/clsQueryProcess');
const database = new Database();
const globalData = require('../global/globalData');
const implementjs = require('implement-js')
const implement = implementjs.default;
const IProduct = require('../../Interfaces/productInterface');
const moment = require('moment');
const date1 = require('date-and-time');
var logFromPC = require('../model/clsLogger');
const sort = require('../model/Calibration/checkForPendingCalib');
const PreCalibCheck = require('./clsPreWeighmentChecks');
const clsPreWeighmentChecks = new PreCalibCheck();
let now = new Date();
/**
 * @description Class to call startUp function
 */
class FetchDetails {
    // *****************************************************************************************************8//
    // Below function gets all the IDS at startup
    //****************************************************************************************************** */
    getIds() {
        return new Promise((resolve, reject) => {
            var selectIdsObj = {
                str_tableName: 'tbl_cubical',
                data: '*',
            }
            database.select(selectIdsObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { console.log(err) })
        })
    }
   
    /**
     * @param {mode : Mode of IP // IDS or Hardness}
     */
    async getIPTCP(ip, mode) {
        try {
            if(mode == 'ids') {
                let selectOther = {
                    str_tableName:'tbl_otherequipment',
                    data:'*',
                    condition: [
                        {str_colName:'Eqp_IP', value:ip}
                    ]
                }
                let resultOther = await database.select(selectOther);
                let nameOfEq = resultOther[0][0].Eqp_ID;
                let selectCubicle = {
                    str_tableName:'tbl_cubical',
                    data:'*',
                    condition: [{str_colName:'Sys_HardID', value:nameOfEq}]
                }
                let IDSRes = await database.select(selectCubicle);
                return IDSRes[0][0].Sys_IDSNo;
            } else {
                let selectCubicle = {
                    str_tableName:'tbl_cubical',
                    data:'*',
                    condition: [{str_colName:'Sys_IDSNo', value:ip}]
                }
                let IDSRes = await database.select(selectCubicle);
                let hardnessId = IDSRes[0][0].Sys_HardID;
                let selectOther = {
                    str_tableName:'tbl_otherequipment',
                    data:'*',
                    condition: [
                        {str_colName:'Eqp_ID', value:hardnessId}
                    ]
                }
                let otherEqRes = await database.select(selectOther);
                return otherEqRes[0][0].Eqp_IP;
            }
        } catch (err) {
            console.log(err);
            throw new Error(err);
        }
    }
     // *****************************************************************************************************8//
    // Below function gets all parameters from tbl_config
    //****************************************************************************************************** */
    getAllParameters() {
        return new Promise((resolve, reject) => {
            var selectParamObj = {
                str_tableName: 'tbl_setallparameter',
                data: '*',
            }
            database.select(selectParamObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { console.log(err) })
        });
    }
    // *****************************************************************************************************8//
    // Below function gets recalibration status for that balance
    //****************************************************************************************************** */
    getRecalibBalanceStatus() {
        return new Promise((resolve, reject) => {
            var selectParamObj = {
                str_tableName: 'tbl_recalibration_balance_status',
                data: '*',
            }
            database.select(selectParamObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { console.log(err) })
        })
    }
    getRecalibBalanceStatusBin() {
        return new Promise((resolve, reject) => {
            var selectParamObj = {
                str_tableName: 'tbl_recalibration_balance_status_bin',
                data: '*',
            }
            database.select(selectParamObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { console.log(err) })
        })
    }
    getRecalibVernierStatusBin() {
        return new Promise((resolve, reject) => {
            var selectParamObj = {
                str_tableName: 'tbl_recalibration_vernier_status',
                data: '*',
            }
            database.select(selectParamObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { console.log(err) })
        })
    }
    // *****************************************************************************************************8//
    // Below function gets calibration sequence
    //****************************************************************************************************** */
    getCalibrationSequence() {
        return new Promise((resolve, reject) => {
            var selectParamObj = {
                str_tableName: 'tbl_calibration_sequnce',
                data: '*',
            }
            database.select(selectParamObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { reject("Error while fetching CalibrationSequence") })
        })
    }
    // *****************************************************************************************************8//
    // Below function gets calibration status weather it id done or not done
    //****************************************************************************************************** */
    getCaibrationStatus(IDSSrNo) {
        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
        if (objOwner.owner == 'analytical') {
            var strBalId = tempCubicInfo.Sys_BalID;
        } else {
            var strBalId = tempCubicInfo.Sys_BinBalID;
        }
        const selectBalData = {
            str_tableName: 'tbl_balance',
            data: '*',
            condition: [
                { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' }
            ]
        }
        database.select(selectBalData).then(result => {
            const bln_storeType = result[0][0].Bal_CalbStoreType.readUIntLE();
            var today = new Date();
            var month = today.getMonth();
            var year = today.getFullYear();
            // bln_storeType = 1 for setDays && 0 for set dates
            if (bln_storeType == 1) {
                var checkFroCalbPendingObj = {
                    str_tableName: 'tbl_balance',
                    data: '*',
                    condition: [
                        { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                        { str_colName: 'Bal_CalbDueDt', value: date1.format(now, 'YYYY-MM-DD'), comp: 'lte' }
                    ]
                }
                database.select(checkFroCalbPendingObj).then(bal_res => {
                    if (bal_res[0].length != 0) {
                        this.pushCalibrationObj(strBalId, IDSSrNo);
                    }
                })
            }
            else {
                var arr = result[0][0].Bal_CalbDates.split(',');
                var today = new Date();
                var todayDate = moment().format('YYYY-MM-DD');
                var month = today.getMonth() + 1;
                month = ("0" + month).slice(-2);
                var year = today.getFullYear();
                var arr_calibdates = []
                for (let i = 0; i < arr.length; i++) {
                    var day = ("0" + arr[i]).slice(-2)
                    var date = '';
                    date = year + '-' + month + '-' + day;
                    if (todayDate >= date) {
                        arr_calibdates.push(date);
                    }
                }
                this.checkForFirstCalib(strBalId).then((result) => {
                    const tableName = result.tableName;
                    const fieldName = result.fieldName;
                    arr_calibdates.forEach((v) => {
                        // check if master table has entry or not in the very first calibration master table
                        var selectObj = {
                            str_tableName: tableName,
                            data: '*',
                            condition: [
                                { str_colName: fieldName, value: v, comp: 'gte' },
                            ]
                        }
                        database.select(selectObj).then(result => {
                            if (result[0].length == 0) {
                                this.pushCalibrationObj(strBalId, IDSSrNo);
                            }
                        })
                    })
                }).catch((err) => { });
            }
        }).catch(err => console.log(err))
    }
    // *********************************************************************************************************//
    async pushCalibrationObj(strBalId, IDSSrNo) {
        try {
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
            if (objOwner.owner == 'analytical') {
                var calibTable = 'tbl_calibration_status';
            } else {
                var calibTable = 'tbl_calibration_status_bin';
            }
            var selectCalibObj = {
                str_tableName: calibTable,
                data: '*',
                condition: [
                    { str_colName: 'BalID', value: strBalId, comp: 'eq' },
                ]
            }
            var result = await database.select(selectCalibObj)

            const tempObj = {
                P: result[0][0].P.readUIntLE(),
                E: result[0][0].E.readUIntLE(),
                R: result[0][0].R.readUIntLE(),
                U: result[0][0].U.readUIntLE(),
                L: result[0][0].L.readUIntLE(),
                V: result[0][0].V.readUIntLE()
            }
            var objFound = globalData.calibrationStatus.find(k => k.BalId == strBalId);
            if (objFound == undefined) {
                globalData.calibrationStatus.push({ BalId: strBalId, status: tempObj });
            } else {
                objFound.BalId = strBalId;
                objFound.status = tempObj;
            }
            return 0;
        } catch (err) {
            throw new Error(err);
        }
    }
    async checkForFirstCalib(strBalId) {
        var sortedArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
        var calibType = sortedArray[0];
        switch (calibType) {
            case 'P':
                var tempObj = {
                    tableName: 'tbl_calibration_periodic_master',
                    fieldName: 'Periodic_CalbDate'
                }
                return tempObj;
                next();
                break;
            case 'R':
                var tempObj = {
                    tableName: 'tbl_calibration_repetability_master',
                    fieldName: 'Repet_CalbDate'
                }
                return tempObj;
                next();
                break;
            case 'E':
                var tempObj = {
                    tableName: 'tbl_calibration_eccentricity_master',
                    fieldName: 'Eccent_CalbDate'
                }
                return tempObj;
                next();
                break;
            case 'U':
                var tempObj = {
                    tableName: 'tbl_calibration_uncertinity_master',
                    fieldName: 'Uncertinity_CalbDate'
                }
                return tempObj;
                next();
                break;
            case 'L':
                var tempObj = {
                    tableName: 'tbl_calibration_linearity_master',
                    fieldName: 'Linear_CalbDate'
                }
                return tempObj;
                next();
                break;
        }
    }
    getMenuList() {
        return new Promise((resolve, reject) => {
            var selectMenuList = {
                str_tableName: 'tbl_menulist',
                data: '*',
            }
            database.select(selectMenuList).then(result => {
                resolve(result[0])
            }).catch(err => {
                reject(err)
            })
        })
    }
    //********************************************************************************** */
    getCommunicationStatus() {
        return new Promise((resolve, reject) => {
            let tempArray = [];
            this.getIds().then(result => {
                result.forEach(e => {
                    var obj = {
                        cubicleNo: e.Sys_CubicNo,
                        IdsNo: e.Sys_IDSNo,
                        QCount: 25
                    }
                    if (e.Sys_IDSNo != 0) {
                        tempArray.push(obj);
                    }

                })
                resolve(tempArray);
            })
        })
    }
    //***************************************************************************************** */
    getBalanceCalibDetails(IDSSrNo) {
        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
        if (objOwner.owner == 'analytical') {
            var strBalId = tempCubicInfo.Sys_BalID;
        } else {
            var strBalId = tempCubicInfo.Sys_BinBalID;
        }
        // FOR PERIODIC
        var todayDate = moment().format('YYYY-MM-DD');
        const selectBalCaliData = {
            str_tableName: 'tbl_calibration_periodic_master',
            data: '*',
            condition: [
                { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' },
                { str_colName: 'Periodic_CalbDate', value: todayDate, comp: 'eq' }
            ]
        }
        var tempObj = globalData.arrBalCaibDet.find(k => k.strBalId == strBalId);
        database.select(selectBalCaliData).then(response => {
            if (response[0].length > 0) {
                if (tempObj == undefined) {
                    globalData.arrBalCaibDet.push({
                        strBalId: strBalId,
                        isPeriodicDone: true,
                    })
                } else {
                    tempObj.isPeriodicDone = true;
                }
            } else {
                if (tempObj == undefined) {
                    globalData.arrBalCaibDet.push({
                        strBalId: strBalId,
                        isPeriodicDone: false,
                    })
                } else {
                    tempObj.isPeriodicDone = false;
                }
            }
        })
    }

    getBatchTime() {
        return new Promise((resolve, reject) => {
            database.execute(`SELECT * FROM tbl_batches where status in ('S','R') `).then(result => {
                resolve(result[0])
            }).catch(err => {
                // console.log(err)
                reject('Reject Promise while creating select query');
            })
        })
    }


    getAlertInfo() {
        return new Promise((resolve, reject) => {
            const objAlert = {
                str_tableName: 'tbl_alert_param_duration',
                data: '*',
            }

            database.select(objAlert).then(res => {
                resolve(res[0]);
            }).catch(error => {
                reject(error)
            })
        })
    }

    async AlertObject(objTime, objAlertInfo) {


        for (const value of objTime) {
            const alertObject = {
                intCubicleNo: "",
                strBatch: "",
                intGroupParam: "",
                AlertTime: "",
                IDSNO: ""
            }
            alertObject.intCubicleNo = value.CubicNo;
            alertObject.strBatch = value.Batch;
            alertObject.AlertTime = value.tm;

            var AlertParam = objAlertInfo.filter(k => k.CubicNo == alertObject.intCubicleNo);
            var CubicParam = globalData.arrIdsInfo.filter(k => k.Sys_CubicNo == alertObject.intCubicleNo);
            alertObject.intGroupParam = AlertParam[0].Group;
            alertObject.IDSNO = CubicParam[0].Sys_IDSNo;
            // here we will check if product set to cubicle has group weighment or not
            if (CubicParam != undefined) {
                if (CubicParam[0].Sys_CubType != 'Granulation') {
                    const Product = implement(IProduct)({
                        ProductId: CubicParam[0].Sys_BFGCode,
                        ProductName: CubicParam[0].Sys_ProductName,
                        ProductVersion: CubicParam[0].Sys_PVersion,
                        Version: CubicParam[0].Sys_Version,
                    })
                    //check in product master wheather group alowed or not
                    let tableName;
                    if (CubicParam[0].Sys_CubType == 'Compression') {
                        tableName = 'tbl_product_tablet';
                    } else if (CubicParam[0].Sys_CubType == 'Coating') {
                        tableName = 'tbl_product_capsule';
                    }
                    if (tableName != undefined) {
                        let selectObj = {
                            str_tableName: tableName,
                            data: '*',
                            condition: [
                                { str_colName: 'ProductId', value: Product.ProductId },
                                { str_colName: 'ProductName', value: Product.ProductName },
                                { str_colName: 'ProductVersion', value: Product.ProductVersion },
                                { str_colName: 'Version', value: Product.Version },
                            ]
                        }
                        let response = await database.select(selectObj);
                        if (response[0].length > 0) {
                            if ((response[0][0].Param2_Nom != 99999 && AlertParam[0].Group != 0) && CubicParam[0].Sys_RptType == 0) {
                                globalData.alertArr.push(alertObject);
                            }
                        }
                    }
                }
            }
        }

        return 'Success'

    }

    async prepareAlertObject() {
        const objTime = await this.getBatchTime();
        const objAlertInfo = await this.getAlertInfo();
        const alertObject = await this.AlertObject(objTime, objAlertInfo);
    }

    fillAlertCalibration(IdsNo) {
        // Checkin if Already present
        var found = globalData.arr_FlagCallibWeighment.some(function (el) {
            return el.idsNo == IdsNo;
        });
        // Otherwise push it in array
        if (!found) {
            globalData.arr_FlagCallibWeighment.push({
                idsNo: IdsNo,
                alertFlag: false
            });
        }
        // console.log(globalData.arr_FlagCallibWeighment)
    }
    async checkForRights(IdsIp, strUserId) {
        var arr_rights = [];
        let selectRole = {
            str_tableName: 'tbl_users',
            data: 'Role',
            condition: [
                { str_colName: 'UserID', value: strUserId }
            ]
        }
        let roleResult = await database.select(selectRole);
        let roleName = roleResult[0][0].Role;
        // For role Rights
        let selectRights = {
            str_tableName: 'tbl_role',
            data: 'role_rights',
            condition: [
                { str_colName: 'role_name', value: roleName },
                { str_colName: 'locked', value: 0 }
            ]
        }
        let roleRights = await database.select(selectRights);
        arr_rights = arr_rights.concat(roleRights[0]).map(k => k.role_rights);
        // For special rights
        let selectSpecialRights = {
            str_tableName: 'tbl_rights_special',
            data: 'spl_right',
            condition: [
                { str_colName: 'userid', value: strUserId },
            ]
        }
        let specialRights = await database.select(selectSpecialRights);
        let tempSplArr = specialRights[0].map(k => k.spl_right)
        arr_rights = arr_rights.concat(tempSplArr);
        // For remove rights
        let selectRemoveRights = {
            str_tableName: 'tbl_rights_removed',
            data: 'removed_right',
            condition: [
                { str_colName: 'userid', value: strUserId },
            ]
        }
        let removeRights = await database.select(selectRemoveRights);
        let tempRmvArr = removeRights[0].map(k => k.removed_right)
        arr_rights = arr_rights.filter(
            item => tempRmvArr.indexOf(item) < 0
        );
        let tempRightObj = globalData.arrUserRights.find(t => t.idsNo == IdsIp);
        if (tempRightObj == undefined) {
            globalData.arrUserRights.push({
                idsNo: IdsIp,
                rights: arr_rights
            })
        } else {
            tempRightObj.rights = arr_rights;
        }
        return 1;
    }

    async checkBalanceInStatus_Re_tables(BalID, IdsIp) {
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsIp);
        if (objOwner.owner == 'analytical') {
            var recalliTable = `tbl_recalibration_balance_status`;
            var calibTable = 'tbl_calibration_status';
        } else {
            var recalliTable = `tbl_recalibration_balance_status_bin`;
            var calibTable = 'tbl_calibration_status_bin';
        }
        const objCalibration_Status = {
            str_tableName: calibTable,
            data: '*',
            condition: [
                { str_colName: 'BalID', value: BalID }
            ]
        }

        var result_Status = await database.select(objCalibration_Status);

        const objReCalibration_Status = {
            str_tableName: recalliTable,
            data: '*',
            condition: [
                { str_colName: 'Bal_ID', value: BalID }
            ]
        }

        var result_ReCalibStatus = await database.select(objReCalibration_Status);

        if (result_Status[0].length == 0 || result_ReCalibStatus.length == 0) {
            return true
        }
        else {
            return false
        }

    }
    async checkForPeriodicDue(idsNo) {
        // fetching balance detail10 g

        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(idsNo));
        var strBalId = tempCubicInfo.Sys_BalID;
        if (objOwner.owner == 'analytical') {
            var strBalId = tempCubicInfo.Sys_BalID;
        } else {
            var strBalId = tempCubicInfo.Sys_BinBalID;

        }
        // var strBalId = tempCubicInfo.Sys_BalID;


        let selectBalObj = {
            str_tableName: 'tbl_balance',
            data: '*',
            condition: [
                { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' }
            ]
        }
        let res = await database.select(selectBalObj);
        if (res[0].length > 0) {
            const bln_storeType = res[0][0].Bal_CalbStoreType.readUIntLE();
            var today = new Date();
            var month = today.getMonth() + 1;
            var year = today.getFullYear();
            if (bln_storeType == 1) // set days
            {
                var todayDate = moment().format('YYYY-MM-DD');
                var calibDate = res[0][0].Bal_CalbDueDt;
                calibDate = date1.format(calibDate, 'YYYY-MM-DD');

                var strMsgReminderdate = res[0][0].Bal_CalbDueDt;
                strMsgReminderdate = date1.format(strMsgReminderdate, 'DD/MM/YYYY');

                var reminder = res[0][0].Bal_CalbReminder;
                var d = new Date(calibDate); // d-> remDate
                d.setDate(d.getDate() - reminder);
                d = date1.format(d, 'YYYY-MM-DD');
                console.log(d)
                if (todayDate >= calibDate) {
                    return 'CR0';
                } else if (todayDate >= d) {
                    //strMsg = "Period Calb Due,After " & m_int_LeftDays & " days,Press ENT to Calib,ESC to Cont,"

                    if (serverConfig.ProjectName == "SunHalolGuj1") {
                        return `CM0Periodic Calibration,Due on ${strMsgReminderdate},Press ENT To Calib,ESC To Cont,,;`;
                    }
                    else {
                        return `CM0Periodic Calibration,Due on ${strMsgReminderdate},,,,;`;
                    }
                } else {
                    return 'CR0';
                }
                //if()

            } else {// set dates
                var arr = res[0][0].Bal_CalbDates.split(',');
                var today = new Date();
                var todayDate = moment().format('YYYY-MM-DD');
                var reminder = res[0][0].Bal_CalbReminder;
                var month = 0;

                var retResponse = "";
                for (let [i, day] of arr.entries()) {
                    var year = today.getFullYear();
                    if (day < 7) {
                        if ((day - reminder) <= 0) {
                            month = today.getMonth() + 2;
                            if (month == 13) {
                                month = 1;
                                year = year + 1
                            }
                        } else {
                            month = today.getMonth() + 1; // Current Month
                        }
                    } else {
                        month = today.getMonth() + 1; // Current Month
                    }

                    month = ("0" + month).slice(-2);
                    var date = ("0" + day).slice(-2)
                    var calibDate = '';
                    var calibDate1 = '';
                    var strMsgReminderdate = '';
                    calibDate = year + '-' + month + '-' + date;
                    calibDate1 = date + '.' + month + '.' + year;
                    strMsgReminderdate = date + '/' + month + '/' + year;
                    var d = new Date(calibDate); // d-> remDate
                    d.setDate(d.getDate() - reminder);
                    d = date1.format(d, 'YYYY-MM-DD');
                    // console.log(calibDate, d)
                    if (todayDate >= calibDate) {
                        retResponse = 'CR0';
                    } else if (todayDate >= d) {

                        if (serverConfig.ProjectName == "SunHalolGuj1") {
                            retResponse = `CM0Periodic Calibration,Due on ${strMsgReminderdate},Press ENT To Calib,ESC To Cont,,;`;
                        }
                        else {
                            retResponse = `CM0Periodic Calibration,Due on ${strMsgReminderdate},,,,;`;
                        }


                    } else {
                        retResponse = 'CR0';
                    }
                    if (retResponse == 'CR0' && (arr.length - 1) == i) {
                        return retResponse;
                    } else if (retResponse != 'CR0') {
                        return retResponse;
                    }

                }
                // return retResponse;
            }
        }
    }
    async checkForPeriodicDueVernier(idsNo) {
        // fetching balance detail10 g

        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(idsNo));
        var strVerId = tempCubicInfo.Sys_VernierID;
        // var strBalId = tempCubicInfo.Sys_BalID;


        let selectVerObj = {
            str_tableName: 'tbl_vernier',
            data: '*',
            condition: [
                { str_colName: 'VernierID', value: strVerId, comp: 'eq' }
            ]
        }
        let res = await database.select(selectVerObj);
        if (res[0].length > 0) {
            const bln_storeType = res[0][0].CalibStoreType.readUIntLE();
            var today = new Date();
            var month = today.getMonth() + 1;
            var year = today.getFullYear();
            var tempCailibType = globalData.arrVernierCalCMFlag.find(k => k.idsNo == parseInt(idsNo));
            if (tempCailibType == undefined) {
                globalData.arrVernierCalCMFlag.push({ idsNo: idsNo, blnDone: true });
            } else {
                tempCailibType.blnDone = true;
            }
            if (bln_storeType == 1) // set days
            {
                var todayDate = moment().format('YYYY-MM-DD');
                var calibDate = res[0][0].CalDueDT;
                calibDate = date1.format(calibDate, 'YYYY-MM-DD');

                var strMsgReminderdate = res[0][0].CalDueDT;
                strMsgReminderdate = date1.format(strMsgReminderdate, 'DD/MM/YYYY');

                var reminder = res[0][0].CalReminder;
                var d = new Date(calibDate); // d-> remDate
                d.setDate(d.getDate() - reminder);
                d = date1.format(d, 'YYYY-MM-DD');
                console.log(d)
                if (todayDate >= calibDate) {
                    return 'CR0';
                } else if (todayDate >= d) {
                    //strMsg = "Period Calb Due,After " & m_int_LeftDays & " days,Press ENT to Calib,ESC to Cont,"
                    return `CM0Vernier Calibration,Due on ${strMsgReminderdate},,,,;`;
                } else {
                    return 'CR0';
                }
                //if()

            } else {// set dates
                var arr = res[0][0].Caldates.split(',');
                var today = new Date();
                var todayDate = moment().format('YYYY-MM-DD');
                var reminder = res[0][0].CalReminder;
                var month = 0;

                var retResponse = "";
                for (let [i, day] of arr.entries()) {
                    var year = today.getFullYear();
                    if (day < 7) {
                        if ((day - reminder) <= 0) {
                            month = today.getMonth() + 2;
                            if (month == 13) {
                                month = 1;
                                year = year + 1
                            }
                        } else {
                            month = today.getMonth() + 1; // Current Month
                        }
                    } else {
                        month = today.getMonth() + 1; // Current Month
                    }

                    month = ("0" + month).slice(-2);
                    var date = ("0" + day).slice(-2)
                    var calibDate = '';
                    var calibDate1 = '';
                    var strMsgReminderdate = '';
                    calibDate = year + '-' + month + '-' + date;
                    calibDate1 = date + '.' + month + '.' + year;
                    strMsgReminderdate = date + '/' + month + '/' + year;
                    var d = new Date(calibDate); // d-> remDate
                    d.setDate(d.getDate() - reminder);
                    d = date1.format(d, 'YYYY-MM-DD');
                    // console.log(calibDate, d)
                    if (todayDate >= calibDate) {
                        retResponse = 'CR0';
                    } else if (todayDate >= d) {

                        if (serverConfig.ProjectName == "SunHalolGuj1") {
                            retResponse = `CM0Periodic Calibration,Due on ${strMsgReminderdate},Press ENT To Calib,ESC To Cont,,;`;
                        }
                        else {
                            retResponse = `CM0Periodic Calibration,Due on ${strMsgReminderdate},,,,;`;
                        }


                    } else {
                        retResponse = 'CR0';
                    }
                    if (retResponse == 'CR0' && (arr.length - 1) == i) {
                        return retResponse;
                    } else if (retResponse != 'CR0') {
                        return retResponse;
                    }

                }
                // return retResponse;
            }
        }
    }
    async getNominclatureInfo() {
        try {

            var objNominclature = {
                str_tableName: 'tbl_nomenclature',
                data: '*'
            }

            var resNomClature = await database.select(objNominclature);

            return resNomClature[0][0];
        } catch (error) {
            return error;
        }
    }
    async checkFriabilityStatus(IdsNo) {
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
        var selectedIds;
        var returnResult = {};
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = IdsNo;
        }
        var tempCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        const checkData = {
            str_tableName: 'tbl_tab_friability',
            data: 'MAX(RepSerNo) AS SeqNo',
            condition: [
                { str_colName: 'BFGCode', value: tempCubic.Sys_BFGCode, comp: 'eq' },
                { str_colName: 'ProductName', value: tempCubic.Sys_ProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: tempCubic.Sys_PVersion, comp: 'eq' },
                { str_colName: 'Version', value: tempCubic.Sys_Version, comp: 'eq' },
                { str_colName: 'BatchNo', value: tempCubic.Sys_Batch, comp: 'eq' },
                { str_colName: 'IdsNo', value: selectedIds, comp: 'eq' },
            ]
        }
        var checkFlag = 0;
        var chkResult = await database.select(checkData);
        var result = [];
        if (chkResult[0][0].SeqNo == null) {
            checkFlag = 0;
        } else {
            checkFlag = 1;
        }
        if (checkFlag == 1) {
            var fraibData = {
                str_tableName: 'tbl_tab_friability',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: chkResult[0][0].SeqNo, comp: 'eq' },
                ]
            }
            result = await database.select(fraibData);
            result = result[0]
        }
        if (result.length > 0) {
            if (tempCubic.Sys_RotaryType == 'Double') {
                if (result[0].LWtBeforeTest != 0 && result[0].LWtAfterTest != 0
                    && result[0].RWtBeforeTest != 0 && result[0].RWtAfterTest != 0) {
                    Object.assign(returnResult, { status: 'before', sqNo: result[0].RepSerNo })

                } else if (result[0].LWtBeforeTest != 0 && result[0].LWtAfterTest == 0
                    && result[0].RWtBeforeTest != 0 && result[0].RWtAfterTest == 0) {
                    Object.assign(returnResult, { status: 'after', sqNo: result[0].RepSerNo })


                } else if (result[0].LWtBeforeTest == 0 && result[0].LWtAfterTest == 0
                    && result[0].RWtBeforeTest == 0 && result[0].RWtAfterTest == 0) {
                    Object.assign(returnResult, { status: 'before', sqNo: result[0].RepSerNo })

                }
            } else {
                if (result[0].NWtBeforeTest != 0 && result[0].NWtAfterTest != 0) {
                    Object.assign(returnResult, { status: 'before', sqNo: result[0].RepSerNo })

                } else if (result[0].NWtBeforeTest != 0 && result[0].NWtAfterTest == 0) {
                    Object.assign(returnResult, { status: 'after', sqNo: result[0].RepSerNo })

                } else if (result[0].NWtBeforeTest == 0 && result[0].NWtAfterTest == 0) {
                    Object.assign(returnResult, { status: 'before', sqNo: result[0].RepSerNo })

                }
            }
        } else {
            Object.assign(returnResult, { status: 'before', sqNo: 0 })

        }
        return returnResult;
    }
    async updateFriabilityTime(IdsNo, tempLimits) {
        try {
            // Fetching global array for Fraibitlity
            var selectedIds;
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            let COUNT = parseFloat(tempLimits.Friability.T1Neg);
            let RPM = parseFloat(tempLimits.Friability.T1Pos);
            let SECONDS = (COUNT / RPM) * 60
            var tempOBJ = globalData.arrFriabilityMenuVisibility.find(k => k.idsNo == selectedIds);
            tempOBJ.ETS = SECONDS;
            // console.log(globalData.arrFriabilityMenuVisibility)
        } catch (err) {
            console.log(err);
            return err
        }
    }
    // *****************************************************************************************************8//
    // Below function gets all password complexity from   tbl_pwd_complexity
    //****************************************************************************************************** */
    getpwdComplexity() {
        return new Promise((resolve, reject) => {
            var selectParamObj = {
                str_tableName: 'tbl_pwd_complexity',
                data: '*',
            }
            database.select(selectParamObj).then(result => {
                resolve(result[0])
            }
            ).catch(err => { console.log(err) })
        });
    }
    /**
     * 
     * @param {*} idsNo 
     * @author Pradip Shinde
     * @description Function check if given cubicle has vernier or not also and if vernier is present then if
     *  it has calaibration or not 
     */
    async checkVernierCalibration(idsNo) {
        var cubicObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
        var vernierId = cubicObj.Sys_VernierID;
        var calibPId = '3';// 3 for vernier caalibration
        if (vernierId != 'None' && cubicObj.Sys_Port2 == 'Vernier') {
            var arrVernierRecalibration = globalData.arrVernierRecalibration.find(k => k.Ver_ID == vernierId);
            // checking vernier calibration
            var selectVernierObj = {
                str_tableName: 'tbl_vernier',
                data: '*',
                condition: [
                    { str_colName: 'VernierID', value: vernierId }
                ]
            }
            let vernierMasterresult = await database.select(selectVernierObj);
            if (vernierMasterresult[0].length > 0) {
                if (vernierMasterresult[0][0].Ver_IsCalib) {
                    var PrecalibrationStatus = await clsPreWeighmentChecks.VerifyPreCalibrationVernier(idsNo);
                    if (PrecalibrationStatus != "Valid PreCalibration,") {
                        var strReturnData = "ID3 " + PrecalibrationStatus + ",,,";
                        return strReturnData;
                    } else {
                        // check if to day is periodic calibration for vernier
                        var blnTodayPeriodicCalibration = await sort.checkIfTodayIsPeriodicCalibVernier(idsNo);
                        if (blnTodayPeriodicCalibration) {
                            var systemDate = new Date();
                            var systemHours = systemDate.getHours();
                            if (systemHours >= 7) {
                                let TempCalibType = globalData.arrcalibType.find((k) => k.idsNo == idsNo);
                                if (TempCalibType != undefined) {
                                    TempCalibType.calibType = "vernierPeriodic";
                                } else {
                                    globalData.arrcalibType.push({ idsNo: idsNo, calibType: "vernierPeriodic" });
                                }
                                //logFromPC.addtoProtocolLog('Calibration Cause:Normal Routine')
                                //if (serverConfig.ProjectName == 'MLVeer') {
                                // return `CR${calibPId}0Vernier,Calibration Pending,,,`;
                                //}
                                //else {
                                return `CR${calibPId}1Vernier,Calibration Pending,,,`;
                                // }
                            } else {
                                // Skip
                                return `CR0`;
                            }

                        } else if (arrVernierRecalibration.PeriodicVerRecalib == 1) {
                            let TempCalibType = globalData.arrcalibType.find((k) => k.idsNo == idsNo);
                            if (TempCalibType != undefined) {
                                TempCalibType.calibType = "vernierPeriodic";
                            } else {
                                globalData.arrcalibType.push({ idsNo: idsNo, calibType: "vernierPeriodic" });
                            }
                            //logFromPC.addtoProtocolLog('Calibration Cause:Normal Routine')
                            //if (serverConfig.ProjectName == 'MLVeer') {
                            //    return `CR${calibPId}0Vernier,Calibration Pending,,,`;
                            // }
                            //else {
                            return `CR${calibPId}1Vernier,Calibration Pending,,,`;
                            //}

                        } else {
                            //return 'CR0';
                            var return_protocol = await this.checkForPeriodicDueVernier(idsNo);
                            return return_protocol;
                        }
                    }
                } else {
                    //if nocalib vernier
                    return 'CR0';
                }
            } else {
                // If no data is present in tbl_vernier
                return 'CR0';
            }
        } else {
            // if no vernier Id and no Port2 == Vernier
            return 'CR0';
        }
    }
    /**
     * 
     * @param {*} IdsNo 
     * @description This function checks if Left side has machine speed captured or not if yes then it will use this for 
     * Right side master entries(Microlabs Veersandra)
     * @author Pradip shinde
     * @date 28/10/2020
     */
    async checkMachineSpeedForLR(selectedIds) {
        try {
            var objCurrentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var productTypeObj = globalData.arrProductTypeArray.find(k => k.idsNo == selectedIds);
            var productType = '1';
            var str_tableName = 'tbl_tab_detail2';
            if (productTypeObj.productType == 1) {
                str_tableName = 'tbl_tab_detail2';
            } else {
                str_tableName = 'tbl_cap_detail2';
            }
            const checkMasterData = {
                str_tableName: str_tableName,
                data: 'MAX(RecNo) AS RecNo',
                condition: [
                    { str_colName: 'BFGCode', value: objCurrentCubicle.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'PVersion', value: objCurrentCubicle.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: objCurrentCubicle.Sys_Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: objCurrentCubicle.Sys_Batch, comp: 'eq' },
                    { str_colName: 'Side', value: 'LHS', comp: 'eq' },
                ]
            }
            var result = await database.select(checkMasterData);
            if (result[0].length == 0) {
                return 0;
            } else {
                // selecting 
                var RecSeqNo = result[0][0].RecNo;
                const selectData = {
                    str_tableName: 'tbl_tab_detail2',
                    data: '*',
                    condition: [
                        { str_colName: 'RecNo', value: RecSeqNo }
                    ]
                }
                var selectMCSpeed = await database.select(selectData);
                return parseInt(selectMCSpeed[0][0].MachineSpeed);
            }

        } catch (err) {
            throw new Error(err);
        }
    }
    /**
     * 
     * @param {*} idsNo 
     * @description Function will reset yesterdays recalibration flag after 7 am on next day 
     */
    async resetRecalibration(idsNo) {
        try {
            var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            var systemDate = new Date();
            var systemHours = systemDate.getHours();
            var balance = tempCubicInfo.Sys_BalID;
            var vernier = tempCubicInfo.Sys_VernierID;
            var binBalance = tempCubicInfo.Sys_BinBalID;
            // for Balance
            if (balance != 'None') {
                var DailyDate = null;
                var PeriodicDate = null;
                var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == balance);
                if (BalanceRecalibStatusObject.RecalibSetDt_daily != null) {
                    DailyDate = BalanceRecalibStatusObject.RecalibSetDt_daily.toFormat('YYYY-MM-DD');
                    var todayDate = moment().format('YYYY-MM-DD');
                    if ((DailyDate < todayDate) && systemHours >= 7) {
                        BalanceRecalibStatusObject.RecalibSetDt_daily = null;
                        BalanceRecalibStatusObject.DailyBalRecalib = 0;
                        // settting 0 to table
                        var objUpdate = {
                            str_tableName: 'tbl_recalibration_balance_status',
                            data: [{ str_colName: 'DailyBalRecalib', value: 0 },
                            { str_colName: 'RecalibSetDt_daily', value: null }],
                            condition: [{ str_colName: 'Bal_ID', value: balance }]
                        }
                        await database.update(objUpdate);
                    }
                }
                if(BalanceRecalibStatusObject.RecalibSetDt_periodic != null) {
                    PeriodicDate = BalanceRecalibStatusObject.RecalibSetDt_periodic.toFormat('YYYY-MM-DD');
                    var todayDate = moment().format('YYYY-MM-DD');
                    if((PeriodicDate < todayDate) && systemHours >= 7){
                        BalanceRecalibStatusObject.RecalibSetDt_periodic = null;
                        BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                        // settting 0 to table
                        var objUpdate = {
                            str_tableName:'tbl_recalibration_balance_status',
                            data:[{str_colName:'PeriodicBalRecalib', value:0},
                            {str_colName:'RecalibSetDt_periodic', value:null}],
                            condition: [{str_colName:'Bal_ID', value:balance}]
                        }
                        await database.update(objUpdate);
                    }
                }
            }
            if (binBalance != 'None') {
                var DailyDate = null;
                var PeriodicDate = null;
                var BinBalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == binBalance);
                if (BinBalanceRecalibStatusObject.RecalibSetDt_daily != null) {
                    DailyDate = BinBalanceRecalibStatusObject.RecalibSetDt_daily.toFormat('YYYY-MM-DD');
                    var todayDate = moment().format('YYYY-MM-DD');
                    if ((DailyDate < todayDate) && systemHours >= 7) {
                        BinBalanceRecalibStatusObject.RecalibSetDt_daily = null;
                        BinBalanceRecalibStatusObject.DailyBalRecalib = 0;
                        // settting 0 to table
                        var objUpdate = {
                            str_tableName: 'tbl_recalibration_balance_status_bin',
                            data: [{ str_colName: 'DailyBalRecalib', value: 0 },
                            { str_colName: 'RecalibSetDt_daily', value: null }],
                            condition: [{ str_colName: 'Bal_ID', value: balance }]
                        }
                        await database.update(objUpdate);
                    }
                }
                   if(BinBalanceRecalibStatusObject.RecalibSetDt_periodic != null) {
                       PeriodicDate = BinBalanceRecalibStatusObject.RecalibSetDt_periodic.toFormat('YYYY-MM-DD');
                       var todayDate = moment().format('YYYY-MM-DD');
                       if((PeriodicDate < todayDate) && systemHours >= 7){
                        BinBalanceRecalibStatusObject.RecalibSetDt_periodic = null;
                        BinBalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                           // settting 0 to table
                           var objUpdate = {
                               str_tableName:'tbl_recalibration_balance_status_bin',
                               data:[{str_colName:'PeriodicBalRecalib', value:0},
                               {str_colName:'RecalibSetDt_periodic', value:null}],
                               condition: [{str_colName:'Bal_ID', value:balance}]
                           }
                           await database.update(objUpdate);
                       }
                   }
            }
            if (vernier != 'None') {
                var DailyDate = null;
                var PeriodicDate = null;
                var vernierData = globalData.arrVernier
                var vernierRecalibStatusObject = globalData.arrVernierRecalibration.find(k=>k.Ver_ID == vernier);
                if(vernierRecalibStatusObject!= undefined){
                if(vernierRecalibStatusObject.RecalibSetDt_periodic != null) {
                    PeriodicDate = vernierRecalibStatusObject.RecalibSetDt_periodic.toFormat('YYYY-MM-DD');
                    var todayDate = moment().format('YYYY-MM-DD');
                    if((PeriodicDate < todayDate) && systemHours >= 7){
                        vernierRecalibStatusObject.RecalibSetDt_periodic = null;
                        vernierRecalibStatusObject.PeriodicVerRecalib = 0;
                        // settting 0 to table
                        var objUpdate = {
                            str_tableName:'tbl_recalibration_vernier_status',
                            data:[{str_colName:'PeriodicVerRecalib', value:0},
                            {str_colName:'RecalibSetDt_periodic', value:null}],
                            condition: [{str_colName:'Ver_ID', value:vernier}]
                        }
                        await database.update(objUpdate);
                    }
                }
            }
            }
            return 0;
        } catch (err) {
            throw new Error(err);
        }
    }

    async getBinSettingData() {
        try {
            var selectIdsObj = {
                str_tableName: 'tbl_cubicle_bin_setting',
                data: '*',
            }
            var res = await database.select(selectIdsObj);
            return res[0];
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }

    }
}
/**
 * CLASS ENDS
 */
module.exports = FetchDetails