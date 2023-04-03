const globalData = require('../../global/globalData');
const serverConfig = require('../../global/severConfig');
const Database = require('../../database/clsQueryProcess');
const database = new Database();
const dbCon = require('../../utils/dbCon');
const CopyObjects = require('./clsCopyObjectModal');
const copyObjects = new CopyObjects();
const obj_getRepSrNo = require('../../middleware/RepSrNo');
const moment = require('moment')
const normaDate = require('../../middleware/setTimeZone');
const sort = require('./checkForPendingCalib');
var logFromPC = require('../../model/clsLogger');
const date = require('date-and-time');
var request = require('request');
const axios = require('axios').default;
const clsMathJS = require('../../middleware/clsMathJS');
const math = new clsMathJS();
const clsSP = require('../../model/clsStoreProcedure');
const objSP = new clsSP();
const clsActivityLog = require('../clsActivityLogModel');
const objActivityLog = new clsActivityLog();
class CommanFunction {
    // ******************************************************************************************//
    // Below function updateRepSrNoStatus status `tbl_calibration_status` table      //
    //****************************************************************************************** */
    updateRepSrNo(Type, strBalId, IDSSrNo) {
        // based on which is first calibration repSroNo will get update in calibration_status table
        // on the very first weight
        switch (Type) {
            case 'periodic':
                var selectMaxRep = {
                    str_tableName: 'tbl_calibration_periodic_master_incomplete',
                    data: 'MAX(Periodic_RepNo) AS RepNo',
                    condition: [
                        { str_colName: 'periodic_BalID', value: strBalId, comp: 'eq' }
                    ]
                }
                this.update(selectMaxRep, strBalId, IDSSrNo); // Function call
                break;
            case 'eccentricity':
                var selectMaxRep = {
                    str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                    data: 'MAX(Eccent_RepNo) AS RepNo',
                    condition: [
                        { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' }
                    ]
                }
                this.update(selectMaxRep, strBalId, IDSSrNo); // Function call
                break;
            case 'linearity':
                var selectMaxRep = {
                    str_tableName: 'tbl_calibration_linearity_master_incomplete',
                    data: 'MAX(Linear_RepNo) AS RepNo',
                    condition: [
                        { str_colName: 'Linear_BalID', value: strBalId, comp: 'eq' }
                    ]
                }
                this.update(selectMaxRep, strBalId, IDSSrNo); // Function call
                break;
            case 'repetability':
                var selectMaxRep = {
                    str_tableName: 'tbl_calibration_repetability_master_incomplete',
                    data: 'MAX(Repet_RepNo) AS RepNo',
                    condition: [
                        { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' }
                    ]
                }
                this.update(selectMaxRep, strBalId, IDSSrNo); // Function call
                break;
            case 'uncertanity':
                var selectMaxRep = {
                    str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                    data: 'MAX(Uncertinity_RepNo) AS RepNo',
                    condition: [
                        { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' }
                    ]
                }
                this.update(selectMaxRep, strBalId, IDSSrNo); // Function call
                break;
        }
    }
    //****************************************************************************************** */
    // Actual uodation of RepSr no here which is called from updateRepSrNo function
    //****************************************************************************************** */  
    update(selectMaxRep, strBalId, IDSSrNo) {
        // selectMaxRep:- is object for select query
        database.select(selectMaxRep).then(result => {
            const repSrNo = result[0][0].RepNo;
            // updation for report serial number
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
            var calibtable = 'tbl_calibration_status';
            if (objOwner.owner == 'analytical') {
                calibtable = 'tbl_calibration_status';
            } else {
                calibtable = 'tbl_calibration_status_bin';
            }
            const updateRepSrNoObj = {
                str_tableName: calibtable,
                data: [
                    { str_colName: 'RepNo', value: repSrNo }
                ],
                condition: [
                    { str_colName: 'BalID', value: strBalId }
                ]
            }
            database.update(updateRepSrNoObj); // updated
        }).catch(err => console.log(err))
    }
    //****************************************************************************************** */
    // Below function updates the status to 0 -> 1 for that particular Caibration in 
    // calibration_status table
    //****************************************************************************************** */  
    updateCalibStatus(columName, strBalId, IDSSrNo) {
        return new Promise((resolve, reject) => {
            // columName is like 'P', 'E', 'U' ....etc
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
            var calibtable = 'tbl_calibration_status';
            if (objOwner.owner == 'analytical') {
                calibtable = 'tbl_calibration_status';
            } else {
                calibtable = 'tbl_calibration_status_bin';
            }
            const updateStatus = {
                str_tableName: calibtable,
                data: [
                    { str_colName: columName, value: 1 }
                ],
                condition: [
                    { str_colName: 'BalID', value: strBalId }
                ]
            }
            // We can update Current date
            if (columName == 'P') {
                let now = new Date();
                updateStatus.data.push({ str_colName: 'date', value: date.format(now, 'YYYY-MM-DD') });
            }
            database.update(updateStatus).then((result) => { // updated
                resolve(result); // returning Promise
            }).catch(err => reject(`Reject Promise while updating the calibration status for${columName, strBalId}`));
        })
    }
    //**************************************************************************************** */
    //****************************************************************************************** */
    // Below function sort the caibration sequence as mention in table
    //****************************************************************************************** */
    sortObject(obj) {
        return new Promise((resolve, reject) => {
            var arr = [];
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    arr.push({
                        'key': prop,
                        'value': obj[prop]
                    });
                }
            }
            arr.sort(function (a, b) { return a.value - b.value; });
            //arr.sort(function(a, b) { a.value.toLowerCase().localeCompare(b.value.toLowerCase()); }); //use this to sort as strings
            resolve(arr); // returns array
        })
    }
    //****************************************************************************************************** */
    // Below Function handles failed calibration, it will move incomplete tables to failed tables 
    //******************************************************************************************************* */
    async caibrationFails(CalibrationType, strBalId, RepNo) {
        // CalibrationType is like 'P', 'R', 'E', 'U'..etc
        // strBalId holds the balance associated with that cubicle
        // RepNo holds the report sr no of incomplete tables
        return new Promise((resolve, reject) => {
            // getting position of current caibration in sorted array of calibrations
            sort.sortedSeqArray(globalData.arrSortedCalib, strBalId).then(sortedArray => {
                var int_curentCalibrationIndex = sortedArray.indexOf(CalibrationType);
                // calculating first caalibration
                var str_first_calibration = sortedArray[0];
                this.getFrepSrNo(str_first_calibration).then(fRerSrNo => {
                    // fRerSrNo is failed repSrNo which will insert in all failed tables
                    var arr_CalibArray = []; // array holds calibration which done and one which failed
                    for (let i = 0; i < int_curentCalibrationIndex + 1; i++) {
                        arr_CalibArray.push(sortedArray[i])
                    }
                    // console.log('arr_CalibArray', arr_CalibArray);
                    arr_CalibArray.forEach((v) => {
                        // v holds value such as 'P', 'U', 'E' .....etc
                        switch (v) {
                            // For case PERIODIC CALIBRATION
                            case 'P':
                                copyObjects.periodic('tbl_calibration_periodic_master_incomplete'
                                    , 'tbl_calibration_periodic_master_failed', RepNo, 0, 'master').then(obj => {
                                        // Copying Incomplete master to failed master
                                        database.copy(obj).then(result => {
                                            // last inserted Id got here form query
                                            var lastInsertedId = result[0].insertId
                                            // Updating the report serial number in failed master
                                            const updateObj = {
                                                str_tableName: 'tbl_calibration_periodic_master_failed',
                                                data: [
                                                    { str_colName: 'Periodic_RepNo', value: fRerSrNo }
                                                ],
                                                condition: [
                                                    { str_colName: 'srNo', value: lastInsertedId }
                                                ]
                                            }
                                            database.update(updateObj).then(() => { // failed master report number updated
                                                // selecting data from incomplete details for copying
                                                var selectDetailObj = {
                                                    str_tableName: 'tbl_calibration_periodic_detail_incomplete',
                                                    data: 'Periodic_RepNo,Periodic_RecNo',
                                                    condition: [
                                                        { str_colName: 'Periodic_RepNo', value: RepNo, comp: 'eq' }
                                                    ]
                                                }
                                                database.select(selectDetailObj).then(result => { // selected
                                                    result[0].forEach((obj) => {
                                                        // as we have multiple entries i n details table so we need 
                                                        // Async loop
                                                        copyObjects.periodic('tbl_calibration_periodic_detail_incomplete'
                                                            , 'tbl_calibration_periodic_detail_failed', obj.Periodic_RepNo, obj.Periodic_RecNo, 'detail').then(obj => {
                                                                database.copy(obj).then(result => {
                                                                    var lastInsertedId = result[0].insertId;
                                                                    const updateDetObj = {
                                                                        str_tableName: 'tbl_calibration_periodic_detail_failed',
                                                                        data: [
                                                                            { str_colName: 'Periodic_RepNo', value: fRerSrNo }
                                                                        ],
                                                                        condition: [
                                                                            { str_colName: 'SrNo', value: lastInsertedId }
                                                                        ]
                                                                    }

                                                                    database.update(updateDetObj).then(() => { // updated repSrNo in failed details 
                                                                        // console.log('P Copy')
                                                                        // If ongoing calibration is failed ('Periodic') then only we have to delete
                                                                        // records from incomplete tables for new entries
                                                                        if (sortedArray.indexOf('P') == int_curentCalibrationIndex) {
                                                                            // delete records from incomplete tables
                                                                            var deleteMasteObj = {
                                                                                str_tableName: 'tbl_calibration_periodic_master_incomplete',
                                                                                condition: [
                                                                                    { str_colName: 'Periodic_RepNo', value: RepNo }
                                                                                ]
                                                                            }
                                                                            var deleteDetObj = {
                                                                                str_tableName: 'tbl_calibration_periodic_detail_incomplete',
                                                                                condition: [
                                                                                    { str_colName: 'Periodic_RepNo', value: RepNo }
                                                                                ]
                                                                            }
                                                                            database.delete(deleteMasteObj).then(() => {
                                                                                database.delete(deleteDetObj).then(() => {
                                                                                    resolve('ok')
                                                                                }).catch(err => { console.log(err) });
                                                                            }).catch(err => console.log(err))
                                                                        }
                                                                    }).catch(err => console.log(err))
                                                                });
                                                            }).catch(err => console.log(err))
                                                    });
                                                }).catch(err => console.log(err))
                                            }).catch(err => { console.log(err) })
                                        }).catch(err => { console.log(err) })
                                    })
                                break;
                            // For case REPETABILITY CALIBRATION
                            case 'R':
                                copyObjects.repetability('tbl_calibration_repetability_master_incomplete'
                                    , 'tbl_calibration_repetability_master_failed', RepNo, 0, 'master').then(obj => {
                                        // Copying Incomplete master to failed master
                                        database.copy(obj).then(result => {
                                            // last inserted Id got here form query
                                            var lastInsertedId = result[0].insertId;
                                            // Updating the report serial number in failed master
                                            const updateObj = {
                                                str_tableName: 'tbl_calibration_repetability_master_failed',
                                                data: [
                                                    { str_colName: 'Repet_RepNo', value: fRerSrNo }
                                                ],
                                                condition: [
                                                    { str_colName: 'SrNo', value: lastInsertedId }
                                                ]
                                            }
                                            database.update(updateObj).then(() => {  // failed master report number updated
                                                // selecting data from incomplete details for copying
                                                var selectDetailObj = {
                                                    str_tableName: 'tbl_calibration_repetability_detail_incomplete',
                                                    data: 'Repet_RepNo,Repet_RecNo',
                                                    condition: [
                                                        { str_colName: 'Repet_RepNo', value: RepNo, comp: 'eq' }
                                                    ]
                                                }
                                                database.select(selectDetailObj).then(result => {
                                                    // as we have multiple entries i n details table so we need 
                                                    // Async loop
                                                    result[0].forEach((obj) => {
                                                        copyObjects.repetability('tbl_calibration_repetability_detail_incomplete'
                                                            , 'tbl_calibration_repetability_detail_failed', obj.Repet_RepNo, obj.Repet_RecNo, 'detail').then(obj => {
                                                                database.copy(obj).then(result => {
                                                                    var lastInsertedId = result[0].insertId;
                                                                    const updateDetObj = {
                                                                        str_tableName: 'tbl_calibration_repetability_detail_failed',
                                                                        data: [
                                                                            { str_colName: 'Repet_RepNo', value: fRerSrNo }
                                                                        ],
                                                                        condition: [
                                                                            { str_colName: 'SrNo', value: lastInsertedId }
                                                                        ]
                                                                    }
                                                                    database.update(updateDetObj).then(() => {

                                                                    }).catch(err => console.log(err))

                                                                });
                                                            }).catch(err => console.log(err))
                                                    });
                                                    if (sortedArray.indexOf('R') == int_curentCalibrationIndex) {
                                                        // delete records from incomplete tables
                                                        console.log('inside delete')
                                                        var deleteMasteObj = {
                                                            str_tableName: 'tbl_calibration_repetability_master_incomplete',
                                                            condition: [
                                                                { str_colName: 'Repet_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        var deleteDetObj = {
                                                            str_tableName: 'tbl_calibration_repetability_detail_incomplete',
                                                            condition: [
                                                                { str_colName: 'Repet_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        database.delete(deleteMasteObj).then(() => {
                                                            database.delete(deleteDetObj).then(() => {
                                                                resolve('ok')
                                                            }).catch(err => { console.log(err) });
                                                        }).catch(err => console.log(err))
                                                    }
                                                }).catch(err => console.log(err))
                                            }).catch(err => { console.log(err) })
                                        }).catch(err => { console.log(err) })
                                    })
                                break;
                            // For case UNCERTINITY CALIBRATION
                            case 'U':
                                // First copying data
                                copyObjects.uncertinity('tbl_calibration_uncertinity_master_incomplete'
                                    , 'tbl_calibration_uncertinity_master_failed', RepNo, 0, 'master').then(obj => {
                                        // console.log(obj)
                                        database.copy(obj).then(result => {
                                            // console.log(result)
                                            var lastInsertedId = result[0].insertId
                                            const updateObj = {
                                                str_tableName: 'tbl_calibration_uncertinity_master_failed',
                                                data: [
                                                    { str_colName: 'Uncertinity_RepNo', value: fRerSrNo }
                                                ],
                                                condition: [
                                                    { str_colName: 'SrNo', value: lastInsertedId }
                                                ]
                                            }
                                            database.update(updateObj).then(() => {
                                                var selectDetailObj = {
                                                    str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                                                    data: 'Uncertinity_RepNo,Uncertinity_RecNo',
                                                    condition: [
                                                        { str_colName: 'Uncertinity_RepNo', value: RepNo, comp: 'eq' }
                                                    ]
                                                }
                                                database.select(selectDetailObj).then(result => {
                                                    // console.log(result[0])
                                                    result[0].forEach((obj) => {
                                                        // console.log('n', obj)
                                                        copyObjects.uncertinity('tbl_calibration_uncertinity_detail_incomplete'
                                                            , 'tbl_calibration_uncertinity_detail_failed', obj.Uncertinity_RepNo, obj.Uncertinity_RecNo, 'detail').then(obj => {
                                                                database.copy(obj).then(result => {

                                                                    var lastInsertedId = result[0].insertId;
                                                                    const updateDetObj = {
                                                                        str_tableName: 'tbl_calibration_uncertinity_detail_failed',
                                                                        data: [
                                                                            { str_colName: 'Uncertinity_RepNo', value: fRerSrNo }
                                                                        ],
                                                                        condition: [
                                                                            { str_colName: 'SrNo', value: lastInsertedId }
                                                                        ]
                                                                    }
                                                                    database.update(updateDetObj).then(() => {

                                                                    }).catch(err => console.log(err))

                                                                });
                                                            }).catch(err => console.log(err))
                                                    });
                                                    if (sortedArray.indexOf('U') == int_curentCalibrationIndex) {
                                                        // delete records from incomplete tables
                                                        console.log('inside delete')
                                                        var deleteMasteObj = {
                                                            str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                                                            condition: [
                                                                { str_colName: 'Uncertinity_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        var deleteDetObj = {
                                                            str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                                                            condition: [
                                                                { str_colName: 'Uncertinity_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        database.delete(deleteMasteObj).then(() => {
                                                            database.delete(deleteDetObj).then(() => {
                                                                resolve('ok')
                                                            }).catch(err => { console.log(err) });
                                                        }).catch(err => console.log(err))
                                                    }
                                                }).catch(err => console.log(err))
                                            }).catch(err => { console.log(err) })
                                        }).catch(err => { console.log(err) })
                                    })
                                break;
                            // For case ECCENTRICITY CALIBRATION
                            case 'E':
                                // First copying data
                                copyObjects.eccentricity('tbl_calibration_eccentricity_master_incomplete'
                                    , 'tbl_calibration_eccentricity_master_failed', RepNo, 0, 'master').then(obj => {
                                        // console.log(obj)
                                        database.copy(obj).then(result => {
                                            // console.log(result)
                                            var lastInsertedId = result[0].insertId
                                            const updateObj = {
                                                str_tableName: 'tbl_calibration_eccentricity_master_failed',
                                                data: [
                                                    { str_colName: 'Eccent_RepNo', value: fRerSrNo }
                                                ],
                                                condition: [
                                                    { str_colName: 'SrNo', value: lastInsertedId }
                                                ]
                                            }
                                            database.update(updateObj).then(() => {
                                                var selectDetailObj = {
                                                    str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                                                    data: 'Eccent_RepNo,Eccent_RecNo',
                                                    condition: [
                                                        { str_colName: 'Eccent_RepNo', value: RepNo, comp: 'eq' }
                                                    ]
                                                }
                                                database.select(selectDetailObj).then(result => {
                                                    // console.log(result[0])
                                                    result[0].forEach((obj) => {
                                                        // console.log('n', obj)
                                                        copyObjects.eccentricity('tbl_calibration_eccentricity_detail_incomplete'
                                                            , 'tbl_calibration_eccentricity_detail_failed', obj.Eccent_RepNo, obj.Eccent_RecNo, 'detail').then(obj => {
                                                                database.copy(obj).then(result => {

                                                                    var lastInsertedId = result[0].insertId;
                                                                    const updateDetObj = {
                                                                        str_tableName: 'tbl_calibration_eccentricity_detail_failed',
                                                                        data: [
                                                                            { str_colName: 'Eccent_RepNo', value: fRerSrNo }
                                                                        ],
                                                                        condition: [
                                                                            { str_colName: 'SrNo', value: lastInsertedId }
                                                                        ]
                                                                    }
                                                                    database.update(updateDetObj).then(() => {

                                                                    }).catch(err => console.log(err))

                                                                });
                                                            }).catch(err => console.log(err))
                                                    });
                                                    if (sortedArray.indexOf('E') == int_curentCalibrationIndex) {
                                                        // delete records from incomplete tables
                                                        console.log('inside delete')
                                                        var deleteMasteObj = {
                                                            str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                                                            condition: [
                                                                { str_colName: 'Eccent_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        var deleteDetObj = {
                                                            str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                                                            condition: [
                                                                { str_colName: 'Eccent_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        database.delete(deleteMasteObj).then(() => {
                                                            database.delete(deleteDetObj).then(() => {
                                                                resolve('ok')
                                                            }).catch(err => { console.log(err) });
                                                        }).catch(err => console.log(err))
                                                    }
                                                }).catch(err => console.log(err))
                                            }).catch(err => { console.log(err) })
                                        }).catch(err => { console.log(err) })
                                    })
                                break;
                            // For case LINEARITY CALIBRATION
                            case 'L':
                                // First copying data
                                copyObjects.linearity('tbl_calibration_linearity_master_incomplete'
                                    , 'tbl_calibration_linearity_master_failed', RepNo, 0, 'master').then(obj => {
                                        // console.log(obj)
                                        database.copy(obj).then(result => {
                                            // console.log(result)
                                            var lastInsertedId = result[0].insertId
                                            const updateObj = {
                                                str_tableName: 'tbl_calibration_linearity_master_failed',
                                                data: [
                                                    { str_colName: 'Linear_RepNo', value: fRerSrNo }
                                                ],
                                                condition: [
                                                    { str_colName: 'SrNo', value: lastInsertedId }
                                                ]
                                            }
                                            database.update(updateObj).then(() => {
                                                var selectDetailObj = {
                                                    str_tableName: 'tbl_calibration_linearity_detail_incomplete',
                                                    data: 'Linear_RepNo,Linear_RecNo',
                                                    condition: [
                                                        { str_colName: 'Linear_RepNo', value: RepNo, comp: 'eq' }
                                                    ]
                                                }
                                                database.select(selectDetailObj).then(result => {
                                                    // console.log(result[0])
                                                    result[0].forEach((obj) => {
                                                        // console.log('n', obj)
                                                        copyObjects.linearity('tbl_calibration_linearity_detail_incomplete'
                                                            , 'tbl_calibration_linearity_detail_failed', obj.Linear_RepNo, obj.Linear_RecNo, 'detail').then(obj => {
                                                                database.copy(obj).then(result => {

                                                                    var lastInsertedId = result[0].insertId;
                                                                    const updateDetObj = {
                                                                        str_tableName: 'tbl_calibration_linearity_detail_failed',
                                                                        data: [
                                                                            { str_colName: 'Linear_RepNo', value: fRerSrNo }
                                                                        ],
                                                                        condition: [
                                                                            { str_colName: 'SrNo', value: lastInsertedId }
                                                                        ]
                                                                    }
                                                                    database.update(updateDetObj).then(() => {

                                                                    }).catch(err => console.log(err))

                                                                });
                                                            }).catch(err => console.log(err))
                                                    });
                                                    if (sortedArray.indexOf('L') == int_curentCalibrationIndex) {
                                                        // delete records from incomplete tables
                                                        console.log('inside delete')
                                                        var deleteMasteObj = {
                                                            str_tableName: 'tbl_calibration_linearity_master_incomplete',
                                                            condition: [
                                                                { str_colName: 'Linear_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        var deleteDetObj = {
                                                            str_tableName: 'tbl_calibration_linearity_detail_incomplete',
                                                            condition: [
                                                                { str_colName: 'Linear_RepNo', value: RepNo }
                                                            ]
                                                        }
                                                        database.delete(deleteMasteObj).then(() => {
                                                            database.delete(deleteDetObj).then(() => {
                                                                resolve('ok')
                                                            }).catch(err => { console.log(err) });
                                                        }).catch(err => console.log(err))
                                                    }
                                                }).catch(err => console.log(err))
                                            }).catch(err => { console.log(err) })
                                        }).catch(err => { console.log(err) })
                                    })
                                break;
                        }
                    })

                }).catch(err => { console.log(err) })
            })
        })
    }
    //******************************************************************************************************* */
    //******************************************************************************************************* */
    // Below function calculates failed report serial number whichever is first calibration in will calculate
    // w.r.t to that calibration which different than actual report serial number
    //******************************************************************************************************* */
    getFrepSrNo(str_first_calibration) {
        // str_first_calibration : - is the first calibration in the process
        return new Promise((resolve, reject) => {
            switch (str_first_calibration) {
                case 'P':
                    var str_FailedTable = 'tbl_calibration_periodic_master_failed'; // tableName
                    var strRepNoColName = 'Periodic_RepNo'; //column name
                    this.calculateFrepSr(str_FailedTable, strRepNoColName).then(fRerSrNo => { // function call
                        resolve(fRerSrNo) // returning promise
                    }).catch(err => reject(err))
                    break;
                case 'U':
                    var str_FailedTable = 'tbl_calibration_uncertinity_master_failed'; // tableName
                    var strRepNoColName = 'Uncertinity_RepNo'; //column name
                    this.calculateFrepSr(str_FailedTable, strRepNoColName).then(fRerSrNo => {// function call
                        resolve(fRerSrNo) // returning promise
                    }).catch(err => reject(err))
                    break;
                case 'R':
                    var str_FailedTable = 'tbl_calibration_repetability_master_failed'; // tableName
                    var strRepNoColName = 'Repet_RepNo'; //column name
                    this.calculateFrepSr(str_FailedTable, strRepNoColName).then(fRerSrNo => {// function call
                        resolve(fRerSrNo) // returning promise
                    }).catch(err => reject(err))
                    break;
                case 'E':
                    var str_FailedTable = 'tbl_calibration_eccentricity_master_failed'; // tableName
                    var strRepNoColName = 'Eccent_RepNo'; //column name
                    this.calculateFrepSr(str_FailedTable, strRepNoColName).then(fRerSrNo => {// function call
                        resolve(fRerSrNo) // returning promise
                    }).catch(err => reject(err))
                    break;
                case 'L':
                    var str_FailedTable = 'tbl_calibration_linearity_master_failed'; // tableName
                    var strRepNoColName = 'Linear_RepNo'; //column name
                    this.calculateFrepSr(str_FailedTable, strRepNoColName).then(fRerSrNo => {// function call
                        resolve(fRerSrNo) // returning promise
                    }).catch(err => reject(err))
                    break;
                case 'V':
                    var str_FailedTable = 'tbl_calibration_positional_master_failed';
                    var strRepNoColName = 'Positional_RepNo'; //column name
                    this.calculateFrepSr(str_FailedTable, strRepNoColName).then(fRerSrNo => {// function call
                        resolve(fRerSrNo) // returning promise
                    }).catch(err => reject(err))
                    break;
            }
        })
    }
    //****************************************************************************************************** */
    // Below function calculates failed report serial number as FrepSrNo
    //****************************************************************************************************** */
    calculateFrepSr(str_FailedTable, strRepNoColName) {
        return new Promise((resolve, reject) => {
            const selectObj = {
                str_tableName: str_FailedTable,
                data: `MAX(${strRepNoColName}) AS FRepSrNo`
            }
            database.select(selectObj).then(result => {
                var FrepSrNo;
                // If entries not present
                if (result[0][0].FRepSrNo == null) {
                    FrepSrNo = 1;
                } else {
                    // If there are some records
                    FrepSrNo = result[0][0].FRepSrNo + 1;
                }
                resolve(FrepSrNo);
            }).catch(err => reject(err))
        })
    }
    //****************************************************************************************************** */
    // Below function copies data from incomplete tables to complete tables after successfull calibration 
    // of all types
    //****************************************************************************************************** */
    async incompleteToComplete(CalibrationType, strBalId, IDSSrNo) {
        try {
            // CalibrationType - OnGoing caaibration type i-e P, R, L .....
            var res = await obj_getRepSrNo.getRepSrNoWRTBalance(strBalId, IDSSrNo);
            // report serial number which same for all calibration recived from 'calibration status'
            var intRepSrNo = res[0][0].RepNo;
            var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
            // we are finding length of sorted array that we have 
            let length = arr_sortedCalibArray.length;
            // here we finding last calibration
            let lastCalibration = arr_sortedCalibArray[length - 1];
            // If current calibration is last calibration then we can proceed for copying
            //data from incomplete to complete tabled
            if (CalibrationType == lastCalibration) {
                let balCalDetPeri = globalData.arrBalCaibDet.find(k => k.strBalId == strBalId);
                balCalDetPeri.isPeriodicDone = true;
                console.log('copying starts for complete....')
                //  arr_sortedCalibArray.forEach((v) => {  //Async for loop
                for (let v of arr_sortedCalibArray) {
                    switch (v) {
                        // V holds value like P,L,E.....
                        // case periodic calibration
                        case 'P':
                            // Copy Incomplete to complete for master
                            await database.copy2('tbl_calibration_periodic_master_incomplete'
                                , 'tbl_calibration_periodic_master', 'Periodic_RepNo', intRepSrNo);  //copied..
                            // Copy Incomplete to complete for detail
                            await database.copy2('tbl_calibration_periodic_detail_incomplete'
                                , 'tbl_calibration_periodic_detail', 'Periodic_RepNo', intRepSrNo)//copied..
                            // deleting entries from incomplete table
                            var masteObj = {
                                str_tableName: 'tbl_calibration_periodic_master_incomplete',
                                condition: [
                                    { str_colName: 'Periodic_RepNo', value: intRepSrNo }
                                ]
                            }
                            var detailObj = {
                                str_tableName: 'tbl_calibration_periodic_detail_incomplete',
                                condition: [
                                    { str_colName: 'Periodic_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(masteObj);  //deleted
                            await database.delete(detailObj); //deleted
                            console.log('PERIODIC COPIED..');
                            break;
                        // case Repetabilty calibration
                        case 'R':
                            // Copy Incomplete to complete for master
                            await database.copy2('tbl_calibration_repetability_master_incomplete'
                                , 'tbl_calibration_repetability_master', 'Repet_RepNo', intRepSrNo); //copied..
                            // Copy Incomplete to complete for detail
                            await database.copy2('tbl_calibration_repetability_detail_incomplete'
                                , 'tbl_calibration_repetability_detail', 'Repet_RepNo', intRepSrNo);//copied..
                            // deleting entries from incomplete table
                            var masteObj = {
                                str_tableName: 'tbl_calibration_repetability_master_incomplete',
                                condition: [
                                    { str_colName: 'Repet_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(masteObj); //deleted
                            var detailObj = {
                                str_tableName: 'tbl_calibration_repetability_detail_incomplete',
                                condition: [
                                    { str_colName: 'Repet_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(detailObj); //deleted
                            console.log('REPETABILITY COPIED..')
                            break;
                        // case Eccentricity calibration
                        case 'E':
                            // Copy Incomplete to complete for master
                            await database.copy2('tbl_calibration_eccentricity_master_incomplete'
                                , 'tbl_calibration_eccentricity_master', 'Eccent_RepNo', intRepSrNo);//copied..
                            // Copy Incomplete to complete for detail
                            await database.copy2('tbl_calibration_eccentricity_detail_incomplete'
                                , 'tbl_calibration_eccentricity_detail', 'Eccent_RepNo', intRepSrNo);//copied..
                            // deleting entries from incomplete table
                            var masteObj = {
                                str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                                condition: [
                                    { str_colName: 'Eccent_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(masteObj); //deleted
                            var detailObj = {
                                str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                                condition: [
                                    { str_colName: 'Eccent_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(detailObj); //deleted
                            console.log('ECCENTRICITY COPIED..')
                            break;
                        // case Uncertinity calibration
                        case 'U':
                            // Copy Incomplete to complete for master
                            await database.copy2('tbl_calibration_uncertinity_master_incomplete'
                                , 'tbl_calibration_uncertinity_master', 'Uncertinity_RepNo', intRepSrNo); //copied..
                            // Copy Incomplete to complete for detail
                            await database.copy2('tbl_calibration_uncertinity_detail_incomplete'
                                , 'tbl_calibration_uncertinity_detail', 'Uncertinity_RepNo', intRepSrNo); //copied..
                            // deleting entries from incomplete table
                            var masteObj = {
                                str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                                condition: [
                                    { str_colName: 'Uncertinity_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(masteObj); //deleted
                            var detailObj = {
                                str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                                condition: [
                                    { str_colName: 'Uncertinity_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(detailObj); //deleted
                            console.log('UNCERTINITY COPIED..')
                            break;
                        // case Linearity calibration
                        case 'L':
                            // Copy Incomplete to complete for master
                            await database.copy2('tbl_calibration_linearity_master_incomplete'
                                , 'tbl_calibration_linearity_master', 'Linear_RepNo', intRepSrNo) //copied..
                            // Copy Incomplete to complete for detail
                            await database.copy2('tbl_calibration_linearity_detail_incomplete'
                                , 'tbl_calibration_linearity_detail', 'Linear_RepNo', intRepSrNo); //copied..
                            // deleting entries from incomplete table
                            var masteObj = {
                                str_tableName: 'tbl_calibration_linearity_master_incomplete',
                                condition: [
                                    { str_colName: 'Linear_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(masteObj); //deleted
                            var detailObj = {
                                str_tableName: 'tbl_calibration_linearity_detail_incomplete',
                                condition: [
                                    { str_colName: 'Linear_RepNo', value: intRepSrNo }
                                ]
                            }
                            await database.delete(detailObj); //deleted
                            console.log('LINEARITY COPIED..')
                            break;
                    }
                }
                // Updating Our golbal array that all calibration is completed with complete status
                for (var i in globalData.calibrationStatus) {
                    if (globalData.calibrationStatus[i].BalId == strBalId) {
                        globalData.calibrationStatus[i].status['P'] = 0;
                        globalData.calibrationStatus[i].status['E'] = 0;
                        globalData.calibrationStatus[i].status['R'] = 0;
                        globalData.calibrationStatus[i].status['U'] = 0;
                        globalData.calibrationStatus[i].status['L'] = 0;
                        break; //Stop this loop, we found it!
                    }
                }
                // Updating table 'calibration_status' that all calibration is completed with complete status
                var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
                var calibtable = 'tbl_calibration_status';
                if (objOwner.owner == 'analytical') {
                    calibtable = 'tbl_calibration_status';
                } else {
                    calibtable = 'tbl_calibration_status_bin';
                }
                const updateCalibstatusObj = {
                    str_tableName: calibtable,
                    data: [
                        { str_colName: 'P', value: 0 },
                        { str_colName: 'E', value: 0 },
                        { str_colName: 'R', value: 0 },
                        { str_colName: 'U', value: 0 },
                        { str_colName: 'L', value: 0 }
                    ],
                    condition: [
                        { str_colName: 'BalID', value: strBalId }
                    ]
                }
                await database.update(updateCalibstatusObj);
                // console.log('as', globalData.calibrationStatus)
                var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
                if (objOwner.owner == 'analytical') {
                    var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
                } else {
                    var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
                }
                /* Updating the calibration Duedates in tbl_balance after succesfull data copying if store
           type is 1 i-e set_days
           */
                // -----Start-----
                var selectBalsetDays = {
                    str_tableName: 'tbl_balance',
                    data: '*',
                    condition: [
                        { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                    ]
                }
                var res1 = await database.select(selectBalsetDays);
                let days = res1[0][0].Bal_CalbDuration;
                let isNewBal = res1[0][0].IsNewBalance.readUIntLE()
                if (BalanceRecalibStatusObject.PeriodicBalRecalib == 1) {
                    var logQ = `Calibration Was Recalibration`;
                    console.log(logQ);
                    //logFromPC.addtoProtocolLog(logQ)
                    return 'ok';
                } else if (isNewBal == 1 && moment(res1[0][0].Bal_CalbDueDt).format('YYYY-MM-DD') > moment().format('YYYY-MM-DD')) {
                    var updateisNewBal = {
                        str_tableName: "tbl_balance",
                        data: [{ str_colName: "IsNewBalance", value: 0 }],
                        condition: [{ str_colName: "Bal_ID", value: strBalId }],
                    };
                    await database.update(updateisNewBal);
                    var logQ = `Calibration Was new balance calibration and calibdate is greater than todaydate, no calib date shifted`;
                    console.log(logQ);
                    //logFromPC.addtoProtocolLog(logQ)
                    return 'ok';
                } else {
                    var normalDate;
                    var todays_Date = new Date();
                    var dateInUTC;
                    if (res1[0][0].Bal_CalbStoreType.readUIntLE() == 1) {
                        if (serverConfig.ProjectName == 'SunHalolGuj1' || serverConfig.ProjectName == 'MLVeer') {
                            // As in reminder calibration add month in date with due date only
                            var date = new Date(res1[0][0].Bal_CalbDueDt);
                        } else {
                            //current Date for other projects
                            var date = new Date();
                        }
                        // adding days to current date
                        if (serverConfig.ProjectName == 'SunHalolGuj1') {
                            while (date < todays_Date) {
                                dateInUTC = new Date(date.setMonth(date.getMonth() + days));
                            }
                        }
                        else {
                            //cheacking for cipla and mlveer for cipla date is start from current calibration 
                            //date and mlver date is start from calibdue date 
                            while (date <= todays_Date) {
                                dateInUTC = new Date(date.setDate(date.getDate() + days));
                            }
                        }
                        normalDate = await normaDate.convertDate(dateInUTC);
                    }



                    else {
                        var arr = res1[0][0].Bal_CalbDates.split(',');
                        var today = new Date();
                        var todayDate = moment().format('YYYY-MM-DD');
                        var month = today.getMonth() + 1;
                        month = ("0" + month).slice(-2);
                        var year = today.getFullYear();
                        var arr_calibdates = []
                        // for (let d of arr) {
                        //     var day = ("0" + d).slice(-2)
                        //     var date = '';
                        //     date = year + '-' + month + '-' + day;
                        //     arr_calibdates.push(date);
                        // }
                        for (let d of arr) {
                            var day = ("0" + d).slice(-2)
                            var date = '';
                            if(parseFloat(month) >= 12){
                                year++;
                                month = '01';
                                date = year + '-' + month + '-' + day;
                            }else {
                                date = year + '-' + month + '-' + day;
                            }
                            arr_calibdates.push(date);
                        }
                        var lastCalibDate = await this.checkIfLatestEntryResBal(strBalId);
                        lastCalibDate = moment(lastCalibDate).format('YYYY-MM-DD')
                        console.log(arr_calibdates);
                        normalDate = "";
                        for (const [i, ddmmyy] of arr_calibdates.entries()) {
                            if (lastCalibDate < ddmmyy) {
                                normalDate = arr_calibdates[i];
                                break;
                            }
                        }
                        // if (normalDate == "") {
                        //     var day = ("0" + arr[0]).slice(-2)
                        //     var date = '';
                        //     var month = today.getMonth() + 2;
                        //     month = ("0" + month).slice(-2);
                        //     date = year + '-' + month + '-' + day;
                        //     normalDate = date;
                        // }
                        if (normalDate == "") {
                            var day = ("0" + arr[0]).slice(-2)
                            var date = '';
                            var month = today.getMonth() + 2;
                            month = ("0" + month).slice(-2);
                            if(parseFloat(month) >= 12){
                               year++;
                               month = '02';
                               date = year + '-' + month + '-' + day;
                           }else {
                               date = year + '-' + month + '-' + day;
                           }
                            normalDate = date;
                        }
                    }
                    console.log('normalDate', normalDate)
                    var updateBalDueDates = {
                        str_tableName: 'tbl_balance',
                        data: [
                            { str_colName: 'Bal_CalbDueDt', value: normalDate },
                            { str_colName: 'Bal_CalbDueDtL', value: normalDate },
                            { str_colName: 'Bal_CalbDueDtU', value: normalDate },
                            { str_colName: 'Bal_CalbDueDtR', value: normalDate },
                            { str_colName: 'Bal_CalbDueDtE', value: normalDate },
                        ],
                        condition: [
                            { str_colName: 'Bal_ID', value: strBalId },
                        ]

                    }

                    await database.update(updateBalDueDates);
                    // setting nextcalib due date in periodic master
                    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
                    var calibtable = 'tbl_calibration_status';
                    if (objOwner.owner == 'analytical') {
                        calibtable = 'tbl_calibration_status';
                    } else {
                        calibtable = 'tbl_calibration_status_bin';
                    }
                    let selectObj = {
                        str_tableName: calibtable,
                        data: '*',
                        condition: [
                            { str_colName: 'BalID', value: strBalId }
                        ]
                    }
                    let result = await database.select(selectObj);
                    if (result[0].length != 0) {
                        let repNo = result[0][0].RepNo;
                        let updateObj = {
                            str_tableName: 'tbl_calibration_periodic_master',
                            data: [
                                { str_colName: 'Periodic_DueDate', value: normalDate }
                            ],
                            condition: [
                                { str_colName: 'Periodic_RepNo', value: repNo }
                            ]
                        }
                        await database.update(updateObj);
                    }
                    if (isNewBal == 1) {
                        var updateisNewBal = {
                            str_tableName: "tbl_balance",
                            data: [{ str_colName: "IsNewBalance", value: 0 }],
                            condition: [{ str_colName: "Bal_ID", value: strBalId }],
                        };
                        await database.update(updateisNewBal);
                        var logQ = `Calibration Was new balance calibration and calibdate is less than or equals todaydate, calib date shifted to ${normalDate}`;
                        console.log(logQ);
                        //logFromPC.addtoProtocolLog(logQ)
                    } else {
                        var logQ = `Normal calibration and calibdate is less than or equals todaydate, calib date shifted to ${normalDate}`;
                        console.log(logQ);
                       // logFromPC.addtoProtocolLog(logQ)
                    }

                    // -----end-----
                    return 'ok'
                }
            } else {
                return 'ok';
            }
        } catch (err) {
            throw new Error(err);
        }
    }
    async checkIfLatestEntryResBal(BalId) {
        // `SELECT * FROM `tbl_calibration_periodic_master` WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = 'TantraTest');`
        try {
            // console.log(`SELECT * FROM 'tbl_calibration_periodic_master' WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = '${BalId})'`)
            let res = await database.execute(`SELECT * FROM tbl_calibration_periodic_master WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo FROM tbl_calibration_periodic_master WHERE Periodic_BalID = '${BalId}')`);
            if (res[0].length != 0) {
                return res[0][0].Periodic_CalbDate;
            } else {
                return 'no data';
            }

        } catch (err) {
            return err;
        }
    }
    async checkIfLatestEntryResVernier(VernierId) {
        // `SELECT * FROM `tbl_calibration_periodic_master` WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = 'TantraTest');`
        try {
            // console.log(`SELECT * FROM 'tbl_calibration_periodic_master' WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = '${BalId})'`)
            let res = await database.execute(`SELECT * FROM tbl_calibration_periodic_master_vernier WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo FROM tbl_calibration_periodic_master_vernier WHERE Periodic_VerID = '${VernierId}')`);
            if (res[0].length != 0) {
                return res[0][0].Periodic_CalbDate;
            } else {
                return 'no data';
            }

        } catch (err) {
            return err;
        }
    }
    //************************************************************************************************8 */
    //Below function checks if data is present or not in incomplete master tables
    //************************************************************************************************* */
    checkIfRecordInIncomplete(calibrationType, strBalId) {
        return new Promise((resolve, reject) => {
            switch (calibrationType) {
                case 'P':
                    var selectObj = {
                        str_tableName: 'tbl_calibration_periodic_master_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' }
                        ]
                    }
                    break;
                case 'R':
                    var selectObj = {
                        str_tableName: 'tbl_calibration_repetability_master_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' }
                        ]
                    }
                    break;
                case 'U':
                    var selectObj = {
                        str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' }
                        ]
                    }
                    break;
                case 'E':
                    var selectObj = {
                        str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' }
                        ]
                    }
                    break;
                case 'L':
                    var selectObj = {
                        str_tableName: 'tbl_calibration_linearity_master_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Linear_BalID', value: strBalId, comp: 'eq' }
                        ]
                    }
                    break;
            }
            database.select(selectObj).then((result) => {
                if (result[0].length == 0) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            })
        })
    }
    addDaysToDate(date, daysToAdd) {
        const WEEKEND = [moment().day("Sunday").weekday()]
        var daysAdded = 0,
            momentDate = moment(new Date(date));
        while (daysAdded < daysToAdd) {
            momentDate = momentDate.add(1, 'days');
            if (!WEEKEND.includes(momentDate.weekday())) {
                daysAdded++
            }
        }
        return momentDate;
    }
    async calibrationVerification(idsNo) {
        try {
            if (serverConfig.ProjectName == "SunHalolGuj1") {
                var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                var DailyRes = false;
                var PeriodicRes = false;
                if (tempCubicInfo.Sys_Port1 == 'Balance') {
                    let strBalId = tempCubicInfo.Sys_BalID;
                    // let check for latest entry in dailyCalibrationTable
                    let selectDaily = {
                        str_tableName: 'tbl_calibration_daily_master',
                        data: '*',
                        condition: [
                            { str_colName: 'Daily_BalID', value: strBalId, comp: 'eq' }
                        ],
                        order: [
                            {
                                str_colName: 'Daily_RepNo', value: 'DESC LIMIT 0,1'
                            }
                        ]
                    }
                    let dResu = await database.select(selectDaily);
                    if (dResu[0].length > 0) {
                        if (dResu[0][0].Daily_VerifyID == 'NULL') {
                            DailyRes = true;
                        } else {
                            DailyRes = false;
                        }
                    } else {
                        DailyRes = false;
                    }
                    // let check for latest entry in Periodic Table
                    let selectPeriodic = {
                        str_tableName: 'tbl_calibration_periodic_master',
                        data: '*',
                        condition: [
                            { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' }
                        ],
                        order: [
                            {
                                str_colName: 'Periodic_RepNo', value: 'DESC LIMIT 0,1'
                            }
                        ]
                    }
                    let PResu = await database.select(selectPeriodic);
                    if (PResu[0].length > 0) {
                        if (PResu[0][0].Periodic_VerifyID == 'NULL') {
                            PeriodicRes = true;
                        } else {
                            PeriodicRes = false;
                        }
                    } else {
                        PeriodicRes = false;
                    }
                    if (DailyRes || PeriodicRes) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            else if (serverConfig.ProjectName == "CIPLA_Baddi") {

                let tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                let PeriodicRes = false;
                if (tempCubicInfo.Sys_Port1 == 'Balance') {
                    let strBalId = tempCubicInfo.Sys_BalID;
                    // let check for latest entry in Periodic Table
                    let selectPeriodic = {
                        str_tableName: 'tbl_calibration_periodic_master',
                        data: '*',
                        condition: [
                            { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' }
                        ],
                        order: [
                            {
                                str_colName: 'Periodic_RepNo', value: 'DESC LIMIT 0,1'
                            }
                        ]
                    }
                    let PResu = await database.select(selectPeriodic);
                    if (PResu[0].length > 0) {
                        if (PResu[0][0].Periodic_VerifyID == 'NULL') {
                            PeriodicRes = true;
                        } else {
                            PeriodicRes = false;
                        }
                    } else {
                        PeriodicRes = false;
                    }
                    if (PeriodicRes) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            else {
                return false;
            }
        } catch (err) {
            console.log(err);
            return false;
        }
    }
    async incompleteToCompleteVernier(CalibrationType, strVerId, IDSSrNo, int_periodic_RepNo) {
        try {
            // let balCalDetPeri = globalData.arrBalCaibDet.find(k => k.strBalId == strVerId);
            // balCalDetPeri.isPeriodicDone = true;
            var selectVerData = {
                str_tableName: 'tbl_vernier',
                data: '*',
                condition: [
                    { str_colName: 'VernierID', value: strVerId, comp: 'eq' },
                ]
            }
            var objselectVersetDays = await database.select(selectVerData);

            console.log('copying starts for vernier complete....');
            var VernierInfo = globalData.arrVernier.find(k => k.idsNo == IDSSrNo);
            //  arr_sortedCalibArray.forEach((v) => {  //Async for loop
            const selectRepSrNoObj = {
                str_tableName: 'tbl_calibration_periodic_master_vernier_incomplete',
                data: 'MAX(Periodic_RepNo) AS Periodic_RepNo',
                condition: [
                    { str_colName: 'Periodic_VerID', value: strVerId, comp: 'eq' },
                ]
            }
            var result = await database.select(selectRepSrNoObj);
            let int_periodic_RepNo = result[0][0].Periodic_RepNo;
            // Copy Incomplete to complete for master
            await database.copyPeriodic('tbl_calibration_periodic_master_vernier_incomplete'
                , 'tbl_calibration_periodic_master_vernier', 'Periodic_RepNo', int_periodic_RepNo);  //copied..
            // Copy Incomplete to complete for detail
            await database.copyPeriodic('tbl_calibration_periodic_detail_vernier_incomplete'
                , 'tbl_calibration_periodic_detail_vernier', 'Periodic_RepNo', int_periodic_RepNo)//copied..
            // deleting entries from incomplete table
            var masteObj = {
                str_tableName: 'tbl_calibration_periodic_master_vernier_incomplete',
                condition: [
                    { str_colName: 'Periodic_RepNo', value: int_periodic_RepNo }
                ]
            }
            var detailObj = {
                str_tableName: 'tbl_calibration_periodic_detail_vernier_incomplete',
                condition: [
                    { str_colName: 'Periodic_RepNo', value: int_periodic_RepNo }
                ]
            }
            await database.delete(masteObj);  //deleted
            await database.delete(detailObj); //deleted
            console.log('VERNIER PERIODIC COPIED..');
            var VernierRecalibStatusObject = globalData.arrVernierRecalibration.find(k => k.Ver_ID == strVerId);
            /* Updating the calibration Duedates in vernier after succesfull data copying if store
       type is 1 i-e set_days
       */
            // -----Start-----
            if (VernierRecalibStatusObject.PeriodicVerRecalib == 1) {
                var selectVerIDObj = {
                    str_tableName: 'tbl_recalibration_vernier_status',
                    data: [
                        { str_colName: 'PeriodicVerRecalib', value: 0 },
                        { str_colName: 'RecalibSetDt_periodic', value: null },],
                    condition: [
                        { str_colName: 'Ver_ID', value: strVerId, comp: 'eq' },
                    ]
                }
                await database.update(selectVerIDObj);
                return 'ok';
            } else if (VernierInfo.vernier_info[0].Ver_IsNew == 1 && (moment(objselectVersetDays[0][0].CalDueDT).format('YYYY-MM-DD') > moment().format('YYYY-MM-DD'))) {

                var updateBalDueDates = {
                    str_tableName: 'tbl_vernier',
                    data: [
                        { str_colName: "Ver_IsNew", value: 0 }
                    ],
                    condition: [
                        { str_colName: 'VernierID', value: strVerId },
                    ]

                }
                await database.update(updateBalDueDates);
                return 'ok';
            } else {
                var normalDate;
                var selectVersetDays = {
                    str_tableName: 'tbl_vernier',
                    data: '*',
                    condition: [
                        { str_colName: 'VernierID', value: strVerId, comp: 'eq' },
                    ]
                }
                var res1 = await database.select(selectVersetDays);
                if (res1[0][0].CalibStoreType.readUIntLE() == 1) {
                    let days = res1[0][0].CalDuration;
                    var date = new Date();
                    var dateInUTC = new Date(date.setDate(date.getDate() + days));

                    var normalDate = await normaDate.convertDate(dateInUTC);
                } else {
                    var arr = res1[0][0].Caldates.split(',');
                    var today = new Date();
                    var todayDate = moment().format('YYYY-MM-DD');
                    var month = today.getMonth() + 1;
                    month = ("0" + month).slice(-2);
                    var year = today.getFullYear();
                    var arr_calibdates = []
                    for (let d of arr) {
                        var day = ("0" + d).slice(-2)
                        var date = '';
                        date = year + '-' + month + '-' + day;
                        arr_calibdates.push(date);
                    }
                    var lastCalibDate = await this.checkIfLatestEntryResVernier(strVerId);
                    lastCalibDate = moment(lastCalibDate).format('YYYY-MM-DD');
                    console.log(arr_calibdates);
                    normalDate = "";
                    for (const [i, ddmmyy] of arr_calibdates.entries()) {
                        if (lastCalibDate < ddmmyy) {
                            normalDate = arr_calibdates[i];
                            break;
                        }
                    }
                    if (normalDate == "") {
                        var day = ("0" + arr[0]).slice(-2)
                        var date = '';
                        var month = today.getMonth() + 2;
                        month = ("0" + month).slice(-2);
                        date = year + '-' + month + '-' + day;
                        normalDate = date;
                    }
                }
                var updateBalDueDates = {
                    str_tableName: 'tbl_vernier',
                    data: [
                        { str_colName: 'CalDueDT', value: normalDate },
                        { str_colName: "Ver_IsNew", value: 0 }
                    ],
                    condition: [
                        { str_colName: 'VernierID', value: strVerId },
                    ]

                }
                await database.update(updateBalDueDates);
                let updateObj = {
                    str_tableName: 'tbl_calibration_periodic_master_vernier',
                    data: [
                        { str_colName: 'Periodic_DueDate', value: normalDate }
                    ],
                    condition: [
                        { str_colName: 'Periodic_RepNo', value: int_periodic_RepNo }
                    ]
                }
                await database.update(updateObj);
                // -----end-----
                return 'ok'
            }

        } catch (err) {
            throw new Error(err);
        }
    }

    async UpdateRecalibFLagPeriodic(strBalId, IDSSrNo) {
        try {
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
            if (objOwner.owner == 'analytical') {
                var recalliTable = `tbl_recalibration_balance_status`;
            } else {
                var recalliTable = `tbl_recalibration_balance_status_bin`;
            }
            var selectBalIDObj = {
                str_tableName: recalliTable,
                data: [
                    { str_colName: 'PeriodicBalRecalib', value: 0 },
                    { str_colName: 'RecalibSetDt_periodic', value: null },],
                condition: [
                    { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                ]
            }
            await database.update(selectBalIDObj);
            return 0;
        } catch (err) {
            throw new Error(err);
        }
    }

    async calibrationCalculation(CalibrationType, RepSrNo, balId = "") {
        try {

            switch (CalibrationType) {
                case 'R':
                    const RepetabilityMasterObj = {
                        str_tableName: "tbl_calibration_repetability_master_incomplete",
                        data: '*',
                        condition: [
                            { str_colName: 'Repet_RepNo', value: RepSrNo, comp: 'eq' }
                        ]
                    }
                    var RepetabilityMasterResult = await database.select(RepetabilityMasterObj);
                    var int_dpRep = RepetabilityMasterResult[0][0].Decimal_Point;
                    var repetLeastcount = Number(RepetabilityMasterResult[0][0].Repet_LeastCnt);
                    var repetAboveVal = 2 * 0.41 * repetLeastcount;
                    var repetAbove = math.roundUpPad(repetAboveVal, int_dpRep);
                    var repetBelowVal = Number(RepetabilityMasterResult[0][0].Repet_StdWeight);
                    var repetBelow = math.roundUpPad(repetBelowVal, int_dpRep);
                    var repetFinalcalVal = (repetAboveVal / repetBelowVal) * 100;
                    var repetFinalcal = math.roundUpPad(repetFinalcalVal, int_dpRep);

                    //AVg - remove + 1. Cipla 4 changes - 21/04/2021
                    var repetabilityCalculation = await dbCon.execute(`SELECT 
                    ROUND(CAST(STDDEV_SAMP(Repet_ActualWt) AS DECIMAL(20,15)), ${int_dpRep + 1}) AS rptStdVal,
                    ROUND(CAST(AVG(Repet_ActualWt) AS DECIMAL(20,15)), ${int_dpRep}) AS rptAvgVal 
                    FROM tbl_calibration_repetability_detail_incomplete WHERE Repet_RepNo = ${RepSrNo}`);
                    var reptVal = repetabilityCalculation[0][0];
                    var repeatabilityPercantage = await objSP.CalrepeatPercantage(RepSrNo, "tbl_calibration_repetability_detail_incomplete", balId);
                    var RemarkRepeat = repeatabilityPercantage[1][0]['@result'];
                    return RemarkRepeat;
                    console.log(RemarkRepeat)


                    break;

                case 'U':
                    const UncertinityMasterObj = {
                        str_tableName: "tbl_calibration_uncertinity_master_incomplete",
                        data: '*',
                        condition: [
                            { str_colName: 'Uncertinity_RepNo', value: RepSrNo, comp: 'eq' }
                        ]
                    }
                    var UncertinityMasterResult = await database.select(UncertinityMasterObj);


                    var dp = UncertinityMasterResult[0][0].Decimal_Point;

                    const UncertinityDetailCal = await dbCon.execute(`Select ROUND(CAST(AVG(Uncertinity_ActualWt) AS DECIMAL(20,15)),${dp + 1}) as avg,
                    ROUND(CAST(STDDEV_SAMP(Uncertinity_ActualWt) AS DECIMAL(20,15)),${dp + 1}) as stdDev from tbl_calibration_uncertinity_detail_incomplete where 
                    Uncertinity_RepNo = ${RepSrNo}`);
                    var meanVal = Number(UncertinityDetailCal[0][0].avg);
                    var stdDevVal = Number(UncertinityDetailCal[0][0].stdDev);
                    var rdsVal = (stdDevVal * 100) / meanVal;
                    var rds = math.roundUpPad(rdsVal, dp);
                    var mean = math.roundUpPad(meanVal, dp);
                    var stdDev = math.roundUpPad(stdDevVal, dp);


                    var UnStdValDp = 4 //for csk indore and CB

                    var uncertinityCalculation = await dbCon.execute(`SELECT 
                    ROUND(CAST(((STDDEV_SAMP(Uncertinity_ActualWt)*3)/Uncertinity_BalStdWt) AS DECIMAL(20,15)), ${dp}) AS UncertCal,
                    ROUND(CAST(STDDEV_SAMP(Uncertinity_ActualWt) AS DECIMAL(20,15)), ${UnStdValDp}) AS UncertStdVal,
                    ROUND(CAST(AVG(Uncertinity_ActualWt) AS DECIMAL(20,15)), ${dp}) AS UncertAvgVal,
                    CASE WHEN (ROUND(CAST(((STDDEV_SAMP(Uncertinity_ActualWt)*3)/Uncertinity_BalStdWt) AS DECIMAL(20,15)), ${dp}) > 0.001) THEN 'Not Complies' ELSE 'Complies' END AS remark
                    FROM tbl_calibration_uncertinity_detail_incomplete WHERE Uncertinity_RepNo = ${RepSrNo}`);

                    return uncertinityCalculation[0][0].remark;
                    //console.log(uncertinityCalculation)


                    break;
                case 'E':
                    const eccentricityMasterObj = {
                        str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Eccent_RepNo', value: RepSrNo, comp: 'eq' }
                        ]
                    }

                    const eccentricityDetailObj = {
                        str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                        data: '*',
                        condition: [
                            { str_colName: 'Eccent_RepNo', value: RepSrNo, comp: 'eq' }
                        ]
                    }
                    var eccentricityMaster = await database.select(eccentricityMasterObj);





                    var Eccdp = eccentricityMaster[0][0].Decimal_Point;



                    var eccentricityDetail = await database.select(eccentricityDetailObj);


                    var count = 0, finalVal;
                    for (var i = 0; i < eccentricityDetail.length; i++) {
                        var recNo = i + 1;
                        var int_val = 0.03;
                        const data = await dbCon.execute(`SELECT ROUND(ABS((ROUND(Eccent_ActualWt,${Eccdp}) - 
                (SELECT ROUND(Eccent_ActualWt,${Eccdp}) FROM tbl_calibration_eccentricity_detail_incomplete 
                WHERE Eccent_RepNo = ${RepSrNo} AND Eccent_RecNo = 1))*100/(SELECT ROUND(Eccent_ActualWt,${Eccdp}) FROM  tbl_calibration_eccentricity_detail_incomplete 
                WHERE Eccent_RepNo = ${RepSrNo} AND Eccent_RecNo = ${recNo})) ,${Eccdp})AS Deviation,
                CASE WHEN (SELECT (ROUND(ABS((ROUND(Eccent_ActualWt,${Eccdp}) - (SELECT ROUND(Eccent_ActualWt,${Eccdp}) FROM  tbl_calibration_eccentricity_detail_incomplete 
                WHERE Eccent_RepNo = ${RepSrNo} AND Eccent_RecNo = 1))*100/(SELECT ROUND(Eccent_ActualWt,${Eccdp}) FROM tbl_calibration_eccentricity_detail_incomplete
                WHERE Eccent_RepNo = ${RepSrNo} AND Eccent_RecNo = ${recNo})) ,${Eccdp})) > ${int_val}) THEN 'Not Ok' ELSE 'Ok' END AS remark  
                FROM
                tbl_calibration_eccentricity_detail_incomplete
                WHERE
                Eccent_RepNo = ${RepSrNo} AND Eccent_RecNo = ${recNo}`);


                        const remarkData = data[0][0];
                        if (remarkData.remark == "Not Ok") {
                            count = count + 1;
                        }

                    }
                    if (count > 0) { finalVal = 'Not Complies'; } else { finalVal = 'Complies'; };
                    // const eccentricityDetailCal = await dbCon.execute(`Select ROUND(CAST(AVG(Eccent_ActualWt) AS DECIMAL(20,15)),${dp + 1}) as avg,
                    // ROUND(CAST(STDDEV_SAMP(Eccent_ActualWt) AS DECIMAL(20,15)),${dp + 1}) as stdDev from tbl_calibration_eccentricity_detail_incomplete where 
                    // Eccent_RepNo = ${RepSrNo}`);
                    // var meanVal = Number(eccentricityDetailCal[0][0].avg);
                    // var stdDevVal = Number(eccentricityDetailCal[0][0].stdDev);
                    // var rdsVal = (stdDevVal * 100) / meanVal;
                    // var rds = math.roundUpPad(rdsVal,dp);
                    // var mean = math.roundUpPad(meanVal,dp);
                    // var stdDev = math.roundUpPad(stdDevVal,dp);
                    return finalVal;
                    break;

            }
        }
        catch (e) {
            console.log(e);
        }

    }


    async CheckHardnessModel(idsNo, str_Protocol) {
        try {
            var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            var hardnessId = cubicInfo.Sys_HardID;
            let qry = `select * from tbl_otherequipment where Eqp_ID='${hardnessId}' and Eqp_Type in ('Hardness','Tablet Tester')`
            var result = await database.execute(qry);
            return result[0][0];
        } catch (err) {
            throw new Error(err);
        }
    }


    async updateactivitylogfortesttermination(idsNo,weightment_type) {
        return new Promise(async (resolve, reject) => {
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == idsNo);
            var selectedIds;
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
            var productType = globalData.arrProductTypeArray.find(k => k.idsNo == idsNo);
            var objMenuMLHR = globalData.arrMultihealerMS.find(k => k.idsNo == idsNo);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = idsNo;
            }
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

            let typeValue = weightment_type;
            if (typeValue != undefined) {
               
                let TEST = '';
                switch (typeValue) {
                    case '1':
                        TEST = 'Individual';
                        break;
                    case '3':
                        if (productType.productType == '1') {
                            TEST = 'Thickness';
                        }
                        break;
                    case '4':
                        if (cubicalObj.Sys_Area != 'Capsule Filling' && productType.productType == '1') {
                            TEST = 'Breadth';
                        } else {
                            TEST = 'Diameter';
                        }
                        break;
                    case '5':
                        TEST = 'Length';

                        break;
                    case '6':
                        if (productType.productType == '1') {
                            TEST = 'Diameter';
                        }
                        break;
                    case '8':
                        TEST = 'Individual Layer 1';
                        if (serverConfig.ProjectName == 'RBH') {
                            TEST = 'Individual Empty';
                        }
                        break;
                    case '11':
                        TEST = 'Individual Layer 2';

                        break;
                    case 'L':
                        TEST = 'Individual Layer 2';
                        break;
                    case 'P':
                        TEST = 'PRTSIZE';
                        break;
                    case 'F':
                        TEST = '%Fine';
                        break;
                    case 'D':
                        if (productType.productType == '2') {
                            TEST = 'Differential';
                        }
                        break;
                    case 'Hardness':
                        TEST = 'Hardness';
                        break;
                    case 'DISINTEGRATION TESTER':
                        TEST = 'Disintegration Tester';
                        break;
                    case 'LOD':
                        TEST = 'LOD';
                        break;

                    case 'TAPPED DENSITY':
                        TEST = 'Tapped Density';
                        break;

                    case 'FRIABILATOR':
                        TEST = 'Friablity';

                        break;
                    case 'BALANCE':
                        TEST = 'Friablity';
                        break;
                    case 'Tablet Tester':
                        TEST = 'Tablet Tester';
                        break;
                    case 'I':
                        if (objMenuMLHR.menu != 'Sealed Cartridge' && productType.productType == '2') {
                            TEST = objMenuMLHR.menu;
                        } else {
                            TEST = "";
                        }
                        break;

                    case '2':
                        TEST = 'Group';
                        break;
                    case '10':
                        TEST = 'Group Layer 1';
                        break;
                    case 'K':
                        TEST = 'Group Layer 2';
                        break;
                }
                // var productType1 = globalData.arrProductTypeArray.find(k => k.idsNo ==idsNo);
                var objActivity = {};
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: `${TEST} test is Terminated on` + " " + 'IDS :' + " " + idsNo });
                objActivityLog.ActivityLogEntry(objActivity).then(() => { resolve("ok") }).catch(error => { console.log(error); });
            }else{
                resolve("ok");
            }


           
        })


    }



    //****************************************************************************************************** */
    /*
    CLASS ENDS.
    */
}
module.exports = CommanFunction;