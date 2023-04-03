const Database = require('../database/clsQueryProcess');
const database = new Database();
const date = require('date-and-time')
var now = new Date();
const globalData = require('../global/globalData');
const IndividualOperation = require('./Weighments/clsIndividualOperation');
const VernierMeasurementOperation = require('./Weighments/clsVernierMeasurementOperation');
const GroupOperation = require('./Weighments/clsGroupOperation');
const FormulaFun = require('./Product/clsformulaFun');
const WeighmentTableSchema = require('./Weighments/clsWeighmentDataTransfer');
const InCompleteGranulation = require('../model/Granulation/clsIncompleteGranulationDataSave');
const CompleteGranulation = require('../model/Granulation/clsCompleteGranulationDataSave');
const MoveGranData = require('../model/Granulation/clsGranulationMoveData');
const MultiHaler = require('../model/Multihaler/clsMultihaler');
const BulkWeighment = require('../model/clsBulkWeighment');
const objBulkWeighment = new BulkWeighment();
const IndividualOperationForDiff = require('./Weighments/clsIncompleteDataSaveForDiff');
const PowerBackup = require('./clsPowerBackupModel');
const jsonTareCmd = require('../global/tare.json');

const individualOperation = new IndividualOperation();
const individualOperationDiff = new IndividualOperationForDiff()
const objMultihaler = new MultiHaler();
const vernierMeasurementOperation = new VernierMeasurementOperation();
const groupOperation = new GroupOperation();
const formulaFun = new FormulaFun();
const objMoveGranData = new MoveGranData();
const objWeighmentTableSchema = new WeighmentTableSchema();
const objIncompleteGran = new InCompleteGranulation();
const objCompleteGran = new CompleteGranulation();
const WeighmentModel = require('../../Interfaces/clsWeighment.model');
const clsActivityLog = require('./clsActivityLogModel');
const objActivityLog = new clsActivityLog();
const InstrumentUsage = require('./clsInstrumentUsageLog');
const objInstrumentUsage = new InstrumentUsage();
const clsCheckGranulation = require('./Granulation/clsCheckGranulationData');
const objCheckGran = new clsCheckGranulation();
var clsMonitor = require('../model/MonitorSocket/clsMonitSocket');
const objMonitor = new clsMonitor();
const clsRemarkInComplete = require('../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();
const clsContainer = require('./Container/Container.class');
const serverConfig = require('../global/severConfig');
const objContainer = new clsContainer();
const clspowerbackup = new PowerBackup();


class ProcessWeighment {

    async insertWeighmentData(IdsNo, protocol) {

        //console.log(protocol);
        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IdsNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IdsNo));
        let strBalId = tempCubicInfo.Sys_BalID;
        var tareCmd = "";
        var appendVal = "";
        var balSrNo = "";

        if (strBalId != "None") {

            if (objOwner.owner == 'analytical') {
                strBalId = tempCubicInfo.Sys_BalID;
            } else {
                strBalId = tempCubicInfo.Sys_BinBalID;
            }
            var selectBalObj = {
                str_tableName: 'tbl_balance',
                data: '*',
                condition: [
                    { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                ]
            }
            let resultBal = await database.select(selectBalObj);

            if (resultBal[0].length != 0) {
                balSrNo = resultBal[0][0].Bal_SrNo;
            } else {
                balSrNo = "";
            }
            var tempIM = globalData.arrHexInfo.find(k => k.idsNo == IdsNo);
            //var str_ProtocolIdentification = protocol.substring(0, 2);




            if (resultBal[0][0].Bal_Make.includes('Mettler') || resultBal[0][0].Bal_Make.includes('METTLER')) {
                var objTareCmd = jsonTareCmd.Mettler.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
                if (objTareCmd == undefined) {

                    appendVal = jsonTareCmd.Mettler.find(mod => mod.Model == "Default").TareCmd;
                }
                else {
                    objTareCmd.SendCmd == "Y" ? appendVal = objTareCmd.TareCmd : appendVal = ""; // if tare command is configure not to send then it will not send  tare command.
                }
            }
            else if (resultBal[0][0].Bal_Make.includes('Sarto') || resultBal[0][0].Bal_Make.includes('SARTO')) {
                var objTareCmd = jsonTareCmd.Satorious.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
                if (objTareCmd == undefined) {
                    appendVal = jsonTareCmd.Satorious.find(mod => mod.Model == "Default").TareCmd;
                }
                else {
                    objTareCmd.SendCmd == "Y" ? appendVal = objTareCmd.TareCmd : appendVal = ""; // if tare command is configure not to send then it will not send  tare command.
                }

            }
            else {
                appendVal = "T"
            }

            // if (balSrNo.includes('ML')) {
            //     appendVal = 'T'
            //     //appendVal = 'Z'

            // } else {
            //     appendVal = 'Z'
            //     //appendVal = 'T'


            // }
            if (serverConfig.tareFlag == 'MLH') {
                appendVal = 'T ';
            }
            var escChar = String.fromCharCode(27);
            if (tempIM.IM != "IMC3") {
                if (appendVal != "") {
                    if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                        tareCmd = ""
                    }
                    else if (appendVal == "T" && (resultBal[0][0].Bal_Make.includes('Sarto') || resultBal[0][0].Bal_Make.includes('SARTO'))) {
                        tareCmd = `SP10${escChar}${appendVal},`
                    }
                    else {
                        tareCmd = `SP10${appendVal},`
                    }
                }
                //this.sendProtocol('SP10Z,', str_IpAddress);
            } else {
                if (appendVal != "") {
                    if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                        tareCmd = ""
                    }
                    else if (resultBal[0][0].Bal_Make.includes('Sarto') || resultBal[0][0].Bal_Make.includes('SARTO')) {
                        tareCmd = `SP20${escChar}${appendVal},`
                    }
                    else {
                        tareCmd = `SP20${appendVal},`
                    }
                }
                //this.sendProtocol('SP20Z,', str_IpAddress);
            }

            if (serverConfig.ProjectName == 'RBH') {
                tareCmd = "";
            }
        }
        var responseObj = {};
        var protocolType, typeValue, typeValueInstr;

        var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
        var tempDiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);//arr for differential
        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IdsNo);
        if (protocol.length == 6) // to handle WC Protocol
        {
            protocolType = protocol.substring(0, 2);//here incoming protocol is check WC from given weight
            typeValue = protocol.substring(3, 2);//here incoming type is check 1= individual,2=group,,,etc from given weigh
        }
        else {
            var actualWt = protocol.split(" ");
            var type = actualWt[0];
            protocolType = type.substring(0, 2);//here incoming protocol is check WT OR WC from given weight
            if (protocolType != "NW") {
                typeValue = type.substring(3, 2);//here incoming type is check 1= individual,2=group,,,etc from given weight


                if (typeValue == "D") { // protocols for differential are diff
                    var sample = actualWt[0].substring(5);//here sample number is taken from protocol
                    var actualSampleValue = sample//'actualWt[1]
                    //console.log(actualSampleValue);
                    var DiffType = actualWt[0].substring(4, 5);
                    actualSampleValue = parseInt(actualSampleValue);
                } else if (protocol.substring(3, 2) != "G" && protocol.substring(3, 2) != "N") {
                    var sample = actualWt[1].substring(1, 4);//here sample number is taken from protocol
                    var actualSampleValue = actualWt[1].substring(4, 1);
                    //console.log(actualSampleValue);
                    actualSampleValue = parseInt(actualSampleValue);
                }
                if (typeValue == "D") {
                    let paramUnit, weightValue;
                    if (tempDiffData == undefined) {

                        globalData.arrdifferential.push({
                            idsNo: IdsNo,
                            fillWgt: 0,
                            emptyWgt: 0,
                            content1: 0,
                            content2: 0,
                            content3: 0,
                            content4: 0,
                            side: ""
                        });
                    }
                    paramUnit = tempLimObj.Differential.unit;
                    tempDiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);//arr for differential
                    tempDiffData.side = actualWt[0].substring(3, 4);
                    let incomingUnit = actualWt[2].split(/N|R|r|n/)[0].toLowerCase();
                    let sampleFromProtocol = actualWt[0].replace(/^\D+/g, '');
                    let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                    weightValue = actualWt[1];
                    if (compareUnit != paramUnit.toLowerCase().substring(0, 1)) {
                        if (paramUnit.toLowerCase().substring(0, 1) == 'g') {
                            weightValue = parseFloat(formulaFun.FormatNumberString(parseFloat(actualWt[1]) / 1000, 4)); // mg->gm
                        } else {
                            weightValue = parseFloat(actualWt[1]) * 1000; // mg -> gm
                        }
                    }
                    //WTDC13001within limit,capsule,,
                    if (DiffType == "F") {
                        // if (serverConfig.ProjectName == 'SunHalolGuj1' && actualWt[2].includes("mg") == false) {
                        //     tempDiffData.fillWgt = (parseFloat(actualWt[1]) * 1000);
                        // }
                        // else {
                        tempDiffData.fillWgt = weightValue;
                        // }
                    } else if (DiffType == "C") {
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        let contentCount = tempContentObj.contentNumber;
                        if (contentCount == 1) {
                            let DiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);
                            let netWeight = parseFloat(DiffData.fillWgt) - parseFloat(DiffData.emptyWgt)
                            tempDiffData.content1 = weightValue;


                            if (parseFloat(DiffData.content1) > netWeight) {
                                //console.log(parseFloat(DiffData.content1));
                                //console.log(netWeight);
                                return `WTDCD${contentCount}${sampleFromProtocol}Content${contentCount} Weight must ,be < ${netWeight},0,SP10T`
                            }
                        } else if (contentCount == 2) {
                            let DiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);
                            let netWeight = parseFloat(DiffData.fillWgt) - parseFloat(DiffData.emptyWgt)
                            tempDiffData.content2 = weightValue;



                            if (parseFloat(tempDiffData.content2) > netWeight) {

                                return `WTDCD${contentCount}${sampleFromProtocol}Content${contentCount} Weight must, be < ${netWeight},0,SP10T`
                                //`DM3E0 content2 < net `;
                            } else if ((parseFloat(tempDiffData.content2) + parseFloat(tempDiffData.content2)) > netWeight) {

                                return `WTDCD${contentCount}${sampleFromProtocol}Content${contentCount} Weight must, be < ${netWeight},0,SP10T`
                                //`DM3E0 content1+content2 < net `;
                            }


                        } else if (contentCount == 3) {
                            tempDiffData.content3 = weightValue;
                        } else if (contentCount == 4) {
                            tempDiffData.content4 = weightValue;
                        }
                    } else {
                        // if (serverConfig.ProjectName == 'SunHalolGuj1' && actualWt[2].includes("mg") == false) {
                        //     tempDiffData.emptyWgt = (parseFloat(actualWt[1]) * 1000);
                        // }
                        // else {
                        tempDiffData.emptyWgt = weightValue;
                        if (parseFloat(tempDiffData.fillWgt) < parseFloat(tempDiffData.emptyWgt)) {
                            return `WTDCD0${sampleFromProtocol} Empty Weight must ,be < ${parseFloat(tempDiffData.fillWgt)},0,SP10T`

                        }

                        // }
                    }
                }
            }

        }



        //below data is taken according to given ids number
        // Here we have to check for IPQC as wll
        var selectedIds;
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = IdsNo;
        }
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

        // globalData.arrVernierData is fill from here// 
        var tempIds = { 'IdsNum': IdsNo, 'flag': false };
        var vernierObj = globalData.arrVernierData.find(k => k.IdsNum == IdsNo);
        if (vernierObj == undefined) {
            globalData.arrVernierData.push(tempIds);
        }

        var le;
        var vernierObj = globalData.arrVernierData.find(k => k.IdsNum == IdsNo);
        if (protocolType == "WT") {
            if (typeValue != "G" && typeValue != "N" && typeValue != "D") {
                await objRemarkInComplete.updateEntry(IdsNo, typeValue);
            }
            //this block will work for Individual(1),ndividual Layer(8),//Individual Layer 1 (L FROM IDS =11)
            if ((typeValue == '1') || (typeValue == '8') || (typeValue == 'L')) {
                //if ((typeValue == 1) || (typeValue == 8) || (typeValue == 'L')) { modified by vivek11101997 matching int to string 
                var intWeighmentNo, intWeighmentNoinStr;
                if (typeValue == '8') {
                    //if (typeValue == '8') { 
                    intWeighmentNo = 9;
                    intWeighmentNoinStr = '9';
                }
                else if (typeValue == 'L') {
                    intWeighmentNo = 11;
                    intWeighmentNoinStr = '11';
                }
                else {
                    intWeighmentNo = typeValue;

                }
                var responseType = actualWt[3].split("");
                var actualResponseType = responseType[1].toUpperCase();//here weight is check, R = repeat and N = new
                var weightValue = parseFloat(actualWt[2]);
                //    if (actualResponseType == "N" || actualResponseType == "R") {
                var intNos, maxLimit, minLimit, productUnit;

                var objActivity = {}
                //Storing Activity Log*****************************************************
                if (typeValue == '1') { // Individual
                    if (sample == '001') { // Activity will log for the first weight only
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Individual Weighment Started on IDS' + IdsNo });

                        var objresActLogind = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresIntrLogind = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Individual', 'started')
                    }
                    intNos = tempLimObj.Individual.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Individual);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Individual);
                    productUnit = tempLimObj.Individual.unit;
                } else if (typeValue == '8') { // Individual Layer
                    var activity = "Individual Layer 1";
                    var paramName = 'Ind_Layer';
                    if (serverConfig.ProjectName == "RBH") {
                        activity = 'Individual Empty';
                        paramName = 'Ind_Empty';
                    }
                    if (sample == '001') { // Activity will log for the first weight only

                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: `${activity} Weighment Started on IDS` + IdsNo });
                        var objResActLogindLayr = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objResIntrLogindLayr = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', activity, 'started');
                    }
                    intNos = tempLimObj[paramName].noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj[paramName]);
                    minLimit = formulaFun.lowerLimit(tempLimObj[paramName]);
                    productUnit = tempLimObj[paramName].unit;
                } else if (typeValue == 'L' || (typeValue == 11)) { //Individual Layer 1
                    if (sample == '001') { // Activity will log for the first weight only
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Individual Layer 2 Weighment Started on IDS' + IdsNo });
                        var objresActLogindLayr1 = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresIntrLogindLayr1 = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Individual Layer 2', 'started')
                    }
                    intNos = tempLimObj.Ind_Layer1.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Ind_Layer1);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Ind_Layer1);
                    productUnit = tempLimObj.Ind_Layer1.unit;
                }
                if (parseInt(sample) == 1) {
                    await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                }
                //DONE Storing Activity Log*****************************************************
                // Incoming Unit checking and conversion and w.r.t product unit  
                let incomingUnit = actualWt[3].split(/N|R|r|n/)[0].toLowerCase();
                let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                    if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                        weightValue = formulaFun.FormatNumberString(weightValue / 1000, 4); // mg->gm
                    } else {
                        weightValue = weightValue * 1000; // mg -> gm
                    }
                }
                if (parseInt(actualSampleValue) < intNos) { //storing incomplete data

                    ///for storing incomplete data*************************************************************
                    var objresIndIncomp = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);
                    //*************************************************************************************** */
                    // ,,,0,->for any sample; ,,,1, ->last sample // for LL protocol
                    //for Below limit
                    if (serverConfig.ProjectName == "RBH") {// this block is only for indEmpty "RBH" project
                        var withinlimit = `${protocolType}${typeValue}010${sample}Within Limit,,,0,${tareCmd}`;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                        return withinlimit
                    }
                    else {
                        if (parseFloat(weightValue) < parseFloat(minLimit)) {
                            var belowlimit = `${protocolType}${typeValue}0B0${sample}Below Limit,,,0,${tareCmd}`;
                            vernierObj.flag = true;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } })
                            return belowlimit
                        }
                        else if (parseFloat(weightValue) > parseFloat(maxLimit)) {//for Above limit
                            var abovelimit = `${protocolType}${typeValue}0A0${sample}Above Limit,,,0,${tareCmd}`;
                            vernierObj.flag = true;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } })
                            return abovelimit
                        }
                        else {//for Within limit
                            var withinlimit = `${protocolType}${typeValue}010${sample}Within Limit,,,0,${tareCmd}`;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                            return withinlimit
                        }
                    }
                }
                else {// storing complete data
                    //storing last sample incomplete data****************************************************************************
                    var objresIndIncompF = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);
                    /************************************************************************************************************** */
                    var sendLastLimitMsg;
                    if (serverConfig.ProjectName == "RBH") {
                        sendLastLimitMsg = `${protocolType}${typeValue}010${sample}Within Limit,,,1,${tareCmd}`;

                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } });
                        // return sendLastLimitMsg
                    }
                    else {
                        if (parseFloat(weightValue) < parseFloat(minLimit)) {//for below limit
                            var sendLastLimitMsg = `${protocolType}${typeValue}0B0${sample}Below Limit,,,1,${tareCmd}`;
                            vernierObj.flag = true;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } });
                            // return belowlimit
                        }
                        else if (parseFloat(weightValue) > parseFloat(maxLimit)) {//for Above limit
                            var sendLastLimitMsg = `${protocolType}${typeValue}0A0${sample}Above Limit,,,1,${tareCmd}`;
                            vernierObj.flag = true;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } });
                            // return abovelimit
                        }
                        else {//for within limit
                            var sendLastLimitMsg = `${protocolType}${typeValue}010${sample}Within Limit,,,1,${tareCmd}`;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } });
                            // return withinlimit
                        }
                    }
                    // if (parseFloat(weightValue) < parseFloat(minLimit)) {//for below limit
                    //     vernierObj.flag = true;
                    //     objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } })
                    // }
                    // else if (parseFloat(weightValue) > parseFloat(maxLimit)) {//for Above limit
                    //     vernierObj.flag = true;
                    //     objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } })
                    // }
                    // else {//for within limit
                    //     objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                    // }
                    //storing final Data*****************************************************************************************
                    var objresIndComp = await this.saveToComplete(intWeighmentNo, cubicalObj, typeValue, tempUserObject, IdsNo, vernierObj);
                    //storing remark
                    var objRemark = globalData.arrLLsampleRemark.find(k => k.idsNo == IdsNo);
                    if (objRemark == undefined) { globalData.arrLLsampleRemark.push({ idsNo: IdsNo, remark: objresIndComp }) }
                    else {
                        objRemark.remark = objresIndComp;
                    }
                    return sendLastLimitMsg
                    //return objresIndComp;
                    //******************************************************************************************************** */
                }
                // }
            } else if ((typeValue == '2') || (typeValue == '9') || (typeValue == 'K')) {//group loop Group WT2N N ,A 4.9 gN
                var objActivity = {};
                var groupWeightVal = actualWt[3];
                var actualResponseType = actualWt[4].split('');
                var sample = '001';

                // if (actualResponseType[1].toUpperCase() == "N" || actualResponseType[1].toUpperCase() == "R") {
                var intNos, maxLimit, minLimit;
                //for storing activity log*****************************************************************
                if (typeValue == '2') {
                    if (sample == '001') {
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Group Weighment Started on IDS' + IdsNo });
                        var objresActLogGrp = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresInstrLogGrp = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Group', 'started');
                    }
                    intNos = tempLimObj.Group.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Group);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Group);
                    productUnit = tempLimObj.Group.unit;

                } else if (typeValue == '9') {
                    if (sample == '001') {
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Group Layer 1 Weighment Started on IDS' + IdsNo });
                        var objresActLogGrpLayr = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresInstrLogGrpLayr = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Group Layer 1', 'started')
                    }
                    intNos = tempLimObj.Grp_Layer.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Grp_Layer);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Grp_Layer);
                    productUnit = tempLimObj.Grp_Layer.unit;
                } if (typeValue == 'K') {
                    if (sample == '001') {
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Group Layer 2 Weighment Started on IDS' + IdsNo });
                        var objresActLogGrpLayr1 = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresInstrLogGrpLayr1 = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Group Layer 2', 'started')
                    }
                    intNos = tempLimObj.Grp_Layer1.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Grp_Layer1);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Grp_Layer1);
                    productUnit = tempLimObj.Grp_Layer1.unit;
                }
                //done for storing Activity log*************************************************************
                // Incoming Unit checking and conversion and w.r.t product unit  
                let incomingUnit = actualWt[4].split(/N|R|r|n/)[0].toLowerCase();
                let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                    if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                        groupWeightVal = formulaFun.FormatNumberString(groupWeightVal / 1000, 5); // mg->gm
                    } else {
                        groupWeightVal = groupWeightVal * 1000; // mg -> gm
                    }
                }
                var objresSaveGrpDatacomp = await groupOperation.saveCompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, groupWeightVal);
                objMonitor.monit({ case: 'LE', idsNo: IdsNo, data: objresSaveGrpDatacomp });
                if (parseFloat(groupWeightVal) < parseFloat(minLimit)) {
                    le = objresSaveGrpDatacomp
                    objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: groupWeightVal, flag: 'out' } })
                } else if (parseFloat(groupWeightVal) > parseFloat(maxLimit)) {
                    le = objresSaveGrpDatacomp
                    objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: groupWeightVal, flag: 'out' } })
                }
                else {
                    le = objresSaveGrpDatacomp
                    objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: groupWeightVal, flag: 'in' } })
                }
                // Activity Log for completion of weigghment
                var objActivity = {}
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'Weighment completed on IDS' + IdsNo });
                var objresActLogGrpUpdt = await objActivityLog.ActivityLogEntry(objActivity);
                var objresInstLogGrpUpdt = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed')
                return le;
                // }
            } else if ((typeValue == '3') || (typeValue == '4') || (typeValue == '5') || (typeValue == '6')) {//thickness,Breadth,Length,Diameter loop
                var objActivity = {}

                //here weight and unit come in comma separate form 
                var vernierWeightValue = actualWt[2].split(",")[0];//weight value
                var responseval = actualWt[2].split(",")[1];//unit value
                var actualResponseType = responseval.split('');

                /// if (actualResponseType[0].toUpperCase() == "N" || actualResponseType[0].toUpperCase() == "R") {

                var intNos, maxLimit, minLimit;
                var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                //Storing activity log************************************************************************************
                if (typeValue == '3') {
                    if (sample == '001') {
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Thickness Weighment started on IDS' + IdsNo });
                        var objresActLogThick = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresInstrLogThick = await objInstrumentUsage.InstrumentUsage('Vernier', IdsNo, 'tbl_instrumentlog_vernier', 'Thickness', 'started');
                    }
                    intNos = tempLimObj.Thickness.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Thickness);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Thickness);
                } else if (typeValue == '4') {
                    if (sample == '001') {
                        var strActivity = objProductType.productType == 2 ? 'Diameter Weighment started on IDS' + IdsNo : 'Breadth Weighment started on IDS' + IdsNo
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: strActivity });
                        var objresActLogBredth = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start

                        var objresInstrLogBredth = await objInstrumentUsage.InstrumentUsage('Vernier', IdsNo, 'tbl_instrumentlog_vernier', 'Breadth', 'started')

                    }
                    if (objProductType.productType == 2) {
                        intNos = tempLimObj.Diameter.noOfSamples;
                        maxLimit = formulaFun.upperLimit(tempLimObj.Diameter);
                        minLimit = formulaFun.lowerLimit(tempLimObj.Diameter);
                    }
                    else {
                        intNos = tempLimObj.Breadth.noOfSamples;
                        maxLimit = formulaFun.upperLimit(tempLimObj.Breadth);
                        minLimit = formulaFun.lowerLimit(tempLimObj.Breadth);
                    }


                } else if (typeValue == '5') {
                    if (sample == '001') {
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Length Weighment started on IDS' + IdsNo });
                        var objresActLogLength = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresInstrLogLength = await objInstrumentUsage.InstrumentUsage('Vernier', IdsNo, 'tbl_instrumentlog_vernier', 'Length', 'started');

                    }
                    intNos = tempLimObj.Length.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Length);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Length);
                } else if (typeValue == '6') {
                    if (sample == '001') {
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Diameter Weighment started on IDS' + IdsNo });
                        var objresActLogDim = await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        var objresInstrLogLength = await objInstrumentUsage.InstrumentUsage('Vernier', IdsNo, 'tbl_instrumentlog_vernier', 'Diameter', 'started');

                    }
                    intNos = tempLimObj.Diameter.noOfSamples;
                    maxLimit = formulaFun.upperLimit(tempLimObj.Diameter);
                    minLimit = formulaFun.lowerLimit(tempLimObj.Diameter);
                }
                if (parseInt(sample) == 1) {
                    await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                }
                //done storing activity log********************************************************************************

                if (parseInt(actualSampleValue) < intNos) {// storing Incomplete data
                    var objresSaveVerDataInComp = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);

                    if (parseFloat(vernierWeightValue) < parseFloat(minLimit)) {
                        var belowlimit = `${protocolType}${typeValue}0B0${sample}Below Limit,,,0,${tareCmd}`;
                        vernierObj.flag = true;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: vernierWeightValue, flag: 'out' } })
                        return belowlimit;
                    }
                    else if (parseFloat(vernierWeightValue) > parseFloat(maxLimit)) {
                        var abovelimit = `${protocolType}${typeValue}0A0${sample}Above Limit,,,0,${tareCmd}`;
                        vernierObj.flag = true;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: vernierWeightValue, flag: 'out' } })
                        return abovelimit;
                    }
                    else {
                        var withinlimit = `${protocolType}${typeValue}010${sample}Within Limit,,,0,${tareCmd}`;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: vernierWeightValue, flag: 'in' } })
                        return withinlimit;
                    }

                } else { //storing complete data 
                    var objresSaveVerDataInCompF = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);
                    var sendLastLimitMsg;
                    if (parseFloat(vernierWeightValue) < parseFloat(minLimit)) {
                        sendLastLimitMsg = `${protocolType}${typeValue}0B0${sample}Below Limit,,,1,${tareCmd}`;
                        vernierObj.flag = true;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: vernierWeightValue, flag: 'out' } })
                    }
                    else if (parseFloat(vernierWeightValue) > parseFloat(maxLimit)) {
                        var sendLastLimitMsg = `${protocolType}${typeValue}0A0${sample}Above Limit,,,1,${tareCmd}`;
                        vernierObj.flag = true;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: vernierWeightValue, flag: 'out' } })
                    }
                    else {
                        var sendLastLimitMsg = `${protocolType}${typeValue}010${sample}Within Limit,,,1,${tareCmd}`;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: vernierWeightValue, flag: 'in' } })
                    }
                    var objresSaveVerDataComp = await this.saveToComplete(typeValue, cubicalObj, typeValue, tempUserObject, IdsNo, vernierObj, "Vernier");
                    var objRemark = globalData.arrLLsampleRemark.find(k => k.idsNo == IdsNo);
                    if (objRemark == undefined) { globalData.arrLLsampleRemark.push({ idsNo: IdsNo, remark: objresSaveVerDataComp }) }
                    else {
                        objRemark.remark = objresSaveVerDataComp;
                    }
                    return sendLastLimitMsg
                    // return objresSaveVerDataComp;
                }
                // }
            } else if (typeValue == 'P')// particle seizing
            {
                var responseType = actualWt[3].split('');
                responseType[1].toUpperCase();
                var actualSampleValue = actualWt[1].substring(4, 3);
                actualSampleValue = parseFloat(actualSampleValue);
                // if (actualResponseType == "N" || actualResponseType == "R") // only new weight will accept
                // {
                var intNos, maxLimit, minLimit;
                var objActivity = {}
                if (actualSampleValue == 1) {
                    await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Particle Seizing Weighment Started on IDS' + IdsNo });
                    await objActivityLog.ActivityLogEntry(objActivity);
                    // Instrument Usage log for balance start
                    await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Particle Seizing', 'started');
                }
                var weightValue = actualWt[2];
                // console.log(weightValue);
                intNos = tempLimObj.PartSize.noOfSamples;
                maxLimit = tempLimObj.PartSize.T1Pos;
                minLimit = tempLimObj.PartSize.T1Neg;
                if (actualSampleValue <= intNos) {
                    if (actualSampleValue != 1) {
                        await objIncompleteGran.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                        let count = actualSampleValue + 1;
                        let message;
                        switch (count) {
                            case 2:
                                message = "ABOVE 20 MESH";
                                break;
                            case 3:
                                message = "ABOVE 40 MESH";
                                break;
                            case 4:
                                message = "ABOVE 60 MESH";
                                break;
                            case 5:
                                message = "ABOVE 80 MESH";
                                break;
                            case 6:
                                message = "ABOVE 100 MESH";
                                break;
                            case 7:
                                message = "FINES ON TRAY";
                                break;
                            case 8:
                                message = "";
                                break;
                        }
                        await objCheckGran.checkGranulation(cubicalObj, typeValue, weightValue, IdsNo);

                        // if (objresGranulation.result == 'success') {

                        let sendProtocol = `WPP00${count}${message},`;
                        return sendProtocol;
                        // if (actualSampleValue != 8) {
                        // }
                        // } else if (objresGranulation.result == 'fail' && count == 8) {
                        //     let sendProtocol = `WPP00${count}${message},`;
                        //     return sendProtocol;
                        // }
                        // else {
                        //     // let sendProtocol = `ID3 Test Failed,,,,`;
                        //     // return sendProtocol;
                        //     let sendProtocol = `WPP00${count}${message},`;
                        //     return sendProtocol;
                        // }
                    }
                    else {
                        await objIncompleteGran.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);


                        let count = actualSampleValue + 1;
                        let message;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                        switch (count) {
                            case 2:
                                message = "ABOVE 20 MESH";
                                break;
                            case 3:
                                message = "ABOVE 40 MESH";
                                break;
                            case 4:
                                message = "ABOVE 60 MESH";
                                break;
                            case 5:
                                message = "ABOVE 80 MESH";
                                break;
                            case 6:
                                message = "ABOVE 100 MESH";
                                break;
                            case 7:
                                message = "FINES ON TRAY";
                                break;
                            case 8:
                                message = "";
                                break;
                        }
                        let sendProtocol = `WPP00${count}${message},`;
                        if (actualSampleValue != 8) {
                            return sendProtocol;
                        }

                    }

                }
                // }
                // else {
                //     console.log("NOT N");
                // }
            } else if (typeValue == 'F')//PERCENTAGE FINE
            {
                var responseType = actualWt[3].split('');
                var actualResponseType = responseType[1].toUpperCase();
                var actualSampleValue = actualWt[1].substring(4, 3);
                actualSampleValue = parseFloat(actualSampleValue);
                // if (actualResponseType == "N" || actualResponseType == "R") // only new weight will accept
                // {
                var intNos, maxLimit, minLimit;
                var objActivity = {}
                if (actualSampleValue == 1) {
                    await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: '% FINE Weighment Started on IDS' + IdsNo });
                    var objresActLogPFine = await objActivityLog.ActivityLogEntry(objActivity);
                    // Instrument Usage log for balance start
                    var objresInstrLogPFine = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '% Fine', 'started');
                }

                var weightValue = actualWt[2];
                intNos = 2;//tempLimObj.PerFine.noOfSamples;
                maxLimit = tempLimObj.PerFine.T1Pos;
                minLimit = tempLimObj.PerFine.T1Neg;
                if (actualSampleValue <= intNos) {
                    if (actualSampleValue != 1) {

                        var objresSaveDataInCompPFine = await objIncompleteGran.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                        let count = actualSampleValue + 1;
                        let message;
                        switch (count) {
                            case 2:
                                message = "BELOW 60 MESH";
                                break;
                            case 3:
                                message = "";
                                break;
                        }

                        var objresSaveDataInCompPFineGran = await objCheckGran.checkGranulation(cubicalObj, typeValue, weightValue, IdsNo);
                        let sendProtocol = `WPF00${count}${message},`;
                        return sendProtocol;

                    }
                    else {
                        var objresSaveDataInCompPFine = await objIncompleteGran.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo);
                        let count = actualSampleValue + 1;
                        let message;
                        objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                        switch (count) {
                            case 2:
                                message = "BELOW 60 MESH";
                                break;
                            case 3:
                                message = "";
                                break;
                        }
                        let sendProtocol = `WPF00${count}${message},`;
                        if (actualSampleValue != 3) {
                            return sendProtocol;
                        }
                    }
                }
                //resolve('lE1');
                // }
                // else {
                //     console.log("NOT N");
                // }

            } else if (typeValue == 'I') // Multihealer
            {
                //check which menu select in Multihealer
                let objMLHMenu = globalData.arrMultihealerMS.find(k => k.idsNo == IdsNo);
                let menu = objMLHMenu.menu;
                var objActivity = {};
                var groupWeightVal = actualWt[2];
                var responseType = actualWt[3].split("");
                var actualResponseType = responseType[1].toUpperCase();
                //  if (actualResponseType.toUpperCase() == "N" || actualResponseType.toUpperCase() == "R") {
                var intNos, maxLimit, minLimit, productUnit;
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                );
                switch (menu) {
                    case 'Sealed Cartridge':
                        Object.assign(objActivity,
                            { activity: 'Sealed Cartridge Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        // Instrument Usage log for balance start
                        await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Sealed Cartridge', 'started');
                        intNos = tempLimObj.SealedCart.noOfSamples;
                        maxLimit = formulaFun.upperLimit(tempLimObj.SealedCart);
                        minLimit = formulaFun.lowerLimit(tempLimObj.SealedCart);
                        productUnit = tempLimObj.SealedCart.unit;
                        var incomingUnit = actualWt[3].split(/N|R|r|n/)[0].toLowerCase();
                        var compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                        if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                            if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                                groupWeightVal = formulaFun.FormatNumberString(groupWeightVal / 1000, 5); // mg->gm
                            } else {
                                groupWeightVal = groupWeightVal * 1000; // mg -> gm
                            }
                        }
                        await objMultihaler.saveSealedCartriage(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, maxLimit, minLimit, groupWeightVal);
                        if (parseFloat(groupWeightVal) < parseFloat(minLimit)) {
                            le = `LE1`;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: groupWeightVal, flag: 'out' } })
                        } else if (parseFloat(groupWeightVal) > parseFloat(maxLimit)) {
                            le = `LE1`;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: groupWeightVal, flag: 'out' } })
                        }
                        else {
                            le = `LE0`;
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: groupWeightVal, flag: 'in' } })
                        }
                        // Activity Log for completion of weigghment

                        Object.assign(objActivity,
                            { activity: 'Weighment completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed')
                        return le;
                        break;
                    case 'Net Content':
                    case 'Dry Cartridge':
                    case 'Dry Powder':
                        //  console.log(actualWt);
                        var WTGORT; // IS GROSS OR TARE
                        var limitObj = {};
                        if (menu == 'Dry Cartridge') {
                            WTGORT = 'TARE WT';
                            limitObj = 'DryCart';
                        } else if (menu == 'Dry Powder') {
                            WTGORT = 'TARE WT';
                            limitObj = 'DryPwd';
                        } else {
                            WTGORT = 'GROSS WT';
                            limitObj = 'NetCart';
                        }
                        intNos = tempLimObj[limitObj].noOfSamples;
                        maxLimit = formulaFun.upperLimit(tempLimObj[limitObj]);
                        minLimit = formulaFun.lowerLimit(tempLimObj[limitObj]);

                        productUnit = tempLimObj[limitObj].unit;
                        let weightVal = actualWt[2];
                        var incomingUnit = actualWt[3].split(/N|R|r|n/)[0].toLowerCase();
                        var compareUnit = incomingUnit.toLowerCase().substring(0, 1)
                        if (compareUnit != productUnit.toLowerCase().substring(0, 1)) {
                            if (productUnit.toLowerCase().substring(0, 1) == 'g') {
                                weightVal = formulaFun.FormatNumberString(weightVal / 1000, 5); // mg->gm
                            } else {
                                weightVal = weightVal * 1000; // mg -> gm
                            }
                        }
                        let SampleNo = actualWt[1].substring(1, 4);;

                        var objTempMLCal = globalData.arrMultiHealerCal.find(k => k.idsNo == IdsNo);
                        if (SampleNo == "001") {
                            if (objTempMLCal == undefined) {
                                Object.assign(objActivity,
                                    { activity: `${menu} Weighment Started on IDS` + IdsNo });
                                await objActivityLog.ActivityLogEntry(objActivity);
                                // Instrument Usage log for balance start
                                await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', menu, 'started');

                                globalData.arrMultiHealerCal.push({ idsNo: IdsNo, dataValue1: Number(weightVal), dataValue2: 0, netWt: 0 });
                                //After Asking TARE/ACTUAL WT then We need to ask TARE/ACTUAL and VISE-VERSA
                                var protocolToBeSend = `WTI010000${WTGORT},, ,SP10Z,`;
                                return protocolToBeSend;
                            } else {
                                objTempMLCal.dataValue2 = Number(weightVal);
                            }
                        } else {
                            // For the next wt Gross becomes Tare
                            objTempMLCal.dataValue1 = objTempMLCal.dataValue2;
                            objTempMLCal.dataValue2 = Number(weightVal);
                        }




                        if (parseInt(actualSampleValue) < intNos) { //storing incomplete data

                            ///for storing incomplete data*************************************************************
                            await objMultihaler.saveInCompleteMLTHR(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, maxLimit, minLimit);
                            //*************************************************************************************** */
                            // Taking NetWt and Compare
                            var objMLHCal = globalData.arrMultiHealerCal.find(k => k.idsNo == IdsNo);
                            var netValue = objMLHCal.netWt;

                            //for Below limit
                            if (parseFloat(netValue) < parseFloat(minLimit)) {
                                var belowlimit = `${protocolType}${typeValue}0B0${sample}${WTGORT},Below Limit,,${tareCmd},`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: netValue, flag: 'out' } })
                                return belowlimit
                            }
                            else if (parseFloat(netValue) > parseFloat(maxLimit)) {//for Above limit
                                var abovelimit = `${protocolType}${typeValue}0A0${sample}${WTGORT},Above Limit,,${tareCmd},`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: netValue, flag: 'out' } })
                                return abovelimit
                            }
                            else {//for Within limit
                                var withinlimit = `${protocolType}${typeValue}010${sample}${WTGORT},Within Limit,,${tareCmd}`;
                                objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: netValue, flag: 'in' } })
                                return withinlimit
                            }
                        } else {//storing last sample incomplete data****************************************************************************
                            await objMultihaler.saveInCompleteMLTHR(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, maxLimit, minLimit);
                            /************************************************************************************************************** */
                            // Taking NetWt and Compare
                            var objMLHCal = globalData.arrMultiHealerCal.find(k => k.idsNo == IdsNo);
                            var netValue = objMLHCal.netWt;

                            if (parseFloat(netValue) < parseFloat(minLimit)) {//for below limit
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: netValue, flag: 'out' } })
                            }
                            else if (parseFloat(netValue) > parseFloat(maxLimit)) {//for Above limit
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: netValue, flag: 'out' } })
                            }
                            else {//for within limit
                                objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: netValue, flag: 'in' } })
                            }
                            //storing final Data*****************************************************************************************
                            var objresIndComp = await objMultihaler.saveCompleteData(intWeighmentNo, cubicalObj, typeValue, tempUserObject, IdsNo, tempLimObj);
                            Object.assign(objActivity,
                                { activity: `${menu} Weighment completed on IDS` + IdsNo });
                            await objActivityLog.ActivityLogEntry(objActivity);
                            await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed')
                            return objresIndComp;
                            //******************************************************************************************************** */
                        }

                        // return '+';
                        break;
                }
                // }
                return '+'
            } else if (typeValue == 'D') {
                var intWeighmentNo = 3;

                // var responseType = actualWt[2].split("");

                // if (actualWt[2].includes("mg") == true) {
                //     var actualResponseType = responseType[2].toUpperCase();//here weight is check, R = repeat and N = new
                // }
                // else {
                //     var actualResponseType = responseType[1].toUpperCase();//here weight is check, R = repeat and N = new    
                // }
                let paramUnit = tempLimObj.Differential.unit;
                //var weightValue;
                let incomingUnit = actualWt[2].split(/N|R|r|n/)[0].toLowerCase();
                let compareUnit = incomingUnit.toLowerCase().substring(0, 1);
                var weightValue = parseFloat(actualWt[1]);
                if (compareUnit != paramUnit.toLowerCase().substring(0, 1)) {
                    if (paramUnit.toLowerCase().substring(0, 1) == 'g') {
                        weightValue = parseFloat(formulaFun.FormatNumberString(parseFloat(actualWt[1]) / 1000, 4)); // mg->gm
                    } else {
                        weightValue = parseFloat(actualWt[1]) * 1000; // mg -> gm
                    }
                }

                // if (actualResponseType == "N" || actualResponseType == "R") {
                var intNos, maxLimitFill, minLimitFill, maxLimitEmpty, minLimitEmpty;

                var objActivity = {}
                //Storing Activity Log*****************************************************

                if (sample == '001' && DiffType == "F") { // Activity will log for the first weight only
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Differential Weighment Started on IDS' + IdsNo });
                    var objresActLogind = await objActivityLog.ActivityLogEntry(objActivity);
                    // Instrument Usage log for balance start
                    var objresIntrLogind = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Differential', 'started')
                }
                if (serverConfig.ProjectName == 'SunHalolGuj1') {
                    intNos = tempLimObj.Differential.noOfSamples;

                } else {
                    intNos = tempLimObj.Individual.noOfSamples;
                    maxLimitFill = formulaFun.upperLimit(tempLimObj.Individual);
                    minLimitFill = formulaFun.lowerLimit(tempLimObj.Individual);
                    maxLimitEmpty = formulaFun.upperLimit(tempLimObj.Differential);
                    minLimitEmpty = formulaFun.lowerLimit(tempLimObj.Differential);
                }
                //DONE Storing Activity Log*****************************************************
                let contentLength = 0
                for (var property in tempLimObj) {
                    if (property.substring(0, 7) == 'content') {
                        contentLength = contentLength + 1;
                    }
                }

                if (parseInt(actualSampleValue) < intNos) { //storing incomplete data

                    ///for storing incomplete data*************************************************************
                    let flagDecider = false;
                    if (DiffType == 'E' && contentLength == 0) {
                        flagDecider = true;
                    } else if (contentLength != 0 && DiffType == 'C') {
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        if (tempContentObj.contentNumber == tempContentObj.totalContent) {
                            flagDecider = true;
                        }
                    }
                    if (flagDecider) {
                        if (sample == '001') {
                            await objRemarkInComplete.updateEntry(IdsNo, typeValue);
                            await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                        }

                        var objresIndIncomp = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, DiffType);
                        var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                        if (sample == '001') {
                            const getRepsrNo = {
                                str_tableName: 'tbl_cap_master3_incomplete',
                                data: 'MAX(RepSerNo) AS RepSerNo',
                                condition: [
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                                    { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                                    { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                                ]
                            }

                            // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                            var res = await database.select(getRepsrNo);
                            let objUpdatepowerbackup = {
                                str_tableName: 'tbl_powerbackup',
                                data: [
                                    { str_colName: 'Incomp_RepSerNo', value: res[0][0].RepSerNo }
                                ],
                                condition: [
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'Sys_BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'Sys_Batch', value: productObj.Sys_Batch }

                                ]
                            }
                            await database.update(objUpdatepowerbackup);
                        }
                    }

                    //*************************************************************************************** */
                    //WTDF10001Within Limit,,,-
                    //for Below limit
                    var limitMsg = ""
                    if (DiffType == "F") {
                        if (serverConfig.ProjectName == 'SunHalolGuj1') {
                            //WTDF10002 -> 6th bit is for 1,2,3 for content (multiContent diff) as well as blinking for
                            // msg value will be 9 for blinking
                            limitMsg = `${protocolType}${typeValue}F10${sample}Within Limit,,,0,${tareCmd}`;
                            objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'F' })
                        } else {
                            if (parseFloat(weightValue) < parseFloat(minLimitFill)) {
                                limitMsg = `${protocolType}${typeValue}FB0${sample}Below Limit,,,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'F' })
                            } else if (parseFloat(weightValue) > parseFloat(maxLimitFill)) {
                                limitMsg = `${protocolType}${typeValue}FA0${sample}Above Limit,,,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'F' })
                            } else {
                                limitMsg = `${protocolType}${typeValue}F10${sample}Within Limit,,,0,${tareCmd}`;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'F' })
                            }
                        }
                        return limitMsg;
                    } else if (DiffType == "E") {
                        // checking if product having content or not 
                        //WTDC13001within limit,capsule,,
                        let shellType = 'E';
                        let replaceString = '';
                        let count = 0;
                        if (contentLength != 0) {
                            //if (DiffType == 'C') {
                            shellType = 'C';
                            replaceString = 'CONT.';
                            count = 1;
                        }
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        if (tempContentObj != undefined) {
                            tempContentObj.idsNo = IdsNo;
                            tempContentObj.contentNumber = count;
                            tempContentObj.totalContent = contentLength;
                        } else {
                            globalData.arrContentCapsule.push({ idsNo: IdsNo, contentNumber: count, totalContent: contentLength })
                        }
                        if (serverConfig.ProjectName == 'SunHalolGuj1') {
                            limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                            objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'E' })
                        }
                        else if (serverConfig.ProjectName == 'CIPLA_INDORE' || serverConfig.ProjectName == 'CIPLA_KurkumbhU1' || serverConfig.ProjectName == 'CIPLA_Baddi') {
                            limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                            objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'E' })
                        } else {
                            if (parseFloat(weightValue) < parseFloat(minLimitEmpty)) {
                                limitMsg = `${protocolType}${typeValue}${shellType}B${count}${sample}Below Limit,${replaceString},,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                            } else if (parseFloat(weightValue) > parseFloat(maxLimitEmpty)) {
                                limitMsg = `${protocolType}${typeValue}${shellType}A${count}${sample}Above Limit,${replaceString},,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                            } else {
                                limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'E' })
                            }

                        }
                        return limitMsg

                    } else if (DiffType == "C") {

                        let maxLimitContent, minLimitContent;
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        let count = tempContentObj.contentNumber;
                        let shellType = 'C';
                        let replaceString = 'CONT.';

                        switch (count) {
                            case 1:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content1);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content1);
                                break;
                            case 2:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content2);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content2);
                                break;
                            case 3:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content3);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content3);
                                break;
                            case 4:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content4);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content4);
                                break;
                        }
                        if (tempContentObj.contentNumber == tempContentObj.totalContent) {
                            count = 0;
                            shellType = 'E';
                            replaceString = '';
                        } else {
                            count++;
                            tempContentObj.contentNumber++;
                        }
                        if (parseFloat(weightValue) < parseFloat(minLimitContent)) {
                            limitMsg = `${protocolType}${typeValue}${shellType}B${count}${sample}Below Limit,${replaceString},,0,${tareCmd}`;
                            vernierObj.flag = true;
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                        } else if (parseFloat(weightValue) > parseFloat(maxLimitContent)) {
                            limitMsg = `${protocolType}${typeValue}${shellType}A${count}${sample}Above Limit,${replaceString},,0,${tareCmd}`;
                            vernierObj.flag = true;
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                        } else {
                            limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'E' })
                        }
                        return limitMsg
                    }

                }
                else {// storing complete data
                    //storing last sample incomplete data****************************************************************************
                    let flagDecider = false;
                    if (DiffType == 'E' && contentLength == 0) {
                        flagDecider = true;
                    } else if (contentLength != 0 && DiffType == 'C') {
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        if (tempContentObj.contentNumber == tempContentObj.totalContent) {
                            flagDecider = true;
                        }
                    }
                    if (flagDecider) {
                        var objresIndIncomp = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, DiffType);
                    }
                    // if (DiffType == "E") {
                    //      var objresIndIncomp = await individualOperation.saveIncompleteData(cubicalObj, protocol, intNos, typeValue, tempUserObject, IdsNo, DiffType);
                    // }
                    var limitMsg = ""
                    if (DiffType == "F") {
                        if (serverConfig.ProjectName == 'SunHalolGuj1') {
                            limitMsg = `${protocolType}${typeValue}F10${sample}Within Limit,,,0,${tareCmd}`;
                            objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'F' })
                        }
                        else {
                            if (parseFloat(weightValue) < parseFloat(minLimitFill)) {
                                limitMsg = `${protocolType}${typeValue}FB0${sample}Below Limit,,,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'F' })
                            } else if (parseFloat(weightValue) > parseFloat(maxLimitFill)) {
                                limitMsg = `${protocolType}${typeValue}FA0${sample}Above Limit,,,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'F' })
                            } else {
                                limitMsg = `${protocolType}${typeValue}F10${sample}Within Limit,,,0,${tareCmd}`;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'F' })
                            }
                        }
                        if (serverConfig.ProjectName == "CIPLA_INDORE" || serverConfig.ProjectName == "SunHalolGuj1" || serverConfig.ProjectName == 'CIPLA_KurkumbhU1' || serverConfig.ProjectName == 'CIPLA_Baddi') {//this if block is added by vivek 
                            var tempobj = globalData.arrDisplayFinalDiffWt.find(td => td.idsNo == IdsNo);
                            if (tempobj == undefined) {
                                globalData.arrDisplayFinalDiffWt.push({ idsNo: IdsNo, filledWt: weightValue })
                            } else {
                                tempobj.idsNo = IdsNo;
                                tempobj.filledWt = weightValue;
                                // tempobj.emptyWt = 0;
                            }
                        }

                        return limitMsg;

                    } else if (DiffType == "E") {
                        let shellType = 'E';
                        let replaceString = '';
                        let count = 0;
                        if (contentLength != 0) {
                            shellType = 'C';
                            replaceString = 'CONT.';
                            count = 1;
                        }
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        if (tempContentObj != undefined) {
                            tempContentObj.idsNo = IdsNo;
                            tempContentObj.contentNumber = count;
                            tempContentObj.totalContent = contentLength;
                        } else {
                            globalData.arrContentCapsule.push({ idsNo: IdsNo, contentNumber: count, totalContent: contentLength })
                        }
                        if (serverConfig.ProjectName == 'CIPLA_INDORE' || serverConfig.ProjectName == 'CIPLA_KurkumbhU1' || serverConfig.ProjectName == 'CIPLA_Baddi') {
                            limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                            vernierObj.flag = true;
                            objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                        }
                        else {

                            if (parseFloat(weightValue) < parseFloat(minLimitEmpty)) {
                                limitMsg = `${protocolType}${typeValue}${shellType}B${count}${sample}Below Limit,${replaceString},,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                            } else if (parseFloat(weightValue) > parseFloat(maxLimitEmpty)) {
                                limitMsg = `${protocolType}${typeValue}${shellType}A${count}${sample}Above Limit,${replaceString},,0,${tareCmd}`;
                                vernierObj.flag = true;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                            } else {
                                limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                                objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'E' })
                            }
                        }

                        if (serverConfig.ProjectName == "CIPLA_INDORE" ||
                            serverConfig.ProjectName == "SunHalolGuj1" || serverConfig.ProjectName == 'CIPLA_KurkumbhU1' || serverConfig.ProjectName == 'CIPLA_Baddi') {//this if block is added by vivek 
                            var tempobj = globalData.arrDisplayFinalDiffWt.find(td => td.idsNo == IdsNo);
                            if (tempobj == undefined) {
                                tempobj.idsNo = IdsNo;
                                //tempobj.filledWt = 0;
                                tempobj.emptyWt = weightValue;
                            } else {
                                tempobj.emptyWt = weightValue;
                            }
                        }
                        if (contentLength != 0) {
                            // If there is content then we have to check for content // otherwise for empty
                            // we are not not sending limit msg because save incomlete will handle it
                            return limitMsg
                        }
                        //return limitMsg
                    } else if (DiffType == "C") {

                        let maxLimitContent, minLimitContent;
                        let tempContentObj = globalData.arrContentCapsule.find(k => k.idsNo == IdsNo);
                        let count = tempContentObj.contentNumber;
                        let shellType = 'C';
                        let replaceString = 'CONT.';

                        switch (count) {
                            case 1:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content1);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content1);
                                break;
                            case 2:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content2);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content2);
                                break;
                            case 3:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content3);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content3);
                                break;
                            case 4:
                                maxLimitContent = formulaFun.upperLimit(tempLimObj.content4);
                                minLimitContent = formulaFun.lowerLimit(tempLimObj.content4);
                                break;
                        }
                        if (tempContentObj.contentNumber == tempContentObj.totalContent) {
                            count = 0;
                            shellType = 'E';
                            replaceString = '';
                            tempContentObj.contentNumber++;
                        } else {
                            count++;
                            tempContentObj.contentNumber++;
                        }
                        if (parseFloat(weightValue) < parseFloat(minLimitContent)) {
                            limitMsg = `${protocolType}${typeValue}${shellType}B${count}${sample}Below Limit,${replaceString},,0,${tareCmd}`;
                            vernierObj.flag = true;
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                        } else if (parseFloat(weightValue) > parseFloat(maxLimitContent)) {
                            limitMsg = `${protocolType}${typeValue}${shellType}A${count}${sample}Above Limit,${replaceString},,0,${tareCmd}`;
                            vernierObj.flag = true;
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'E' })
                        } else {
                            limitMsg = `${protocolType}${typeValue}${shellType}1${count}${sample}Within Limit,${replaceString},,0,${tareCmd}`;
                            // objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'E' })
                        }
                        if (tempContentObj.contentNumber <= tempContentObj.totalContent) {
                            return limitMsg
                        }
                    }
                    var objresIndComp = await this.saveToComplete(intWeighmentNo, cubicalObj, typeValue, tempUserObject, IdsNo, vernierObj)
                    await clspowerbackup.deletePowerBackupData(IdsNo);
                    if (serverConfig.ProjectName == "CIPLA_INDORE" || serverConfig.ProjectName == 'CIPLA_KurkumbhU1' || serverConfig.ProjectName == 'CIPLA_Baddi'

                        || serverConfig.ProjectName == "SunHalolGuj1") {//this if block is added by vivek 
                        var tempobj = globalData.arrDisplayFinalDiffWt.find(td => td.idsNo == IdsNo);
                        if (tempobj == undefined) {
                            tempobj.idsNo = IdsNo;
                            tempobj.filledWt = 0;
                            tempobj.emptyWt = 0;
                        } else {
                            var Filledwt = tempobj.filledWt
                            var Emptywt = tempobj.emptyWt
                        }

                        var str_SendProtocol
                        var tempTDObj = globalData.arrNetwtResult.find(td => td.idsNo == IdsNo);
                        if (tempTDObj == undefined) {
                            globalData.arrNetwtResult.push({ idsNo: IdsNo, NwResult: objresIndComp })
                        } else {
                            tempTDObj.idsNo = '';
                            tempTDObj.NwResult = '';
                        }

                        /**Display message for filled and EMpty and Net value */
                        //DP is base on Least count (suggestion by sheetal madam) added by vivek on 08-07-2020
                        var tempcubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                        const selectBalDP = {
                            str_tableName: 'tbl_balance',
                            data: 'Bal_DP',
                            condition: [
                                { str_colName: 'Bal_ID', value: tempcubicalObj.Sys_BalID, comp: 'eq' },
                            ]
                        }
                        var objselectBalDP = await database.select(selectBalDP)
                        var DP = 0
                        if (objselectBalDP[0].length > 0) {
                            DP = objselectBalDP[0][0].Bal_DP
                        }
                        var tempDiffData = globalData.arrdifferential.find(k => k.idsNo == IdsNo);
                        let strNetVal = (parseFloat(Filledwt) - parseFloat(Emptywt) - tempDiffData.content1 - tempDiffData.content2 - tempDiffData.content3 - tempDiffData.content4);

                        let DiffUnit = tempLimObj.Differential.unit;


                        var SendProtocol;
                        if (serverConfig.ProjectName == "SunHalolGuj1") {
                            SendProtocol = `DM3E0FILLED WT :${parseFloat(Filledwt).toFixed(2)}${DiffUnit},EMPTY WT  :${parseFloat(Emptywt).toFixed(2)}${DiffUnit},NET WT    :${parseFloat(strNetVal).toFixed(2)}${DiffUnit},,`;
                        }
                        else {
                            SendProtocol = `DM3E0FILLED WT :${parseFloat(Filledwt).toFixed(DP)}${DiffUnit},EMPTY WT  :${parseFloat(Emptywt).toFixed(DP)}${DiffUnit},NET WT    :${parseFloat(strNetVal).toFixed(DP)}${DiffUnit},,`;
                        }

                        return SendProtocol;

                    }
                    var objRemark = globalData.arrLLsampleRemark.find(k => k.idsNo == IdsNo);
                    if (objRemark == undefined) { globalData.arrLLsampleRemark.push({ idsNo: IdsNo, remark: objresIndComp, diffsample: sample }) }
                    else {
                        objRemark.remark = objresIndComp;
                        objRemark.diffsample = sample
                    }
                    return limitMsg;
                    //return objresIndComp;
                    //******************************************************************************************************** */
                }
                // }
            } else if (typeValue == 'G') // Bin Weighing
            {
                var objCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                var dblGrossWt = protocol.substring(3, protocol.indexOf(' ') + 1).trim();
                var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsNo);

                if (parseFloat(objBin.tareWt) >= parseFloat(dblGrossWt)) {
                    //return "DM000GROSS WT CANNOT BE,LESS THAN OR,EQUAL TO TARE WT,,";
                    return "DM000Gross Weight must be,>" + parseFloat(objBin.tareWt).toFixed(2) + ",,,";
                }
                else {
                    var now = new Date();
                    var dblTareWt = await objContainer.getTareWt(objBin.selContainer, IdsNo, objCubicInfo.Sys_Area, objCubicInfo.Sys_CubType);
                    objBin.tareWt = dblTareWt;
                    objBin.grossWt = dblGrossWt;
                    objBin.netWt = Number(dblGrossWt - objBin.tareWt).toFixed(2);
                    objBin.balanceID = objCubicInfo.Sys_BinBalID;
                    objBin.prDate = date.format(now, 'YYYY-MM-DD');
                    objBin.prTime = date.format(now, 'HH:mm:ss');
                    objBin.dp = dblGrossWt.substring(dblGrossWt.indexOf('.') + 1, dblGrossWt.length).trim().length;
                    objBin.userid = tempUserObject.UserId;
                    objBin.username = tempUserObject.UserName;
                    var result = await objContainer.saveContainerWeighment(objBin, objCubicInfo.Sys_Area, objCubicInfo.Sys_CubType, IdsNo);
                    var objresIntrLogind = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'IPC Weighing', 'started')
                    return "WTN0" + "PRODUCT:" + objBin.selProductId + "," + Number(objBin.netWt).toFixed(2) + " Kg ,";
                }

            } else if (typeValue == 'T') {
                var dblTareWt = protocol.substring(3, protocol.indexOf(' ') + 1);
                var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsNo);
                if (0 >= parseFloat(dblTareWt)) {
                    //return "DM000TARE WT CANNOT BE,LESS THAN OR,EQUAL 0,,";
                    return "DM000Tare Weight must be,> 0,,";
                } else {
                    var objBin = globalData.arrBinInfo.find(k => k.idsNo == IdsNo);
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
                    var userObj = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: userObj.UserId },
                        {
                            strUserName: userObj.UserName //sarr_UserData[0].UserName 
                        },
                        { activity: `Tare Wt of Bin - ${objBin.selContainer} taken ` + IdsNo })
                    await objActivityLog.ActivityLogEntry(objActivity);
                    await database.update(updateObjTare);
                    return "WTG0" + "PRODUCT:" + objBin.selProductId + "," + Number(dblTareWt).toFixed(2) + " ,";
                }
            } else if (typeValue == 'N') // Bin Weighing
            {
                var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                var retProtocol = await objContainer.sendIPCList(IdsNo, cubicInfo.Sys_Area, cubicInfo.Sys_CubType, true);
                var objresIntrLogind = await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed')
                return retProtocol;


            } else if (typeValue == 'R') { // fraibility on balance
                console.log(protocol)
                var tempFriObj = globalData.FrabilityOnBal.find(k => k.idsNo == IdsNo);
                var returnProtocol;
                if (protocol.substring(3, 4) == 'L') {

                    if (tempFriObj == undefined) {
                        globalData.FrabilityOnBal.push({ idsNo: IdsNo, dataValue1: actualWt[2], dataValue2: 0 })
                    } else {
                        tempFriObj.dataValue1 = actualWt[2];
                        tempFriObj.dataValue2 = 0;
                    }
                    returnProtocol = "LFRWL";
                } else if (protocol.substring(3, 4) == 'R') {
                    tempFriObj.dataValue2 = actualWt[2];
                    returnProtocol = "LFRWR";
                } else {
                    // FOR N

                    if (tempFriObj == undefined) {
                        globalData.FrabilityOnBal.push({ idsNo: IdsNo, dataValue1: actualWt[2], dataValue2: 0 })
                    } else {
                        tempFriObj.dataValue1 = actualWt[2];
                        tempFriObj.dataValue2 = 0;
                    }
                    returnProtocol = "LFRWN";
                }

                //     var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                //     var retProtocol = await objContainer.sendIPCList(IdsNo,cubicInfo.Sys_Area,cubicInfo.Sys_CubType);
                //    return retProtocol;
                // console.log(globalData.FrabilityOnBal)
                if ((protocol.substring(3, 4) == 'R') || (protocol.substring(3, 4) == 'N')) {
                    await objBulkWeighment.insertFriabilityOnBal(IdsNo, protocol);
                    return returnProtocol
                } else {
                    return returnProtocol
                }

            }
        }
        else if (protocolType == "WC") // else part come for WC Protocol
        {
            const IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds
            } else {
                selectedIds = IdsNo; // for compression and coating
            };
            var objCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            console.log("WC");
            // for particle seizing
            if (typeValue == 'P') {
                var result = await objCompleteGran.saveCompleteData(objCubic, typeValue, tempUserObject, IdsNo)
                var objresMoveGran = await objMoveGranData.moveGranulation(result, IdsNo);
                objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed');
                return "+";
            }
            else if (typeValue == 'F') {
                var result = await objCompleteGran.saveCompleteData(objCubic, typeValue, tempUserObject, IdsNo)
                var objresMoveGran = await objMoveGranData.moveGranulation(result, IdsNo)
                objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed');
                return "+";
            }
            else {
                return "+";
            }
        }
        else if (protocolType == "NW") {
            var obj = globalData.arrLLsampleRemark.find(k => k.idsNo == IdsNo);
            var maxLimitNet, minLimitNet, limitMsg, weightValue, sample;
            var res = await individualOperationDiff.getDiffData(cubicalObj, IdsNo, 'incomplete');
            var ll = 0;
            if (obj != undefined && obj['diffsample'] != undefined) {
                var res1 = await individualOperationDiff.getDiffData(cubicalObj, IdsNo, 'complete');
                ll = 1;
            }
            if (type.substring(2, 3) == '0') {
                if (res[0].length != 0) {
                    let sample = parseInt(res[0][0].RecSeqNo) - 1;
                    sample = ("00" + sample).slice(-3);
                    limitMsg = `WTDN10${sample}Within Limit,,,${tareCmd}`;
                    var deleteObj = {
                        str_tableName: "tbl_cap_detail3_incomplete",
                        condition: [
                            { str_colName: "RecSeqNo", value: res[0][0].RecSeqNo },
                            { str_colName: "RepSerNo", value: res[0][0].RepSerNo },
                        ],
                    }
                    await database.delete(deleteObj);
                    if (sample == '000') {
                        //added by pradip shinde 28/09/2020 when first sample gets out Double value then master
                        // entry also gets deleted
                        var masterObj = {
                            str_tableName: "tbl_cap_master3_incomplete",
                            condition: [
                                { str_colName: "RepSerNo", value: res[0][0].RepSerNo },
                            ],
                        }
                        await database.delete(masterObj);
                    }
                    return limitMsg;
                }
            } else {

                if (obj != undefined && obj['diffsample'] != undefined) {
                    weightValue = res1[0][0].NetWeight;
                    sample = obj.diffsample;
                } else {
                    weightValue = res[0][0].NetWeight;
                    sample = ("00" + res[0][0].RecSeqNo).slice(-3);
                }
                if (serverConfig.ProjectName == 'SunHalolGuj1') {
                    //added and cpmmented by vivek
                    //as per discuss with pushkar rode on 05022021 net limit should be display as actual limit i.e. T2UPPER,T2LOWER
                    //maxLimitNet = formulaFun.upperLimit(tempLimObj.Differential);
                    //minLimitNet = formulaFun.lowerLimit(tempLimObj.Differential);
                    //********************************************************************************* */
                    var digit = parseInt(serverConfig.calculationDigit);
                    maxLimitNet = formulaFun.FormatNumber(tempLimObj.Differential.T2Pos, digit);
                    minLimitNet = formulaFun.FormatNumber(tempLimObj.Differential.T2Neg, digit);
                } else {
                    maxLimitNet = formulaFun.upperLimit(tempLimObj.Net);
                    minLimitNet = formulaFun.lowerLimit(tempLimObj.Net);
                }



                if (parseFloat(weightValue) < parseFloat(minLimitNet)) {
                    limitMsg = `WTDNB0${sample}Below Limit,,,${ll},${tareCmd}`;
                    vernierObj.flag = true;
                    objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'N' })
                } else if (parseFloat(weightValue) > parseFloat(maxLimitNet)) {
                    limitMsg = `WTDNA0${sample}Above Limit,,,${ll},${tareCmd}`;
                    vernierObj.flag = true;
                    objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' }, type: 'N' })
                } else {
                    limitMsg = `WTDN10${sample}Within Limit,,,${ll},${tareCmd}`;
                    objMonitor.monit({ case: 'DF', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' }, type: 'N' })
                    vernierObj.flag = false;
                }


                // objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'out' } })

                if (serverConfig.ProjectName == "CIPLA_INDORE" || serverConfig.ProjectName == 'CIPLA_KurkumbhU1' || serverConfig.ProjectName == 'CIPLA_Baddi' || serverConfig.ProjectName == 'SunHalolGuj1') {//this if block is added by vivek 
                    var str_SendProtocol
                    var tempTDObj = globalData.arrNetwtResult.find(td => td.idsNo == IdsNo);
                    if (tempTDObj == undefined) {
                        globalData.arrNetwtResult.push({ idsNo: IdsNo, NwResult: limitMsg })
                    } else {
                        tempTDObj.idsNo = '';
                        tempTDObj.NwResult = '';
                    }

                    /**Display message for filled and EMpty and Net value */
                    //DP is base on Least count (suggestion by shee-tal madam) added by vivek on 08-07-2020
                    var tempcubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                    const selectBalDP = {
                        str_tableName: 'tbl_balance',
                        data: 'Bal_DP',
                        condition: [
                            { str_colName: 'Bal_ID', value: tempcubicalObj.Sys_BalID, comp: 'eq' },
                        ]
                    }
                    var objselectBalDP = await database.select(selectBalDP)
                    var DP = 0
                    if (objselectBalDP[0].length > 0) {
                        DP = objselectBalDP[0][0].Bal_DP
                    }

                    let strFilledwt = parseFloat(res[0][0].DataValue).toFixed(DP)
                    let strEmptywt = parseFloat(res[0][0].DataValue1).toFixed(DP)
                    let strNetwt = parseFloat(weightValue).toFixed(DP)

                    var DiffUnit = tempLimObj.Differential.unit;



                    var strSendProtocol;
                    if (serverConfig.ProjectName == "SunHalolGuj1") {
                        let Filledwt = parseFloat(res[0][0].DataValue).toFixed(2)
                        let Emptywt = parseFloat(res[0][0].DataValue1).toFixed(2)
                        let Netwt = parseFloat(weightValue).toFixed(2)
                        strSendProtocol = `DM3E0FILLED WT :${Filledwt}${DiffUnit},EMPTY WT  :${Emptywt}${DiffUnit},NET WT    :${Netwt}${DiffUnit},,`;
                    }
                    else {
                        strSendProtocol = `DM3E0FILLED WT :${strFilledwt}${DiffUnit},EMPTY WT  :${strEmptywt}${DiffUnit},NET WT    :${strNetwt}${DiffUnit},,`;
                    }
                    /*********************************************************/
                    return strSendProtocol;


                    /*********************************************************/
                }

                else {
                    return limitMsg;
                }

            }

        }


    }

    async saveToComplete(intWeighmentNo, cubicalObj, typeValue, tempUserObject, IdsNo, vernierObj, IsBalOrVer = "Balance") {
        //update end date and time when sample complete
        let now = new Date();
        var le;
        var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
        const updateIndividualEndTime = {

            data: [
                { str_colName: 'PrEndDate', value: date.format(now, 'YYYY-MM-DD') },
                { str_colName: 'PrEndTime', value: date.format(now, 'HH:mm:ss') }
            ],
            condition: [
                { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
            ]
        }
        if (objProductType.productType == 1) {
            Object.assign(updateIndividualEndTime,
                { str_tableName: 'tbl_tab_master' + intWeighmentNo + '_incomplete' }
            );
        } else if (objProductType.productType == 2 || objProductType.productType == 4) {
            Object.assign(updateIndividualEndTime,
                { str_tableName: 'tbl_cap_master' + intWeighmentNo + '_incomplete' }
            );
        } else if (objProductType.productType == 5) {
            Object.assign(updateIndividualEndTime,
                { str_tableName: 'tbl_tab_master19_incomplete' }
            );
        }


        //console.log(updateIndividualEndTime);
        await database.update(updateIndividualEndTime);
        var selectedIds;
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = IdsNo;
        }
        const objWeighmentModel = new WeighmentModel();
        objWeighmentModel.strProductId = cubicalObj.Sys_BFGCode;
        objWeighmentModel.strProductName = cubicalObj.Sys_ProductName;
        objWeighmentModel.strProductVersion = cubicalObj.Sys_PVersion;
        objWeighmentModel.strVersion = cubicalObj.Sys_Version;
        objWeighmentModel.strBatch = cubicalObj.Sys_Batch;
        objWeighmentModel.intIdsNo = selectedIds;
        let successResult = await individualOperation.saveCompleteData(objWeighmentModel, typeValue, IdsNo);

        if (serverConfig.ProjectName == "RBH" && typeValue == 8) {//Individual empty report always should be within limit
            successResult = 'LE0'// 
        }

        objMonitor.monit({ case: 'LE', idsNo: IdsNo, data: successResult });
        // Clear flag for Incomplete remark like (test aborted, balance off, Auto logout);
        if (globalData.arrIncompleteRemark != undefined) {
            globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(k => k.IdsNo != IdsNo);
        }
        // Activity Log for completion of weigghment
        var objActivity = {}
        // const tempUserObject = globalData.arrUsers.find(k => k.IdsNo === IdsNo);
        Object.assign(objActivity,
            { strUserId: tempUserObject.UserId },
            { strUserName: tempUserObject.UserName },
            { activity: 'Weighment completed on IDS' + IdsNo });
        // Instrument Usage log for balance start
        if (IsBalOrVer == "Vernier") {
            objInstrumentUsage.InstrumentUsage('Vernier', IdsNo, 'tbl_instrumentlog_vernier', '', 'completed')
        }
        else {
            objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed')
        }


        await objActivityLog.ActivityLogEntry(objActivity);
        globalData.arrVernierData = globalData.arrVernierData.filter(x => x.IdsNum != IdsNo);
        // if (vernierObj.flag == true) {
        //     le = `LE1`;
        //     globalData.arrVernierData = globalData.arrVernierData.filter(x => x.IdsNum != IdsNo);
        //     return le;
        // }
        // else {
        //     le = `LE0`;
        //     globalData.arrVernierData = globalData.arrVernierData.filter(x => x.IdsNum != IdsNo);
        //     return le;
        // }
        // console.log(successResult);
        return successResult;
    }

}

module.exports = ProcessWeighment;