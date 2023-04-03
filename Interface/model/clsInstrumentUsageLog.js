
var globalData = require('../global/globalData');
const date = require('date-and-time');
var Database = require('../database/clsQueryProcess');
var database = new Database();
/**
 *@description Class holding methods of instrument usage Log 
 */
class InstrumentUsageLog {
    /**
     * 
     * @param {*} instrument Type of instrument
     * @param {*} IdsNo Ids number
     * @param {*} tableName TableName for instrumwnt usage
     * @param {*} activity Weighment type
     * @param {*} options Whether started or completed
     */
    InstrumentUsage(instrument, IdsNo, tableName, activity, options) {
        var selectedIds;
        // here we are selecting IDS functionality for that cubicle 
        const IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds
        } else {
            selectedIds = IdsNo; // for compression and coating
        };
        var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
        var selectedCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsNo);

        var instrumentId;
        switch (instrument) {
            case 'Balance':
                instrumentId = tempCubicInfo.Sys_BalID;
                if (objOwner.owner == 'analytical') {
                     instrumentId = tempCubicInfo.Sys_BalID;
                } else {
                     instrumentId = tempCubicInfo.Sys_BinBalID;
                }
                //instrumentId = tempCubicInfo.Sys_BalID;
                break;
            case 'Vernier':
                instrumentId = tempCubicInfo.Sys_VernierID;
                break;
            case 'Hardness':
                instrumentId = tempCubicInfo.Sys_HardID;
                break;
            case 'DT':
                instrumentId = tempCubicInfo.Sys_DTID;
                break;
            case 'TDT':
                instrumentId = tempCubicInfo.Sys_TapDensityID;
                break;
            case 'Friability':
                instrumentId = tempCubicInfo.Sys_FriabID;
                break;
            case 'LOD':
                instrumentId = tempCubicInfo.Sys_MoistID;
                break;
        }
        if (options == 'started') {
            var now = new Date();
            var activityObject = {
                str_tableName: tableName,
                data: [
                    { str_colName: 'EqpID', value: instrumentId },
                    { str_colName: "FromDT", value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: "FromTM", value: date.format(now, 'HH:mm:ss') },
                    { str_colName: "BatchNo", value: selectedCubic.Sys_Batch },
                    { str_colName: "BFGCode", value: selectedCubic.Sys_BFGCode },
                    { str_colName: "Activity", value: activity },
                    { str_colName: "UserId", value: tempUserObject.UserId },
                    { str_colName: "UserName", value: tempUserObject.UserName },
                    { str_colName: "department_name", value: selectedCubic.Sys_dept },
                    { str_colName: "ToDT", value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: "ToTM", value: date.format(now, 'HH:mm:ss') },
                ]
            }
            database.save(activityObject).catch(err => {
                console.log('Error in saving instrument usage for' + instrument)
            })

        } else {
            var now = new Date();
            // Selecting Max Record number
            var selectDataToUpdate = {
                str_tableName: tableName,
                data: 'MAX(RecNo) as RecNo',
                condition: [
                    { str_colName: 'BatchNo', value: selectedCubic.Sys_Batch },
                    { str_colName: 'BFGCode', value: selectedCubic.Sys_BFGCode },
                    { str_colName: 'UserId', value: tempUserObject.UserId },
                    { str_colName: 'UserName', value: tempUserObject.UserName }
                ]
            }
            database.select(selectDataToUpdate).then((res) => {
                var RecNo = res[0][0].RecNo;
                var updateactivityObject = {
                    str_tableName: tableName,
                    data: [
                        { str_colName: "ToDT", value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: "ToTM", value: date.format(now, 'HH:mm:ss') },
                    ],
                    condition: [
                        { str_colName: 'RecNo', value: RecNo }
                    ]
                }
                database.update(updateactivityObject).catch(err => { console.log(err) })
            }).catch(err => { console.log(err) })
        }
    }
}
module.exports = InstrumentUsageLog;