const request = require('request');
const serverConfig = require('../global/severConfig');
const globalData = require('../global/globalData');
const FetchDetail = require('../model/clsFetchDetails');
const Database = require('../database/clsQueryProcess');
const clsActivityLog = require('../model/clsActivityLogModel');
var PreWeighmentCheck = require('../model/clsPreWeighmentChecks');
const Comman = require('../model/Calibration/clsCommonFunction');
var clsArrayInit = require('../model/clsArrayInitialize');
const FormulaFun = require('../model/Product/clsformulaFun');
const formulaFun = new FormulaFun();
const date = require('date-and-time');

const clsIncompleteUpdation = require('../model/clsIncompleteRemark');
const objIncompleteUpdation = new clsIncompleteUpdation();

const comman = new Comman();
var objPreWeighmentCheck = new PreWeighmentCheck();

const database = new Database();
const fetchDetails = new FetchDetail();
const objActivityLog = new clsActivityLog();
var objArrayInit = new clsArrayInit();



class LoginModal {

    //this will validate user and will return an array of that user.
    validateUser(strUserId, strPassword, IdsIp, str_IpAddress) {
        return new Promise((resolve, reject) => {
            var strReturnData = "";
            var obj = {
                userId: strUserId,
                userPass: strPassword,
                source: "IDS",
                ip: str_IpAddress
            }
            var objpwdComplex = globalData.arrsPwdComplexity;
            // var pwdComplexity = formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_Length, 2) + formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_Alphabate, 2) + formulaFun.FormatNumberNOS(0, 2) + formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_Digit, 2) + formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_SpecialChr, 2);
            // change by Pradip on 03/10/2020 as format i standard hex 
            // 0601010101 06->length,01->minimum Cap,01->minimum small ,01->digit, 01->special
            var pwdComplexity = formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_Length, 2) + formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_Alphabate, 2) + '00' + formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_Digit, 2) + formulaFun.FormatNumberNOS(objpwdComplex[0].Pwd_SpecialChr, 2);
            if (strUserId == "" || strPassword == "") {
                resolve("ID0U");
            } else {
                request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/login/loginMain`, { json: obj }, (err, res, body) => {
                    if (body != undefined) {
                        if (body.status == 'success') {
                            // check if uid and upass present or not
                            var tmpUserobj = globalData.arrUsers.find(k => k.IdsNo == IdsIp);
                            if (tmpUserobj == undefined) {
                                globalData.arrUsers.push({
                                    IdsNo: IdsIp,
                                    UserId: strUserId,
                                    UserName: body.userName,
                                    UserPass: strPassword,
                                    ForceLogin: false
                                });
                            } else {
                                tmpUserobj.UserId = strUserId;
                                tmpUserobj.UserName = body.userName;
                                tmpUserobj.UserPass = strPassword;
                                // tmpUserobj.ForceLogin = false;
                            }
                            var tmpUserobj = globalData.arrUsers.find(k => k.IdsNo == IdsIp);


                            if (typeof body.result != 'object' && tmpUserobj.ForceLogin == false) {

                                if (body.result == 'Incorrect Credentials' && body.userName == undefined) {
                                    resolve("ID0U");
                                }
                                else if (body.result == 'Incorrect Credentials' && body.userName != undefined) {
                                    //let now = new Date();
                                    //database.execute(`insert into tbl_audit_unauthorized_user(dt,tm,userId,username,host) values ('${date.format(now, 'YYYY-MM-DD')}','${date.format(now, 'HH:mm:ss')}','${strUserId}','NA','${str_IpAddress}')`)
                                    resolve("ID0U");
                                } else if (body.result.includes('User is Locked for')) {
                                    resolve(`ID2 User Locked for, ${body.result.split(" ")[4]} seconds,,`);//
                                } else if (body.result == 'User Already Active On IDS') {
                                    resolve('ID2 User Already Active, on IDS,,,');//
                                } else if (body.result == 'User Already Active On Software') {
                                    resolve('ID2 User Already Active, on Software,,');//
                                } else if (body.result == 'User Locked, Please contact Admin') {
                                    resolve('ID2 User Locked, Contact ADMIN,,');//
                                } else if (body.result == 'User Temporary Disabled, Contact Admin') {
                                    //resolve('ID2 USER TEMPORARY, DISABLED CONTACT, ADMIN,');//
                                    resolve('ID2 User Disabled,Contact Authorized,Person,');//
                                } else if (body.result == 'User Permanent Disabled, Contact Admin') {
                                    //resolve('ID2 USER PERMANENT, DISABLED CONTACT, ADMIN,');//
                                    resolve('ID2 User Disabled,Contact Authorized,Person,');//
                                } else if (body.result == 'User Auto Disabled, Change Password') {
                                    resolve(`ID5000,${pwdComplexity},User Auto, Disabled Change pwd,`);//
                                } else if (body.result == 'User Locked, Please contact Admin') {
                                    // resolve('ID2 User Locked PLS, Contact ADMIN,,');
                                    resolve('ID2 User Locked, Contact Authorized Person');
                                } else if (body.result == 'Suspicious Activity Found, Contact Admin') {
                                    //resolve('ID2 SUSPICIOUS ACTIVITY, FOUND PLS CONTACT, ADMIN, ');//
                                    resolve('ID2 Auto Enable Chances,Exhausted Contact,Authorized Person,');//
                                } else if (body.result == 'Password Expired, Please Change Your Password') {
                                    //resolve(`ID5${pwdComplexity} PASSWORD EXPIRED, PLS CHANGE YOUR, PWD,`);
                                    resolve(`ID5000,${pwdComplexity},Password Expired,,`);
                                } else if (body.result == 'Please Change Your Password') {
                                    //resolve(`ID5${pwdComplexity} PASSWORD EXPIRED, PLS CHANGE YOUR, PWD,`);
                                    resolve(`ID5000,${pwdComplexity},Change Password,,`);
                                } else if (body.result.includes('Your Password Expire in')) {
                                    // resolve("ID4" + ('000' + (body.result.split(" ")[4])).slice(-3) + ',' + pwdComplexity + ',,');
                                    resolve(`ID4000,${pwdComplexity},Password Expires in ,${(body.result.split(" ")[4]).slice(-3)} Days,`)
                                } else {
                                    resolve("ID0U");
                                }
                            }
                            else {
                                objArrayInit.InitializeArrays().then(res => {
                                    if (res == "Success") {
                                        /**********
                                         * Setting here owner for PreWeighment checks
                                         */
                                        var tempCubicInfo = globalData.arrIdsInfo.find(ids => ids.Sys_IDSNo == IdsIp);
                                        var owner = 'analytical'
                                        if (tempCubicInfo.Sys_CubType == 'IPC') {
                                            owner = 'IPC';
                                        } else {
                                            owner = 'analytical'
                                        }
                                        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsIp);
                                        if (objOwner == undefined) { globalData.arrPreWeighCalibOwner.push({ idsNo: IdsIp, owner: owner }) }
                                        else { objOwner.owner = owner }
                                        objPreWeighmentCheck.validatePreWeighmentActivites(IdsIp, false).then(PreWRes => {
                                            fetchDetails.checkForRights(IdsIp, strUserId);
                                            if (PreWRes != "Batch Started," && PreWRes != "Valid PreCalibration,") {
                                                strReturnData = "ID3 " + PreWRes + ",,,";
                                                resolve(strReturnData);
                                            }
                                            else {
                                                // check if uid and upass present or not
                                                var tmpUserobj = globalData.arrUsers.find(k => k.IdsNo == IdsIp);
                                                if (tmpUserobj == undefined) {
                                                    globalData.arrUsers.push({
                                                        IdsNo: IdsIp,
                                                        UserId: strUserId,
                                                        UserName: body.userName,
                                                        UserPass: strPassword,
                                                        ForceLogin: false
                                                    });
                                                } else {
                                                    tmpUserobj.UserId = strUserId;
                                                    tmpUserobj.UserName = body.userName;
                                                    tmpUserobj.UserPass = strPassword;
                                                    tmpUserobj.ForceLogin = false;
                                                }

                                                globalData.arrBulkDataFlag.push({
                                                    IdsNo: IdsIp,
                                                    "flgDTFlag": false,
                                                    "flgHTFlag": false
                                                })
                                                globalData.arrIntervalFlag.push({
                                                    IdsNo: IdsIp,
                                                    "flgFriabilityFlag": false,
                                                    drum1: false,
                                                    drum2: false,
                                                    IntervalRecived: false
                                                })
                                                globalData.arrLodFlag.push({
                                                    IdsNo: IdsIp,
                                                    "flgLodFlag": false,
                                                })
                                                strReturnData = "ID1U" + ('0000' + (globalData.arrsAllParameters[0].tbl_config_TimeoutPeriod * 60)).slice(-4) + ",,,";
                                                // strReturnData = "ID1U0360";
                                                var objUpdateLoginData = {
                                                    str_tableName: 'tbl_users',
                                                    data: [
                                                        { str_colName: 'active', value: 1 },
                                                        { str_colName: 'HostName', value: str_IpAddress },
                                                        { str_colName: 'source', value: 'IDS' }
                                                    ],
                                                    condition: [
                                                        { str_colName: 'UserID', value: strUserId }
                                                    ]
                                                }
                                                database.update(objUpdateLoginData);
                                                var objActivity = {};
                                                Object.assign(objActivity,
                                                    { strUserId: strUserId },
                                                    {
                                                        strUserName: body.userName //sarr_UserData[0].UserName 
                                                    },
                                                    { activity: 'Logged In On IDS ' + IdsIp })
                                                objActivityLog.ActivityLogEntry(objActivity);
                                                var tempCubicInfo = globalData.arrIdsInfo.find(ids => ids.Sys_IDSNo == IdsIp);
                                                var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsIp);
                                                var tempBalace = tempCubicInfo.Sys_BalID;
                                                if (objOwner.owner == 'analytical') {
                                                    tempBalace = tempCubicInfo.Sys_BalID;
                                                } else {
                                                    tempBalace = tempCubicInfo.Sys_BinBalID; // Bin Bal
                                                }
                                                if (tempBalace != 'None' &&
                                                    (tempCubicInfo.Sys_Port1 == 'Balance' || tempCubicInfo.Sys_Port2 == 'Balance' || tempCubicInfo.Sys_Port1 == 'IPC Balance'
                                                        || tempCubicInfo.Sys_Port3 == 'Balance' || tempCubicInfo.Sys_Port3 == 'IPC Balance')) {
                                                    fetchDetails.checkBalanceInStatus_Re_tables(tempBalace, IdsIp).then(result => {
                                                        if (result == false) {
                                                            fetchDetails.getCaibrationStatus(IdsIp);
                                                            fetchDetails.getBalanceCalibDetails(IdsIp);
                                                            fetchDetails.fillAlertCalibration(IdsIp);
                                                            resolve(strReturnData);
                                                        }
                                                        else {
                                                            strReturnData = "ID3 Set Balance ,Again,,"
                                                            resolve(strReturnData);
                                                        }
                                                    }).catch(err => {
                                                        console.log(err)
                                                    });
                                                } else {
                                                    fetchDetails.fillAlertCalibration(IdsIp);
                                                    resolve(strReturnData);
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        strReturnData = "ID3 Array Initialization Failed,,,,";
                                        resolve(strReturnData);
                                    }
                                });

                            }
                        }
                        // resolve("ID0U");
                    }
                });
            }
        })
    }

    validateUserLDAP(strUserId, strPassword, IdsIp, str_IpAddress) {
        return new Promise((resolve, reject) => {
            // console.log('userId, userPass', strUserId, strPassword);
            // checking if entered userId and Password are blank
            if (strUserId == "" || strPassword == "") {
                //  console.log('here');
                resolve("ID0U")
            }
            else {
                // if userId and UserPass are not blanks
                let LoginData = {
                    str_tableName: 'tbl_users',
                    data: '*',
                    condition: [
                        { str_colName: 'userid', value: strUserId },
                    ]
                }



                database.select(LoginData).then((LoginRes) => {
                    if (LoginRes[0].length > 0) {
                        if (LoginRes[0][0].realPassword == "VALIDATED") {
                            const objLDAP = { strUserName: LoginRes[0][0].UserName, strPassword: strPassword }

                            request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/ldap/validate`, { json: objLDAP }, (err, res, body) => {
                                if (res != undefined) {
                                    if (res.body.response != "Authenticated failed") {

                                        // strReturnData = "ID2 USER ALREADY LOGIN, ON " + sarr_UserData[0].source.toUpperCase() + ",,";
                                        // resolve(strReturnData);

                                        var strReturnData = "";
                                        var sarr_UserData = [];
                                        sarr_UserData = LoginRes[0]
                                        if (sarr_UserData[0].active == 1) {
                                            strReturnData = "ID2 User Already Active, on " + sarr_UserData[0].source + ",,";
                                            resolve(strReturnData);
                                        } else if (sarr_UserData[0].Status == 1) {
                                            //strReturnData = "ID2 USER, TEMPORARY DISABLED,,";
                                            strReturnData = 'ID2 User Disabled,Contact Authorized,Person,';//
                                            resolve(strReturnData);
                                        }
                                        else {
                                            objArrayInit.InitializeArrays().then(res => {
                                                if (res == "Success") {
                                                    /**********
                                    * Setting here owner for PreWeighment checks
                                    */
                                                    var tempCubicInfo = globalData.arrIdsInfo.find(ids => ids.Sys_IDSNo == IdsIp);
                                                    var owner = 'analytical'
                                                    if (tempCubicInfo.Sys_CubType == 'IPC') {
                                                        owner = 'IPC';
                                                    } else {
                                                        owner = 'analytical'
                                                    }
                                                    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsIp);
                                                    if (objOwner == undefined) { globalData.arrPreWeighCalibOwner.push({ idsNo: IdsIp, owner: owner }) }
                                                    else { objOwner.owner = owner }
                                                    objPreWeighmentCheck.validatePreWeighmentActivites(IdsIp, false).then((res) => {
                                                        fetchDetails.checkForRights(IdsIp, strUserId);
                                                        if (res != "Batch Started," && res != "Valid PreCalibration,") {
                                                            strReturnData = "ID3 " + res + ",,,";
                                                            resolve(strReturnData);
                                                        }
                                                        else {
                                                            var tmpUserobj = globalData.arrUsers.find(k => k.IdsNo == IdsIp);
                                                            if (tmpUserobj == undefined) {
                                                                globalData.arrUsers.push({
                                                                    IdsNo: IdsIp,
                                                                    UserId: strUserId,
                                                                    UserName:  sarr_UserData[0].UserInitials,
                                                                });
                                                            } else {
                                                                    tmpUserobj.UserId = strUserId;
                                                                    tmpUserobj.UserName = sarr_UserData[0].UserInitials;
                                                                     // tmpUserobj.ForceLogin = false;
                                                            }
                                                            // globalData.arrUsers.push({
                                                            //     IdsNo: IdsIp,
                                                            //     UserId: strUserId,
                                                            //     UserName: sarr_UserData[0].UserInitials
                                                            // });
                                                            globalData.arrBulkDataFlag.push({
                                                                IdsNo: IdsIp,
                                                                "flgDTFlag": false,
                                                                "flgHTFlag": false
                                                            })
                                                            globalData.arrIntervalFlag.push({
                                                                IdsNo: IdsIp,
                                                                "flgFriabilityFlag": false,
                                                                drum1: false,
                                                                drum2: false,
                                                                IntervalRecived: false
                                                            })
                                                            globalData.arrLodFlag.push({
                                                                IdsNo: IdsIp,
                                                                "flgLodFlag": false,
                                                            })
                                                            globalData.arrIncompleteRemark.push({
                                                                weighment: false,
                                                                RepoSr: 0,
                                                                Type: 0,
                                                                IdsNo: IdsIp
                                                            })
                                                            // strReturnData = "ID1U" + ('0000' + (globalData.arrsAllParameters[0].tbl_config_TimeoutPeriod * 60)).slice(-4);
                                                            strReturnData = "ID1U" + ('0000' + (globalData.arrsAllParameters[0].tbl_config_TimeoutPeriod * 60)).slice(-4) + ",,,";

                                                            var objUpdateLoginData = {
                                                                str_tableName: 'tbl_users',
                                                                data: [
                                                                    { str_colName: 'active', value: 1 },
                                                                    { str_colName: 'HostName', value: str_IpAddress },
                                                                    { str_colName: 'source', value: 'IDS' }
                                                                ],
                                                                condition: [
                                                                    { str_colName: 'UserID', value: strUserId }
                                                                ]
                                                            }
                                                            database.update(objUpdateLoginData).then(result => {

                                                                var objActivity = {};
                                                                Object.assign(objActivity,
                                                                    { strUserId: strUserId },
                                                                    { strUserName: sarr_UserData[0].UserInitials },
                                                                    { activity: 'Logged In On IDS ' + IdsIp })
                                                                objActivityLog.ActivityLogEntry(objActivity).then(res => {

                                                                    var tempCubicInfo = globalData.arrIdsInfo.find(ids => ids.Sys_IDSNo == IdsIp);
                                                                    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsIp);
                                                                    var tempBalace = tempCubicInfo.Sys_BalID;
                                                                    if (objOwner.owner == 'analytical') {
                                                                        tempBalace = tempCubicInfo.Sys_BalID;
                                                                    } else {
                                                                        tempBalace = tempCubicInfo.Sys_BinBalID; // Bin Bal
                                                                    }
                                                                    if (tempBalace != 'None' &&
                                                                        (tempCubicInfo.Sys_Port1 == 'Balance' || tempCubicInfo.Sys_Port2 == 'Balance' || tempCubicInfo.Sys_Port1 == 'IPC Balance'
                                                                            || tempCubicInfo.Sys_Port3 == 'Balance' || tempCubicInfo.Sys_Port3 == 'IPC Balance')) {
                                                                        fetchDetails.checkBalanceInStatus_Re_tables(tempBalace, IdsIp).then(result => {

                                                                            if (result == false) {
                                                                                fetchDetails.getCaibrationStatus(IdsIp);
                                                                                fetchDetails.getBalanceCalibDetails(IdsIp);
                                                                                fetchDetails.fillAlertCalibration(IdsIp);
                                                                                //granulation check is just for cipla2
                                                                                if (tempCubicInfo.Sys_Area != "Effervescent Granulation" || tempCubicInfo.Sys_Area != "Granulation") {
                                                                                    resolve(strReturnData);
                                                                                    // this.updateWeighmentStatus(IdsIp, 1).then((result) => {
                                                                                    //     resolve(strReturnData);
                                                                                    // });
                                                                                }
                                                                                else {
                                                                                    resolve(strReturnData);
                                                                                }
                                                                            }
                                                                            else {
                                                                                strReturnData = "ID3 Set Balance ,Again,,"
                                                                                resolve(strReturnData);
                                                                            }

                                                                        }).catch(err => {
                                                                            console.log('Error while Fetching Balance', err);
                                                                            reject(err)
                                                                        })



                                                                    } else {
                                                                        fetchDetails.fillAlertCalibration(IdsIp);
                                                                        //granulation check is just for cipla2
                                                                        if (tempCubicInfo.Sys_Area != "Granulation") {
                                                                            // this.updateWeighmentStatus(IdsIp, 1).then((result) => {
                                                                            resolve(strReturnData);
                                                                            // });
                                                                        }
                                                                        else {
                                                                            resolve(strReturnData);
                                                                        }
                                                                    }



                                                                }).catch(error => { console.log(error); });

                                                            }).catch(err => {
                                                                console.log('Error while logout', err);
                                                                reject(err)
                                                            })
                                                        }

                                                    })
                                                }
                                                else {
                                                    strReturnData = "ID3 Array Initialization Failed,,,";
                                                    resolve(strReturnData);
                                                }
                                            })
                                        }
                                    }
                                    else {
                                        let now = new Date();
                                        var res = database.execute(`insert into tbl_audit_unauthorized_user(dt,tm,userId,username,host) values ('${date.format(now, 'YYYY-MM-DD')}','${date.format(now, 'HH:mm:ss')}','${strUserId}','NA','${str_IpAddress}')`)
                                        resolve("ID0U");
                                    }
                                }
                                else {
                                    resolve("ID3 LDAP Respose Failed,,,");
                                }


                            });
                        }
                        else {
                            // var strReturnData = "ID3 USER NOT VALIDATED, PLS VALIDATE ON S/W, AND TRY AGAIN,,";
                            var strReturnData = "ID3 Validate User on,Software,And Try Again,,";
                            resolve(strReturnData);
                        }
                    } else {
                        let now = new Date();
                        var res = database.execute(`insert into tbl_audit_unauthorized_user(dt,tm,userId,username,host) values ('${date.format(now, 'YYYY-MM-DD')}','${date.format(now, 'HH:mm:ss')}','${strUserId}','NA','${str_IpAddress}')`)
                        resolve("ID0U");
                    }

                }).catch(err => {
                    reject(err);
                })
            }
        })
    }

    updateWeighmentStatus(IdsIp, intStatus) {
        return new Promise((resolve, reject) => {
            let currentCubicObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsIp);
            var tempIPQCobj = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsIp);
            var selectedIds;
            if (currentCubicObj.Sys_CubType == 'IPC') {
                let tempBin = globalData.arrBinInfo.find(k => k.idsNo == IdsIp);
                if (tempBin != undefined) {
                    selectedIds = tempBin.selIds;
                } else {
                    selectedIds = IdsIp;
                }
            } else {
                if (tempIPQCobj != undefined) { // IPQC Cubicles
                    selectedIds = tempIPQCobj.selectedIds;
                } else {
                    selectedIds = IdsIp;
                }
            }
            let tempCubicObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);


            var objStatus = {
                str_tableName: "tbl_system_weighingstatus",
                data: [
                    { str_colName: 'Status', value: intStatus },
                    { str_colName: 'BatchNo', value: intStatus == 0 ? "NULL" : tempCubicObj.Sys_Batch },
                    { str_colName: 'CubType', value: intStatus == 0 ? "NULL" : tempCubicObj.Sys_CubType }
                ],
                condition: [
                    { str_colName: 'CubicleNo', value: currentCubicObj.Sys_CubicNo },

                ]
            }

            database.update(objStatus).then(res => {
                resolve("Success");
            }).catch(err => {
                reject(err);
            })
        })
    }

    async logOut(strIdsNo, strProtocol) {
        const tempObject = globalData.arrUsers.find(k => k.IdsNo == strIdsNo);
        if (tempObject != undefined) {
            var strUserId = tempObject.UserId;
            var objUpdateLogOutData = {
                str_tableName: 'tbl_users',
                data: [
                    { str_colName: 'active', value: 0 },
                    { str_colName: 'HostName', value: 0 },
                    // { str_colName: 'source', value: 0 }
                ],
                condition: [
                    { str_colName: 'UserID', value: strUserId }
                ]
            }
            await database.update(objUpdateLogOutData);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == strIdsNo);
            var objActivity = {};
            await this.clearArrays(strIdsNo);
            Object.assign(objActivity,
                { strUserId: tempUserObject.UserId },
                { strUserName: tempUserObject.UserName },
            );
            if (strProtocol == 'T') {
                Object.assign(objActivity,
                    { activity: 'Time out! Logged out from IDS ' + strIdsNo });
            }
            else {
                Object.assign(objActivity,
                    { activity: 'Logged out from IDS ' + strIdsNo })
            }

            await objActivityLog.ActivityLogEntry(objActivity);
            let objUpdateCubicle = {
                str_tableName: 'tbl_cubical',
                data: [
                    { str_colName: 'Sys_CalibInProcess', value: 0 },
                ],
                condition: [
                    { str_colName: 'Sys_IDSNo', value: strIdsNo }
                ]
            }
            await database.update(objUpdateCubicle);
            console.log('Sys_CalibInProcess set from logOut=0')
            await this.updateWeighmentStatus(strIdsNo, 0)
            return '+';
        }
        else {
            return '+';
        }



    }
    async logOutOnStart(strAddress, idsNo) {
        try {
            // First we check if given user is active or not
            var objselectData = {
                str_tableName: 'tbl_users',
                data: '*',
                condition: [
                    { str_colName: 'HostName', value: strAddress }
                ]
            }
            let result = await database.select(objselectData);
            if (result[0].length != 0) {
                var objUpdateLogOutData = {
                    str_tableName: 'tbl_users',
                    data: [
                        { str_colName: 'active', value: 0 },
                        { str_colName: 'HostName', value: 0 }
                    ],
                    condition: [
                        { str_colName: 'HostName', value: strAddress }
                    ]
                }

                await database.update(objUpdateLogOutData);
                await this.clearArrays(idsNo);
                await this.updateWeighmentStatus(idsNo, 0)
                // return '+';
            } else {
                await this.clearArrays(idsNo);
            }
            let objUpdateCubicle = {
                str_tableName: 'tbl_cubical',
                data: [
                    { str_colName: 'Sys_CalibInProcess', value: 0 },
                ],
                condition: [
                    { str_colName: 'Sys_IDSNo', value: strAddress.split('.')[3] }
                ]
            }
            console.log('Sys_CalibInProcess set from logOutOnStart=0')
            await database.update(objUpdateCubicle);
            await this.updateWeighmentStatus(idsNo, 0);

        } catch (err) {
            console.log(err);
            // return '+';
        }
    }

    clearArrays(strIdsNo) {
        // console.log('IDSNO related objects remove from array');
        // Here we need to splice arrays for that user or IDSNo
        let tempCubicObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == strIdsNo);
        //-----------------------------------------------------------------------
        if (globalData.arr_FlagCallibWeighment != undefined) {
            globalData.arr_FlagCallibWeighment = globalData.arr_FlagCallibWeighment
                .filter(k => k.idsNo != strIdsNo) // aletsFalg array
            // console.log(globalData.arr_FlagCallibWeighment)
        }
        //----------------------------------------------------------------------
        if (globalData.arrGranulationMenuType != undefined) {
            globalData.arrGranulationMenuType = globalData.arrGranulationMenuType
                .filter(k => k.idsNo != strIdsNo)
        }
        //----------------------------------------------------------------------


        if (globalData.arrIPCPeriodicFlag != undefined) { // added by vivek11101997
            globalData.arrIPCPeriodicFlag = globalData.arrIPCPeriodicFlag
                .filter(k => k.idsNo != strIdsNo)
        }
        //----------------------------------------------------------------------


        if (globalData.arrBalCalibWeights != undefined) {
            globalData.arrBalCalibWeights = globalData.arrBalCalibWeights
                .filter(k => k.idsNo != strIdsNo)
        }
        //----------------------------------------------------------------------
        if (globalData.arrVerCalibWeights != undefined) {
            globalData.arrVerCalibWeights = globalData.arrVerCalibWeights
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrBalance != undefined) {
            globalData.arrBalance = globalData.arrBalance
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrVernier != undefined) {
            globalData.arrVernier = globalData.arrVernier
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrUsers != undefined) {
            globalData.arrUsers = globalData.arrUsers
                .filter(k => k.IdsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.calibrationStatus != undefined && tempCubicObj != undefined) {
            globalData.calibrationStatus = globalData.calibrationStatus
                .filter(k => k.balId != tempCubicObj.Sys_BalID)
        }
        //-----------------------------------------------------------------------

        if (globalData.arrcalibType != undefined) {
            globalData.arrcalibType = globalData.arrcalibType
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrBalCaibDet != undefined && tempCubicObj != undefined) {
            globalData.arrBalCaibDet = globalData.arrBalCaibDet
                .filter(k => k.strBalId != tempCubicObj.Sys_BalID)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrProductTypeArray != undefined) {
            globalData.arrProductTypeArray = globalData.arrProductTypeArray
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arr_limits != undefined) {
            globalData.arr_limits = globalData.arr_limits
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arr_IPQCRelIds != undefined) {
            globalData.arr_IPQCRelIds = globalData.arr_IPQCRelIds
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        //  console.log('arr1', globalData.arrCubicleType, strIdsNo)
        if (globalData.arrCubicleType != undefined) {
            globalData.arrCubicleType = globalData.arrCubicleType
                .filter(k => k.idsNo != strIdsNo)
        }
        //  console.log('arr2', globalData.arrCubicleType, strIdsNo)
        //-----------------------------------------------------------------------
        if (globalData.arrGranulationMenuType != undefined) {
            globalData.arrGranulationMenuType = globalData.arrGranulationMenuType
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrLODTypeSelectedMenu != undefined) {
            globalData.arrLODTypeSelectedMenu = globalData.arrLODTypeSelectedMenu
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrJARTypeDT != undefined) {
            globalData.arrJARTypeDT = globalData.arrJARTypeDT
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrHardness425 != undefined) {
            globalData.arrHardness425 = globalData.arrHardness425
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrBulkDataFlag != undefined) {
            globalData.arrBulkDataFlag = globalData.arrBulkDataFlag
                .filter(k => k.IdsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrDTData != undefined) {
            globalData.arrDTData = globalData.arrDTData
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.hardnessIncompleteId != undefined) {
            globalData.hardnessIncompleteId = globalData.hardnessIncompleteId
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrTDTData != undefined) {
            globalData.arrTDTData = globalData.arrTDTData
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrFriabilityData != undefined) {
            globalData.arrFriabilityData = globalData.arrFriabilityData
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrLodData != undefined) {
            globalData.arrLodData = globalData.arrLodData
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrLodFlag != undefined) {
            globalData.arrLodFlag = globalData.arrLodFlag
                .filter(k => k.IdsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrVernierData != undefined) {
            globalData.arrVernierData = globalData.arrVernierData
                .filter(k => k.IdsNum != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrVernierData != undefined) {
            globalData.arrVernierData = globalData.arrVernierData
                .filter(k => k.IdsNum != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrIncompleteRemark != undefined) {
            globalData.arrIncompleteRemark = globalData.arrIncompleteRemark
                .filter(k => k.IdsNo != strIdsNo)
        }

        //-----------------------------------------------------------------------
        if (globalData.arrFlagForFailCalib != undefined) {
            globalData.arrFlagForFailCalib = globalData.arrFlagForFailCalib
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrMultihealerMS != undefined) {
            globalData.arrMultihealerMS = globalData.arrMultihealerMS
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.arrMultiHealerCal != undefined) {
            globalData.arrMultiHealerCal = globalData.arrMultiHealerCal
                .filter(k => k.idsNo != strIdsNo)
        }
        //-----------------------------------------------------------------------
        if (globalData.FrabilityOnBal != undefined) {
            globalData.FrabilityOnBal = globalData.FrabilityOnBal
                .filter(k => k.idsNo != strIdsNo)
        }
        if (globalData.arrdifferential != undefined) {
            globalData.arrdifferential = globalData.arrdifferential
                .filter(k => k.idsNo != strIdsNo)
        }
        //--------------------------------------------------------------/
        if (globalData.arrBinIndex != undefined) {
            globalData.arrBinIndex = globalData.arrBinIndex
                .filter(k => k.idsNo != strIdsNo)
        }
        //--------------------------------------------------------------/
        if (globalData.arrBinInfo != undefined) {
            globalData.arrBinInfo = globalData.arrBinInfo
                .filter(k => k.idsNo != strIdsNo)
        }
        //--------------------------------------------------------------/
        if (globalData.arrTotalBins != undefined) {
            globalData.arrTotalBins = globalData.arrTotalBins
                .filter(k => k.idsNo != strIdsNo)
        }
        //----------------------------------------------------------------/

        //------------------------------------------------------------------
        if (globalData.arrAreaRelated != undefined) {
            globalData.arrAreaRelated = globalData.arrAreaRelated
                .filter(k => k.idsNo != strIdsNo)
        }
        //-------------------------------------------------------------------

        //--------------------------------------------------------------------
        if (globalData.arrDisplayFinalDiffWt != undefined) {
            globalData.arrDisplayFinalDiffWt = globalData.arrDisplayFinalDiffWt
                .filter(k => k.idsNo != strIdsNo)
        }
        //-------------------------------------------------------------------/

        //--------------------------------------------------------------------
        if (globalData.arrNetwtResult != undefined) {
            globalData.arrNetwtResult = globalData.arrNetwtResult
                .filter(k => k.idsNo != strIdsNo)
        }
        //-------------------------------------------------------------------/

        //--------------------------------------------------------------------
        if (globalData.arrHardnessDRSCPharmatron != undefined) {
            globalData.arrHardnessDRSCPharmatron = globalData.arrHardnessDRSCPharmatron
                .filter(k => k.idsNo != strIdsNo)
        }
        //-------------------------------------------------------------------/

        //--------------------------------------------------------------------
        if (globalData.arrDTLABIndiaBasketTyep != undefined) {
            globalData.arrDTLABIndiaBasketTyep = globalData.arrDTLABIndiaBasketTyep
                .filter(k => k.idsNo != strIdsNo)
        }
        //-------------------------------------------------------------------/arrPreWeighCalibOwner
        if (globalData.arrPreWeighCalibOwner != undefined) {
            globalData.arrPreWeighCalibOwner = globalData.arrPreWeighCalibOwner
                .filter(k => k.idsNo != strIdsNo)
        }
        //------------------------------

        if (globalData.arrHardnessKramer != undefined) {
            globalData.arrHardnessKramer = globalData.arrHardnessKramer
                .filter(k => k.idsNo != strIdsNo)
        }

        if (globalData.arrDTmstSerNo != undefined) {// added by vivek
            globalData.arrDTmstSerNo = globalData.arrDTmstSerNo
                .filter(k => k.idsNo != strIdsNo)
        }
        if (globalData.arrPharmaMt50 != undefined) {//added by pradip 10/09/2020
            globalData.arrPharmaMt50 = globalData.arrPharmaMt50
                .filter(k => k.idsNo != strIdsNo)
        }
        if (globalData.arrVernierCalCMFlag != undefined) {//added by pradip 20/10/2020
            globalData.arrVernierCalCMFlag = globalData.arrVernierCalCMFlag
                .filter(k => k.idsNo != strIdsNo)
        }
        if (globalData.arGrpMschSpeedAndApp != undefined) {//added by vivek 19/10/2020
            globalData.arGrpMschSpeedAndApp = globalData.arGrpMschSpeedAndApp
                .filter(k => k.idsNo != strIdsNo);
        }
        if (globalData.arrWhichMenuSideSelected != undefined) {//added by Pradip 29/10/2020
            globalData.arrWhichMenuSideSelected = globalData.arrWhichMenuSideSelected
                .filter(k => k.idsNo != strIdsNo);
        }
        if (globalData.arrisIMGBForBin != undefined) {//added by Pradip 15/12/2020
            globalData.arrisIMGBForBin = globalData.arrisIMGBForBin
                .filter(k => k.idsNo != strIdsNo);
        }
        if (globalData.arrContentCapsule != undefined) {//added by Pradip 23/03/2021
            globalData.arrContentCapsule = globalData.arrContentCapsule
                .filter(k => k.idsNo != strIdsNo);
        }
        if (globalData.arrLLsampleRemark != undefined) {//added by Pradip 07/04/2021
            globalData.arrLLsampleRemark = globalData.arrLLsampleRemark
                .filter(k => k.idsNo != strIdsNo);
        }
    }

    releaseUserFromIds(obj) {
        return new Promise((resolve, reject) => {
            var activeUser = obj.IdsNo;
            var strUserObj = globalData.arrUsers.find(k => k.IdsNo == activeUser.toString());
            var objActivity = {};
            if (strUserObj != undefined) {
                Object.assign(objActivity,
                    { strUserId: strUserObj.UserId },
                    { strUserName: strUserObj.UserName },
                    { activity: 'IDS ' + obj.IdsNo + ' Communication Off' });
            } else {
                Object.assign(objActivity,
                    { strUserId: 'NA' },
                    { strUserName: 'NA' },
                    { activity: 'IDS ' + obj.IdsNo + ' Communication Off' });
            }
            this.updateWeighmentStatus(obj.IdsNo, 0);
            objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
            objIncompleteUpdation.updateReportRemarkaftercommunicationoff(activeUser);

            if (strUserObj != undefined) {
                var userID = strUserObj.UserId;
                var objUpdateLogOutData = {
                    str_tableName: 'tbl_users',
                    data: [
                        { str_colName: 'active', value: 0 },
                        { str_colName: 'HostName', value: 0 }
                    ],
                    condition: [
                        { str_colName: 'UserID', value: userID }
                    ]
                }
                console.log('User R A I O');// User release due to lack of ~ coming from IDS
                database.update(objUpdateLogOutData).then((result) => {
                    resolve('+')
                }).catch(err => {
                    reject()
                })
            }
        })
    }
    async updatePassword(tmpUserObj, idsNo, str_Protocol) {
        try {
            let now = new Date();
            var newPassword = str_Protocol.substring(3).split(' ')[0];
            var updatePasswordObj = {
                str_tableName: 'tbl_users',
                data: [
                    { str_colName: 'PwdChgDate', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: 'realPassword', value: newPassword },
                    { str_colName: 'PwdExpStauts', value: 0 },
                    { str_colName: 'Status', value: 0 },
                    { str_colName: 'PwdChg', value: 0 },
                    { str_colName: 'source', value: 'IDS' },
                ],
                condition: [
                    { str_colName: 'UserID', value: tmpUserObj.UserId }
                ]
            }
            await database.update(updatePasswordObj);
            return 'ID2 Password Changed,Successfully,Re-login,,'
        } catch (err) {
            console.log(err);
        }
    }


}
module.exports = LoginModal;