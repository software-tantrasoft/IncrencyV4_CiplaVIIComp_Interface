const Database = require('../database/clsQueryProcess');
const database = new Database();
const globalData = require('../global/globalData');
const moment = require('moment');
const serverConfig = require('../global/severConfig');
const date = require('date-and-time');
const clsRemarkInComplete = require('../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();
const clsActivityLog = require('./clsActivityLogModel');
const objActivityLog = new clsActivityLog();

// created by vivek11101997 on 27 march 2021 powerbackup 
class PowerBackup {
    /**
     * 
     * @param {*} Cubcial_info 
     * @param {*} Weightment_type 
     * @param {*} Userinfo 
     * @param {*} Idsno 
     * @description Method for inserting backup data to `tbl_powerbackup`
     *
     */
    async insertPowerBackupData(Cubcial_info, Weightment_type, Userinfo, Idsno, TableType = 'None', Ins_Model = "None", Test_Name = 'None') {
        // here test name is added for all test that are perform using port 3 and 4 protocol TD,HD,ED 
        try {
            if (serverConfig.isPowerBackup) {
                var WT, Weightment_name, CubType;
                let Sys_CubicNo = Cubcial_info.Sys_CubicNo;
                let Sys_RptType = Cubcial_info.Sys_RptType;
                let Sys_BFGCode = Cubcial_info.Sys_BFGCode;
                let Sys_Batch = Cubcial_info.Sys_Batch;
                let UserId = Userinfo.UserId;
                let currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == Idsno);
                CubType = currentCubicle.Sys_CubType

                var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == Idsno);
                switch (Weightment_type) {

                    // switch case according to hex returning according to interface
                    case "1":
                        Weightment_name = 'Individual';
                        if (objProductType.productType == 5) {
                            Weightment_name = 'Dosa Dry';
                        }
                        break;
                    case "8":
                        Weightment_name = 'Individual layer 1';
                        break;
                    case "L":
                        Weightment_name = 'Individual layer 2';
                        break;

                    case "6":
                        Weightment_name = 'Diameter';
                        break;
                    case "5":
                        Weightment_name = 'Length';
                        break;
                    case "4":
                        if (objProductType.productType == 2) {
                            Weightment_name == "Diameter";
                        } else {
                            Weightment_name = 'Breadth';
                        }
                        break;

                    case "3":
                    case "D":
                        if (objProductType.productType == 2) {
                            Weightment_name = 'Differential';
                        } else {
                            Weightment_name = 'Thickness';
                        }
                        break;

                    case "P":
                        Weightment_name = 'Partical Size';
                        break;
                    case "F":
                        Weightment_name = '% Fine';
                        break;



                }

                switch (true) {

                    case Weightment_type == "H" && Test_Name == 'Hardness':
                    case Weightment_type == "T" && Test_Name == 'Hardness': {
                        Weightment_name = "Hardness";
                        break;
                    }
                }
                //in powerbackup incomplate report serial number is updated at incomplatedatasave after data inserted to incomplate master 
                const insertInpowerbakupobj = {
                    str_tableName: 'tbl_powerbackup',
                    data: [
                        { str_colName: 'CubicalNo', value: Sys_CubicNo },
                        { str_colName: 'WeighmentType', value: Weightment_type },
                        { str_colName: 'WeighmentName', value: Weightment_name },
                        { str_colName: 'ProductType', value: objProductType.productType },
                        { str_colName: 'Userid', value: UserId },
                        { str_colName: 'ReportType', value: Sys_RptType },
                        { str_colName: 'TimUpdate', value: 1 },
                        { str_colName: 'Childcno', value: 1 },
                        { str_colName: 'ISCommOff', value: 0 },
                        { str_colName: 'Idsno', value: Idsno },
                        { str_colName: 'Sys_CubType', value: CubType },
                        { str_colName: 'Sys_BFGCode', value: Sys_BFGCode },
                        { str_colName: 'Sys_Batch', value: Sys_Batch },
                        { str_colName: 'TableType', value: TableType },
                        { str_colName: 'Instrument_Model', value: Ins_Model }

                    ]
                }
                var result = await database.save(insertInpowerbakupobj);
                return result;
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    async deletePowerBackupData(idsno) {
        try {
            if (serverConfig.isPowerBackup) {
                var idsNo = parseInt(idsno);
                var selectedIds;
                var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                var tempCubicInfo;

                if (IPQCObject != undefined) {
                    selectedIds = IPQCObject.selectedIds
                } else {
                    selectedIds = idsNo;
                };

                var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

                var deleteObj = {
                    str_tableName: "tbl_powerbackup",
                    condition: [
                        { str_colName: "Idsno", value: idsNo },
                        { str_colName: 'Sys_BFGCode', value: tempCubicInfo.Sys_BFGCode },
                        { str_colName: 'Sys_Batch', value: tempCubicInfo.Sys_Batch }
                    ],
                }
                return await database.delete(deleteObj);
            }
        }
        catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async fetchPowerBackupData(idsNo) {
        try {
            if (serverConfig.isPowerBackup) {
                var selectedIds;
                var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                var tempCubicInfo;
                //console.log(tempCubicInfo);
                if (IPQCObject != undefined) {
                    selectedIds = IPQCObject.selectedIds
                } else {
                    selectedIds = idsNo; // for compression and coating
                };
                tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                let CurrentCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                var selectPowerBackupData = {
                    str_tableName: 'tbl_powerbackup',
                    data: '*',
                    condition: [
                        { str_colName: 'Idsno', value: idsNo },
                        { str_colName: 'Sys_BFGCode', value: tempCubicInfo.Sys_BFGCode },
                        { str_colName: 'Sys_Batch', value: tempCubicInfo.Sys_Batch }
                    ]
                }
                var result = await database.select(selectPowerBackupData);
                let sendObj = {};
                Object.assign(sendObj, { status: true, result: result[0] })
                return sendObj;
            } else {
                let sendObj = {};
                Object.assign(sendObj, { status: false, result: [] })
                return sendObj;
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    async sendPowerBackupData(PowerBackupData, IdsNo) {
        try {
            var WT, ProductType, selectedIds;
            var WeighmentType = PowerBackupData[0].WeighmentType;
            var WeighmentName = PowerBackupData[0].WeighmentName
            var protocol, Weightment_name;
            var CubType = PowerBackupData[0].Sys_CubType;
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            ProductType = objProductType.productType;
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo; // for compression and coating
            };

            // here sending weightment type is according to hex beacuse WI protocol understand by hex only
            //and case is according to interface
            switch (WeighmentType) {

                case "1":
                    if (ProductType == 5) {
                        Weightment_name = 'DosaDry';
                    }
                    else {
                        Weightment_name = 'Individual';
                    }
                    break;
                // case 9:
                //     Weightment_name = 'Individual layer';
                //     WT = '8';
                //     break;
                case "8":
                    Weightment_name = 'Individual layer 1';
                    WeighmentType = '8' // only for Individual layer= 8 at hex
                    break;

                case "L":
                    Weightment_name = 'Individual layer 2';
                    break;

                case "6":
                    Weightment_name = 'Diameter';
                    break;
                case "5":
                    Weightment_name = 'Length';
                    break;
                case "4":
                    Weightment_name = 'Breadth';
                    break;
                case "P":
                    Weightment_name = 'Partical Size';
                    break;
                case "F":
                    Weightment_name = '% Fine';
                    break;
                case "3":
                case "D":
                    if (objProductType.productType == 2) {
                        Weightment_name = 'Differential';

                    }
                    else {
                        Weightment_name = 'Thickness';
                    }
                    break;
            }

            switch (true) {

                case WeighmentType == "H" && WeighmentName == 'Hardness':
                case WeighmentType == "T" && WeighmentName == 'Hardness': {

                    Weightment_name = "Hardness";
                    break;
                }
            }
            var objUser = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            if(objUser.UserId == PowerBackupData[0].Userid){
                protocol = `WI${WeighmentType}${Weightment_name},0,8`;
                return protocol;
            }else{
                this.deletePowerBackupData(IdsNo)
                return protocol = "MR";
            }
            // protocol = `WI${WeighmentType}${Weightment_name},0,8`;
            //protocol = `WIT${Weightment_name},0,8`;

            return protocol;
        } catch (err) {
            throw new Error(err);
        }
    }

    async handelPCProtocol(powerbackupdata, Weightment_type, IdsNo) {
        try {
            const { ProductType, Incomp_RepSerNo, TableType, Instrument_Model } = powerbackupdata[0];
            //let currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == Idsno);
            let protocol;
            // here ids sending 8 for indivisual layer 1 // Dosa dry // softshell
            switch (Weightment_type) {
                case "1":
                    if (ProductType == 5) {//dosa dry
                        Weightment_type = 19;
                    }
                    break;
                case "8": // case is according to hex only for individual layer 
                    Weightment_type = 9;// individual layer 
                    break;
                case "L":
                    Weightment_type = 11;// individual layer 1
                    break;
                case "D":
                    Weightment_type = 3;// individual layer 1
                    break;
                case "P":
                    Weightment_type = 18
                    break;
                case "F":
                    Weightment_type = 17
                    break;
            }
            let master_incomplete, detail_incomplate, product;

            if (ProductType == 1 || ProductType == 5) {
                product = "tab"
            }
            else {
                product = "cap"
            }

            if (Weightment_type == "H" || Weightment_type == "T") {
                master_incomplete = `tbl_${product}_master${TableType}_incomplete`.trim();
                detail_incomplate = `tbl_${product}_detail${TableType}_incomplete`.trim();
            }
            else {
                master_incomplete = `tbl_${product}_master${Weightment_type}_incomplete`.trim();
                detail_incomplate = `tbl_${product}_detail${Weightment_type}_incomplete`.trim();
            }
            var selectobmaster = {
                str_tableName: master_incomplete,
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: Incomp_RepSerNo },
                    { str_colName: 'Idsno', value: IdsNo }
                ]
            }
            var response = await database.select(selectobmaster);
            // here count is number of sample received from ids for next sample hex increment count by 1
            var query = `select count(RecNo) as Sample_Count_Received from ${detail_incomplate} where RepSerNo=${Incomp_RepSerNo}`;
            var query1 = `select MAX(RepSerNo) as RepSerNo from ${master_incomplete} where Idsno=${IdsNo}`;
            //var query1 = `select MAX(MstSerNo) as RepSerNo from ${master_incomplete} where Idsno=${IdsNo}`;

            var query2 = `select * from ${master_incomplete} where RepSerNo=${Incomp_RepSerNo}`;
            var result = await database.execute(query);
            var res = await database.execute(query1);
            var getLot = await database.execute(query2);
            if (result[0].length != 0) {

                var count = `${result[0][0].Sample_Count_Received}`;
                count = ("00" + count).slice(-3)
                var side = response[0][0].Side;
                var sidevalue;

                if (side == 'NA' || side == 0) {
                    sidevalue = 'N';
                }
                else if (side == 'LHS') {
                    sidevalue = 'L';
                }
                else {
                    sidevalue = 'R';
                }

                if (Weightment_type == '18') {

                    var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
                    if (objLotData == undefined) {

                        globalData.arrLot.push({ idsNo: IdsNo, LotNo: getLot[0][0].Lot, MS: 'MSPNÂ' });
                    }
                    var message = '';
                    let cnt = parseInt(count) + 1;
                    switch (cnt) {

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

                    let Weightment_type = 'P'


                    protocol = `WP${Weightment_type}00${parseInt(cnt)}${message},`;
                }
                else if (Weightment_type == '17') {
                    var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
                    if (objLotData == undefined) {

                        globalData.arrLot.push({ idsNo: IdsNo, LotNo: getLot[0][0].Lot, MS: 'MSFNÂ' });
                    }
                    var message = '';
                    let cnt = parseInt(count) + 1;
                    switch (cnt) {

                        case 2:
                            message = "ABOVE 60 MESH";
                            break;
                    }

                    let Weightment_type = 'F';


                    protocol = `WP${Weightment_type}00${parseInt(cnt)}${message},`;
                }
                else {
                    protocol = `PC0${count}${sidevalue}`;
                }

                //`WPP00${count}${message},`
                //protocol = `WPP002"hello Tantra",`

                switch (Instrument_Model) {
                    case 'Erweka TBH-425':
                    case 'Erweka TBH-125':
                        let objHardness = globalData.arrHardness425.find(ht => ht.idsNo == IdsNo);
                        var productlimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);


                        if (productlimits.Length != undefined) {
                            objHardness.colName = "Length";
                            objHardness.opNominal = productlimits.Length.nominal;
                            objHardness.opNegTol = productlimits.Length.T2Neg;
                            objHardness.opPosTol = productlimits.Length.T2Pos;
                        }
                        else if (productlimits.Diameter != undefined) {
                            objHardness.colName = "Diameter";
                            objHardness.opNominal = productlimits.Diameter.nominal;
                            objHardness.opNegTol = productlimits.Diameter.T2Neg;
                            objHardness.opPosTol = productlimits.Diameter.T2Pos;
                        }
                        else {
                            objHardness.colName = "NA";
                            objHardness.opNominal = 0;
                            objHardness.opNegTol = 0;
                            objHardness.opPosTol = 0;
                        }

                        if (productlimits.Thickness == undefined) {
                            objHardness.thicknessNom = 0;
                            objHardness.thicknesneg = 0;
                            objHardness.thicknespos = 0;
                        } else {
                            objHardness.thicknessNom = productlimits.Thickness.nominal;
                            objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                            objHardness.thicknespos = productlimits.Thickness.T2Pos;
                        }

                        if (objHardness != undefined) {
                            objHardness.sampleNo = parseInt(count);
                            objHardness.isFirstSampleSaved = true;
                        }

                        let objIncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                        if (objIncompIdHardness != undefined) {
                            objIncompIdHardness.incompRepSerNo = Incomp_RepSerNo;
                        }
                        break;

                    case 'Kraemer':

                        let obHardness = globalData.arrHardnessKramer.find(ht => ht.idsNo == IdsNo);
                        var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
                        if (objLotData == undefined) {

                            globalData.arrLot.push({ idsNo: IdsNo, LotNo: getLot[0][0].Lot, MS: 'MSHNÂ' });
                        }

                        if (obHardness != undefined) {
                            obHardness.sampleNo = parseInt(count);
                            obHardness.masterId = res[0][0].RepSerNo
                            obHardness.arr.length = parseInt(count)

                        }

                        let obIncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                        if (obIncompIdHardness != undefined) {
                            obIncompIdHardness.incompRepSerNo = Incomp_RepSerNo;
                        }
                        break;
                    case 'Dr Schleuniger':

                        let objHardness8M = globalData.arrHardnessDRSCPharmatron.find(ht => ht.idsNo == IdsNo);
                        let LotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
                        if (LotData == undefined) {

                            globalData.arrLot.push({ idsNo: IdsNo, LotNo: getLot[0][0].Lot, MS: 'MSHNÂ' });
                        }

                        if (objHardness8M != undefined) {
                            objHardness8M.sampleNo = parseInt(count);
                            objHardness8M.masterId = res[0][0].RepSerNo
                            objHardness8M.arr.length = parseInt(count)
                            objHardness8M.masterEntryFlag = false
                            objHardness8M.capacityFlag = true

                        }
                        let IncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                        if (IncompIdHardness != undefined) {
                            IncompIdHardness.incompRepSerNo = Incomp_RepSerNo;
                        }
                        break;

                    case "TH1050S+":
                        var objHardness1050 = globalData.arrHardnessTH1050.find(
                            (ht) => ht.idsNo == IdsNo
                        );

                        let LotDat = globalData.arrLot.find((k) => k.idsNo == IdsNo);
                        if (LotDat == undefined) {
                            globalData.arrLot.push({
                                idsNo: IdsNo,
                                LotNo: getLot[0][0].Lot,
                                MS: "MSHNÂ",
                            });
                        }

                        if (objHardness1050 != undefined) {

                            objHardness1050.idsNo = IdsNo,
                                objHardness1050.arr_heading = [],
                                objHardness1050.arr_reading.length = parseInt(count),
                                objHardness1050.arr_info = [],
                                objHardness1050.extractSample = false,
                                objHardness1050.sampleno = 0,
                                objHardness1050.currentsampleno = parseInt(count),
                                objHardness1050.masterEntryFlag = false,
                                objHardness1050.capacityFlag = true

                        } else {
                            objHardness1050.arr_heading = [];
                            objHardness1050.arr_reading = [];
                            objHardness1050.arr_info = [];
                        }

                }



                return protocol;

            } else {
                return 'no data';
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    async handleProtocol(str_Protocol, str_IpAddress, str_ProtocolBuffer) {
        try {
            // calculating identifier for protocol like IM, ST, FP etc
            var str_ProtocolIdentification = str_Protocol.substring(0, 2);
            var idsNo = str_IpAddress.split('.')[3];
            //console.log(str_ProtocolIdentification)

            var oldProtocolData = globalData.arrOldProtocol.find(k => k.IdsNo == idsNo);
            // if (oldProtocolData != undefined &&
            //     oldProtocolData.protocolRecived.substring(0, oldProtocolData.protocolRecived.length - 2) ==
            //     str_Protocol.substring(0, str_Protocol.length - 2) && (str_Protocol.slice(-2, -1) == "R")) {
            //     //console.log('2');
            //     //console.log('Repeat protocol send', oldProtocolData.Response,oldProtocolData.ip)
            //     var RptLog = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + idsNo + " : " + oldProtocolData.protocolRecived.substring(0, oldProtocolData.protocolRecived.length - 2) + " : " + str_Protocol.substring(0, str_Protocol.length - 2);
            //     //commented by vivek on 3107-2020************************************
            //     //logForRepeat.info(RptLog);
            //     logForRepeat.addToRepeatLog(RptLog)
            //     //***************************************************************** */

            //     var RepeatResponse = "";
            //     if (oldProtocolData.Response == "" || oldProtocolData.Response == undefined) {
            //         RepeatResponse = "+";
            //     }
            //     else {
            //         RepeatResponse = oldProtocolData.Response;
            //     }
            //     var logQ = `REPEAT TRANSMISSION ${oldProtocolData.protocolRecived} -> ${RepeatResponse}`;
            //     console.log(logQ);
            //     //commented by vivek on 31-07-2020********************************
            //     //logFromPC.info(logQ);
            //     //logFromPC.addtoProtocolLog(logQ)
            //     //************************************************************** */
            //     this.sendProtocol(RepeatResponse, oldProtocolData.ip);


            //console.log("REPEAT CHECKER => ", await this.repeatChecker(str_Protocol, idsNo))
            if (await this.repeatChecker(str_Protocol, idsNo) === "NVALID") {
                //console.log("data not found");
            }
            else {

                objProtocolStore.storeProtocol(idsNo, str_Protocol, str_IpAddress);
                // Check if usersarray is undefined for specific IDS
                var objUser = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                if ((objUser == undefined) && (str_ProtocolIdentification != 'ST'
                    && str_ProtocolIdentification != 'ID'
                    && str_ProtocolIdentification != 'DR'
                    && str_ProtocolIdentification != 'IM'
                    && str_ProtocolIdentification != 'LO'
                    && str_ProtocolIdentification != '+'
                    && str_ProtocolIdentification != 'A1'
                    && str_ProtocolIdentification != 'A2'
                    && str_ProtocolIdentification != 'ES')) {
                    this.sendProtocol('LO', str_IpAddress);
                } else {
                    switch (str_ProtocolIdentification) {
                        // below case handles login part if user enter USERNAME and PASSWORD
                        case "ID":
                            if (config.isLDAP == true) {
                                //LDAP
                                var strReturnProtocol = await handleLoginModal.validateUserLDAP(str_Protocol.split(',')[1], str_Protocol.split(',')[0].substring(3), idsNo, str_IpAddress);
                                this.sendProtocol(strReturnProtocol, str_IpAddress);

                            } else {
                                var strReturnProtocol = await handleLoginModal.validateUser(str_Protocol.split(',')[1], str_Protocol.split(',')[0].substring(3), idsNo, str_IpAddress);
                                this.sendProtocol(strReturnProtocol, str_IpAddress);
                            }

                            break;

                        case "A1":
                            this.sendProtocol('+', str_IpAddress);
                            break;
                        case "A2":
                            this.sendProtocol('+', str_IpAddress);
                            break;
                        // STR (Start Protocol)
                        case "ST":
                            //Activity Log for Ids powered on 
                            var objActivity = {};
                            Object.assign(objActivity,
                                { strUserId: 'NA' },
                                { strUserName: 'NA' },
                                { activity: 'IDS ' + idsNo + ' Powered On' });
                            await objActivityLog.ActivityLogEntry(objActivity);
                            await objMonitor.monit({ case: 'ST', idsNo: idsNo });
                            await objIncompleteUpdation.updateReportRemark(idsNo);
                            await handleLoginModal.logOutOnStart(str_IpAddress, idsNo)
                            // await objProtocolStore.storeresponse(idsNo, "+");
                            //this.sendProtocol('+', str_IpAddress);
                            var strReturnProtocol = "+";
                            this.sendProtocol(strReturnProtocol, str_IpAddress);
                            // var str_Protocol = 'SF'
                            // this.sendProtocol(str_Protocol, str_IpAddress);
                            // var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);


                            // var selectVernierObj = {
                            //     str_tableName: 'tbl_vernier',
                            //     data: '*',
                            //     condition: [
                            //         { str_colName: 'VernierID', value: tempCubicInfo.Sys_VernierID }
                            //     ]
                            // }
                            // let vernierMasterresult = await database.select(selectVernierObj);
                            // let ipcFlag = 0;
                            // let vernierFlag = 0;
                            // tempCubicInfo.Sys_Port3 == 'IPC Balance' ? ipcFlag = 1 : ipcFlag = 0;
                            // if (vernierMasterresult[0].length > 0) {
                            //     vernierMasterresult[0][0].Make == "Mitutoyo" ? vernierFlag = 1 : vernierFlag = 0;
                            // }

                            // this.sendProtocol(`SF${ipcFlag}00${vernierFlag}`, str_IpAddress);
                            break;
                        // Tells which type of hex it is
                        case "IM":
                            // await objProtocolStore.storeresponse(idsNo, "+");
                            var tempIM = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                            if (tempIM == undefined) {
                                globalData.arrHexInfo.push({ idsNo: idsNo, IM: str_Protocol.split(',')[0] })
                            } else {
                                tempIM.IM = str_Protocol.split(',')[0];
                            }

                            // var SIRCommand = await objSendSIR.prepareCommand(idsNo);
                            // this.sendProtocol(SIRCommand,str_IpAddress);

                            var strReturnProtocol = `SN${serverConfig.CompanyName};`;
                            //var activateFP = "SF01";
                            this.sendProtocol(strReturnProtocol, str_IpAddress);


                            break;

                        // below case handles login part if user login using FingerPrint Module
                        case "FP":
                            await biometricModel.sendProtocolToWinSer(str_Protocol, str_ProtocolBuffer, str_IpAddress);
                            break;
                        case "SF":
                            var str_Protocol = 'SF'
                            // this.sendProtocol(str_Protocol, str_IpAddress);
                            var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);


                            var selectVernierObj = {
                                str_tableName: 'tbl_vernier',
                                data: '*',
                                condition: [
                                    { str_colName: 'VernierID', value: tempCubicInfo.Sys_VernierID }
                                ]
                            }
                            let vernierMasterresult = await database.select(selectVernierObj);
                            let ipcFlag = 0;
                            let vernierFlag = 0;
                            tempCubicInfo.Sys_Port3 == 'IPC Balance' ? ipcFlag = 1 : ipcFlag = 0;
                            if (vernierMasterresult[0].length > 0) {
                                vernierMasterresult[0][0].Make == "Mitutoyo" ? vernierFlag = 1 : vernierFlag = 0;
                            }

                            this.sendProtocol(`SF${ipcFlag}00${vernierFlag}`, str_IpAddress);
                            break;
                        // // If we get CR from IDS(calibration)
                        case "CR":
                            //this.sendProtocol("CR0", str_IpAddress);
                            let tempObj = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                            objMonitor.monit({ case: 'ID', idsNo: idsNo, data: tempObj });


                            var SIRCommand = await objSendSIR.prepareCommand(idsNo);
                            this.sendProtocol(SIRCommand, str_IpAddress);

                            /* Here We need to check If balance connected or not If balance is not connected then
                               calibration should not be asked, So we need to check in Cubicle object , as well as 
                               we check for balId is set to none or actual id or check for all Port for 101,102,103,104 
                            */
                            // After sucessfull login then recalibration will be will reset after 7 am 
                            await objFetchDetails.resetRecalibration(idsNo);
                            //  this.sendProtocol("CR0", str_IpAddress);
                            // We have to check if user dont have calibration right 

                            //To Enable Calib
                            /**
                            * @description For Sun Pharma Vapi Calibration will not be there, Also `verifyPreCalibration` is in Login
                            * routine so here we are bypass VerifyPreCalibration
                            */
                            //if (config.ProjectName == 'SunPharmaVP') {
                            if (config.ProjectName == 'SunPharmaVP') {
                                this.sendProtocol("CR0", str_IpAddress);
                            } else {
                                var tempCubicInfo = globalData.arrIdsInfo.find(ids => ids.Sys_IDSNo == idsNo);
                                var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == idsNo);
                                var tempBalace = tempCubicInfo.Sys_BalID;
                                var tempVernier = tempCubicInfo.Sys_VernierID;
                                var calibDId = '1';
                                var calibPId = '2';
                                if (objOwner.owner == 'analytical') {
                                    tempBalace = tempCubicInfo.Sys_BalID;
                                    calibDId = '1';
                                    calibPId = '2';
                                } else {
                                    tempBalace = tempCubicInfo.Sys_BinBalID; // Bin Bal
                                    if (tempCubicInfo.Sys_Port3 == 'IPC Balance') {
                                        calibDId = '4';
                                        calibPId = '5';
                                    }
                                }
                                if (tempBalace != 'None' &&
                                    (tempCubicInfo.Sys_Port1 == 'Balance' || tempCubicInfo.Sys_Port2 == 'Balance' || tempCubicInfo.Sys_Port1 == 'IPC Balance'
                                        || tempCubicInfo.Sys_Port3 == 'Balance' || tempCubicInfo.Sys_Port3 == 'IPC Balance')) {
                                    var strReturnProtocol = await dailyCalibrationModel.checkDailyCalibrationPending(str_IpAddress.split('.')[3]);
                                    let obj;
                                    if (strReturnProtocol.substring(0, 3) == `CR${calibDId}`) {
                                        objMonitor.monit({ case: 'CR', idsNo: idsNo, data: { calibType: 'Daily' } });
                                        //strReturnProtocol = "CR0"; // to avoide calibraiton
                                    } else if (strReturnProtocol.substring(0, 3) == `CR${calibPId}`) {
                                        // objMonitor.monit({ case: 'CR', idsNo: idsNo, data: { calibType: 'Periodic' } });
                                        //strReturnProtocol = "CR0"; // to avoide calibraiton
                                    }

                                    //strReturnProtocol = "CR0" //uncomment this line to skip calibration

                                    if (strReturnProtocol.substring(0, 3) == 'CR0') {
                                        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));

                                        if ((tempCubicInfo.Sys_Area == "Compression" || tempCubicInfo.Sys_Area == "Capsule Filling"
                                            || tempCubicInfo.Sys_Area == "Coating" || tempCubicInfo.Sys_Area == 'Granulation'
                                            || tempCubicInfo.Sys_Area == 'Effervescent Compression' || tempCubicInfo.Sys_Area == 'Effervescent Granulation'
                                            || tempCubicInfo.Sys_Area == 'Strepsils' || tempCubicInfo.Sys_Area == 'Allopathic' || tempCubicInfo.Sys_Area == 'Personal Care') && tempCubicInfo.Sys_CubType == globalData.objNominclature.BinText) {

                                            var response = await objContainer.sendIPCProductList(tempCubicInfo.Sys_CubType, tempCubicInfo.Sys_Area);
                                            strReturnProtocol = response;
                                            this.sendProtocol(strReturnProtocol, str_IpAddress);

                                        } else {
                                            // Checking for Periodic Bal_CalbReminder
                                            //COMMENT THIS IF BLOCK FOR REGULAR ROUTINE***********************************************
                                            //Added by vivek on 24-04-2020 11:05
                                            // this if added for protocol validation..
                                            // only 3 commas a  re allowed  AND No need to send TAREA COMMAND
                                            strReturnProtocol = await objFetchDetails.checkForPeriodicDue(str_IpAddress.split('.')[3]);
                                            //************************************************************************************** */
                                            if (strReturnProtocol.substring(0, 3) == 'CR0') {
                                                // If balance routine has no calibration or completed then check calibration for vernier
                                                let vernierCalibrationResponse = await objFetchDetails.checkVernierCalibration(idsNo);

                                                if (vernierCalibrationResponse.substring(0, 3) != 'CR0') {
                                                    let tempRightsObj = globalData.arrUserRights.find(k => k.idsNo == idsNo);
                                                    //sending CR1
                                                    if (tempRightsObj.rights.includes('Calibration')) {
                                                        let objUpdateCubicle = {
                                                            str_tableName: 'tbl_cubical',
                                                            data: [
                                                                { str_colName: 'Sys_CalibInProcess', value: 1 },
                                                            ],
                                                            condition: [
                                                                { str_colName: 'Sys_IDSNo', value: idsNo }
                                                            ]
                                                        }
                                                        console.log('Sys_CalibInProcess set from CP=1')
                                                        await database.update(objUpdateCubicle);
                                                        this.sendProtocol(vernierCalibrationResponse, str_IpAddress);
                                                    } else {
                                                        //message change for mesage validation*******************
                                                        // this.sendProtocol("ID3 YOU DONT HAVE,CALIBRATION RIGHT,,", str_IpAddress);
                                                        //*********************************************** */
                                                        this.sendProtocol("ID3 Calibration Right,Not Assigned,,", str_IpAddress);
                                                    }
                                                } else {
                                                    // CR0
                                                    this.sendProtocol(vernierCalibrationResponse, str_IpAddress);
                                                }

                                            } else {
                                                // Other Wise send Reminder protocol from here
                                                //sending CR2 
                                                let objUpdateCubicle = {
                                                    str_tableName: 'tbl_cubical',
                                                    data: [
                                                        { str_colName: 'Sys_CalibInProcess', value: 1 },
                                                    ],
                                                    condition: [
                                                        { str_colName: 'Sys_IDSNo', value: idsNo }
                                                    ]
                                                }
                                                console.log('Sys_CalibInProcess set from CP=1')
                                                await database.update(objUpdateCubicle);

                                                this.sendProtocol(strReturnProtocol, str_IpAddress);
                                            }

                                        }
                                    }
                                    else {
                                        let tempRightsObj = globalData.arrUserRights.find(k => k.idsNo == idsNo);
                                        //sending CR1
                                        if (tempRightsObj.rights.includes('Calibration')) {
                                            let objUpdateCubicle = {
                                                str_tableName: 'tbl_cubical',
                                                data: [
                                                    { str_colName: 'Sys_CalibInProcess', value: 1 },
                                                ],
                                                condition: [
                                                    { str_colName: 'Sys_IDSNo', value: idsNo }
                                                ]
                                            }
                                            console.log('Sys_CalibInProcess set from CP=1')
                                            await database.update(objUpdateCubicle);

                                            strReturnProtocol = strReturnProtocol.substring(0, strReturnProtocol.length - 1)
                                            this.sendProtocol(strReturnProtocol, str_IpAddress);
                                        } else {
                                            //message change for mesage validation*******************
                                            // this.sendProtocol("ID3 YOU DONT HAVE,CALIBRATION RIGHT,,", str_IpAddress);
                                            //*********************************************** */
                                            this.sendProtocol("ID3 Calibration Right,Not Assigned,,", str_IpAddress);
                                        }
                                    }


                                } else if (tempVernier != 'None' && tempCubicInfo.Sys_Port2 == 'Vernier') {
                                    let tempRightsObj = globalData.arrUserRights.find(k => k.idsNo == idsNo);
                                    // if (tempRightsObj.rights.includes('Calibration')) {
                                    let vernierCalibrationResponse = await objFetchDetails.checkVernierCalibration(idsNo);

                                    if (vernierCalibrationResponse != "CR0") {//CR3
                                        if (tempRightsObj.rights.includes('Calibration')) {
                                            this.sendProtocol(vernierCalibrationResponse, str_IpAddress);
                                        }
                                        else {
                                            this.sendProtocol("ID3 Calibration Right,Not Assigned,,", str_IpAddress);
                                        }
                                    }
                                    else {
                                        this.sendProtocol(vernierCalibrationResponse, str_IpAddress);
                                    }

                                    //}

                                } else {
                                    if (tempBalace == 'None' && tempCubicInfo.Sys_CubType == 'IPC') {
                                        //Added by Pradip 17/09/2020 When port settig is not done then it
                                        // will not ask for weighment
                                        this.sendProtocol("ID3 IPC Balance,Not Assigned,,", str_IpAddress);
                                    } else {
                                        this.sendProtocol("CR0", str_IpAddress);
                                    }
                                }
                            }
                            break;
                        // if Caibration pending 
                        case "CP":
                            objMonitor.monit({ case: 'CP', idsNo: idsNo });
                            // For alerts if CP Protocol comes then calibration starts and we have to update flag that 
                            // calibration is started and not to show alert
                            let objFlagCalibWeigh = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == idsNo);
                            if (objFlagCalibWeigh != undefined) {
                                objFlagCalibWeigh.alertFlag = true;
                            }
                            // console.log(globalData.arr_FlagCallibWeighment)
                            // let objUpdateCubicle = {
                            //     str_tableName: 'tbl_cubical',
                            //     data: [
                            //         { str_colName: 'Sys_CalibInProcess', value: 1 },
                            //     ],
                            //     condition: [
                            //         { str_colName: 'Sys_IDSNo', value: idsNo }
                            //     ]
                            // }
                            // console.log('Sys_CalibInProcess set from CP=1')
                            // await database.update(objUpdateCubicle);
                            var strReturnProtocol = await caliDecider.calibPendingDecider(str_Protocol, str_IpAddress.split('.')[3]);

                            //COMMENT THIS LINE FOR REGULAR ROUTINE***********************************
                            //Added by vivek on 24-04-2020 11:05
                            // this if added for protocol validation..
                            // only 3 commas are allowed  AND No need to send TAREA COMMAND
                            // var count = (strReturnProtocol.match(/,/g) || []).length;
                            // if (count > 3){
                            //     strReturnProtocol =  strReturnProtocol.substring(0,strReturnProtocol.length-1)
                            // }
                            //******************************************************************* */

                            this.sendProtocol(strReturnProtocol, str_IpAddress);

                            break;
                        // for incoming calibration weights 
                        case "CB":
                            var tempIM = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                            var tempBalace = globalData.arrBalance.find(k => k.idsNo == idsNo);
                            var cubicObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                            var vernierId = cubicObj.Sys_VernierID;

                            var TareCmd = "";
                            var appendVal = '';
                            if (tempBalace.balance_info[0].Bal_Make.includes('Mettler') || tempBalace.balance_info[0].Bal_Make.includes('METTLER')) {
                                var objTareCmd = jsonTareCmd.Mettler.find(mod => tempBalace.balance_info[0].Bal_Model.includes(mod.Model));
                                if (objTareCmd == undefined) {
                                    appendVal = jsonTareCmd.Mettler.find(mod => mod.Model == "Default");
                                }
                                else {
                                    appendVal = objTareCmd.TareCmd;
                                }
                            }
                            else if (tempBalace.balance_info[0].Bal_Make.includes('Sarto') || tempBalace.balance_info[0].Bal_Make.includes('SARTO')) {
                                var objTareCmd = jsonTareCmd.Satorious.find(mod => tempBalace.balance_info[0].Bal_Model.includes(mod.Model));
                                if (objTareCmd == undefined) {
                                    appendVal = jsonTareCmd.Satorious.find(mod => mod.Model == "Default");
                                }
                                else {
                                    appendVal = objTareCmd.TareCmd;
                                }

                            }
                            else {
                                appendVal = "T"
                            }


                            // if (tempBalace != undefined) {
                            //     let balSrNo = tempBalace.balance_info[0].Bal_SrNo;
                            //     var appendVal = 'Z';
                            //     if (balSrNo.includes('ML')) {
                            //         appendVal = 'T';
                            //         //appendVal = '0x1B0x540x000x0D0x0A';
                            //     } else {
                            //         appendVal = 'Z';
                            //     }
                            //     if (serverConfig.tareFlag == 'MLH') {
                            //         appendVal = 'T ';
                            //     }
                            // }
                            // SP10 0x1B 0x54 0x00 0x0D 0x0A 
                            var escChar = String.fromCharCode(27);
                            let currentCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                            if (tempIM.IM != "IMC3") {


                                if (currentCubic.Sys_Area == "Effervescent Granulation" || currentCubic.Sys_Area == "Granulation") {
                                    TareCmd = ""
                                }
                                else if (appendVal == "T" && tempBalace.balance_info[0].Bal_Make.includes('Sarto')) {
                                    TareCmd = `SP10${escChar}${appendVal},`
                                }
                                else {
                                    TareCmd = `SP10${appendVal},`
                                }

                                //this.sendProtocol('SP10Z,', str_IpAddress);
                            } else {
                                if (currentCubic.Sys_Area == "Effervescent Granulation" || currentCubic.Sys_Area == "Granulation") {
                                    TareCmd = ""
                                }
                                else if (tempBalace.balance_info[0].Bal_Make.includes('Sarto')) {
                                    TareCmd = `SP20${escChar}${appendVal},`
                                }
                                else {
                                    TareCmd = `SP20${appendVal},`
                                }
                                //this.sendProtocol('SP20Z,', str_IpAddress);
                            }
                            if (config.ProjectName == 'RBH') {
                                TareCmd = "";
                            }
                            // if (vernierId != 'None' && cubicObj.Sys_Port2 == 'Vernier') {
                            //     TareCmd = "";
                            // }
                            var tempCailibType = globalData.arrcalibType.find(k => k.idsNo == idsNo);
                            var calibType = tempCailibType.calibType;
                            var strReturnProtocol = await caliDecider.calibDecider(str_Protocol, str_IpAddress.split('.')[3])
                            if (strReturnProtocol.includes("CR0") || strReturnProtocol.includes("CF")) {
                                if (strReturnProtocol.includes("CR0") && calibType != 'vernierPeriodic') {
                                    // Here After balance calibration Check for vernier calibration calibration
                                    strReturnProtocol = await objFetchDetails.checkVernierCalibration(idsNo);
                                    if (strReturnProtocol.includes("CR0") || strReturnProtocol.includes("CF")) {
                                        let objUpdateCubicle = {
                                            str_tableName: 'tbl_cubical',
                                            data: [
                                                { str_colName: 'Sys_CalibInProcess', value: 0 },
                                            ],
                                            condition: [
                                                { str_colName: 'Sys_IDSNo', value: idsNo }
                                            ]
                                        }
                                        console.log('Sys_CalibInProcess set from CB=0')
                                        await database.update(objUpdateCubicle);
                                        this.sendProtocol(strReturnProtocol, str_IpAddress);
                                    } else {
                                        this.sendProtocol(strReturnProtocol, str_IpAddress);
                                    }
                                } else {
                                    let objUpdateCubicle = {
                                        str_tableName: 'tbl_cubical',
                                        data: [
                                            { str_colName: 'Sys_CalibInProcess', value: 0 },
                                        ],
                                        condition: [
                                            { str_colName: 'Sys_IDSNo', value: idsNo }
                                        ]
                                    }
                                    console.log('Sys_CalibInProcess set from CB=0');
                                    await database.update(objUpdateCubicle);
                                    this.sendProtocol(strReturnProtocol, str_IpAddress);
                                }

                            } else {
                                //COMMENT THIS IF BLOCK FOR REGULAR ROUTINE
                                //Added by vivek on 24-04-2020 11:05
                                // this if added for protocol validation..
                                // only 3 commas are allowed  AND No need to send TAREA COMMAND
                                if (strReturnProtocol.includes("CR") == true) {
                                    //this.sendProtocol(strReturnProtocol + TareCmd, str_IpAddress);
                                    strReturnProtocol = strReturnProtocol.substring(0, strReturnProtocol.length - 1)
                                    this.sendProtocol(strReturnProtocol, str_IpAddress);
                                }
                                else {
                                    this.sendProtocol(strReturnProtocol + TareCmd, str_IpAddress);
                                }
                            }

                            break;
                        // For menu Printing
                        case "MP":
                            var tempVerify = await objCommanFun.calibrationVerification(idsNo);
                            if (tempVerify) {
                                this.sendProtocol(`ID3 UNABLE TO CONTINUE,VERIFY CALIBRATION,,`, str_IpAddress);
                            } else {
                                objMonitor.monit({ case: 'MP', idsNo: idsNo });
                                let rightObj = globalData.arrUserRights.find(k => k.idsNo == idsNo);
                                if (rightObj.rights.includes('Test')) {
                                    var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                                    if (serverConfig.friabilityType == 'BFBT' && tempCubicInfo.Sys_FriabID != 'None') {
                                        // When there is friability connected in production cubicle then we have to show list of
                                        // cubicle in which W1 is over
                                        var retProtocol = await menuRequest.friabilityIPQC(idsNo);
                                        this.sendProtocol(retProtocol, str_IpAddress);
                                    } else if ((tempCubicInfo.Sys_CubType == 'IPQC' || tempCubicInfo.Sys_CubType == 'IPQA')
                                        // Commented by Pradip on 05/10/2020 as from now onwords granulation area also will show IPQC list as
                                        // just like other IPQCs
                                        // && (tempCubicInfo.Sys_Area != 'Effervescent Granulation'
                                        // && tempCubicInfo.Sys_Area != 'Granulation' && tempCubicInfo.Sys_Area != 'Pallet Coating')
                                    ) {

                                        var objAreaRealted = globalData.arrAreaRelated.find(k => k.idsNo == idsNo);
                                        if (objAreaRealted == undefined) {
                                            var retProtocol = await menuRequest.processIPQC(idsNo);
                                            this.sendProtocol(retProtocol, str_IpAddress);
                                        } else {
                                            var retProtocol = await objArea.areaSelection();
                                            this.sendProtocol(retProtocol, str_IpAddress);

                                        }
                                    } else {
                                        var res = await cubicleSetting.checkProductSet(idsNo);
                                        if (res.result == false) {
                                            //var strProtocol = "ID3 Please Set,Product To Cubicle,,";
                                            var strProtocol = "ID3 Product Not Set,,,";
                                            this.sendProtocol(strProtocol, str_IpAddress);
                                        }
                                        else {
                                            var resData = await productdetail.checkProductActivate(res, idsNo, str_Protocol);
                                            var strProtocol;
                                            if (resData.result == "SETPRODUCT") {
                                                strProtocol = "ID3 Product Not, Activated,,";
                                            }
                                            else {
                                                strProtocol = resData.result;
                                            }
                                            this.sendProtocol(strProtocol, str_IpAddress);
                                        }
                                    }
                                } else {
                                    this.sendProtocol("ID3 Test Right,Not Assigned,,,", str_IpAddress);
                                }
                            }
                            break;

                        // Menu request
                        case "MR":

                            var selectedIds;
                            // here we are selecting IDS functionality for that cubicle 
                            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds
                            } else {
                                selectedIds = idsNo; // for compression and coating
                            };

                            // Setting IMGB flag for Bin
                            var tempCheck = globalData.arrisIMGBForBin.find(k => k.idsNo == idsNo);
                            if (tempCheck == undefined) {
                                globalData.arrisIMGBForBin.push({ idsNo: idsNo, flag: false });
                            } else {
                                tempCheck.flag = false;
                            }
                            // setting owner
                            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == idsNo)
                            if (objOwner == undefined) { globalData.arrPreWeighCalibOwner.push({ idsNo: IdsIp, owner: 'analytical' }) }
                            else { objOwner.owner = 'analytical' }
                            objMonitor.monit({ case: 'MR', idsNo: idsNo });
                            var result = await objIncompleteRemark.updateReportRemarkOnBalOF(idsNo);
                            // console.log(result);
                            var res = await objPreWeighmentCheck.validatePreWeighmentActivites(idsNo, true);

                            if (res != "Batch Started," && res != "Valid PreCalibration,") {
                                var strReturnData = "ID3 " + res + ",,,";
                                this.sendProtocol(strReturnData, str_IpAddress);
                            }
                            else {
                                let objFlagCalibWeigh1 = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == idsNo);
                                if (objFlagCalibWeigh1 != undefined) {
                                    objFlagCalibWeigh1.alertFlag = false;
                                }

                                var hardnessResult = await menuSelectModel.getHardnessData(idsNo);
                                if (hardnessResult != undefined) {
                                    let host = hardnessResult.Eqp_IP;
                                    let port = hardnessResult.Eqp_Port;
                                    var tcpObject = globalData.arrHardnessST50LAN.find(k => k.host == host);
                                    if (tcpObject) {
                                        objTCPHardConnection.closeConnection(host);
                                    }
                                }
                                var returnProtocol = await menuRequest.getProductDetail(str_IpAddress.split('.')[3]);
                                if (returnProtocol == 'Area setting mismatched') {
                                    this.sendProtocol('ID3 AREA SETTING,MISMATCHED,,', str_IpAddress);
                                } else {
                                    let objFetchpowerbackup = await clspowerbackup.fetchPowerBackupData(idsNo);
                                    if (objFetchpowerbackup.status && objFetchpowerbackup.result.length > 0) {
                                        var protocol = await clspowerbackup.sendPowerBackupData(objFetchpowerbackup.result, idsNo);
                                        await handleLoginModal.updateWeighmentStatus(idsNo, 1);
                                        this.sendProtocol(protocol, str_IpAddress);
                                    }
                                    else {
                                        // Here we update weighment status true in database
                                        await handleLoginModal.updateWeighmentStatus(idsNo, 1);
                                        //var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                                        // var productDetail = await proObj.productData(currentCubicle);
                                        /**
                                         * for multihaler DPI strip we have only one menu thats why we are not showing menu here
                                         * direct pass to weighment screen
                                         */
                                        // if (currentCubicle.Sys_Area == 'Multihaler' && returnProtocol.substring(2, 4) == '01') {
                                        //     var result = await objFetchDetails.getIds();
                                        //     globalData.arrIdsInfo = result;
                                        //     let objFlagCalibWeigh2 = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == idsNo);
                                        //     if (objFlagCalibWeigh2 != undefined) {
                                        //         objFlagCalibWeigh2.alertFlag = true;
                                        //     }
                                        //     let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);
                                        //     if (objLot == undefined) {
                                        //         globalData.arrLot.push({
                                        //             idsNo: idsNo,
                                        //             MS: "MSXN",
                                        //             LotNo: ""
                                        //         })
                                        //     } else {
                                        //         objLot.MS = "MSXN",
                                        //         objLot.LotNo = "";
                                        //     }

                                        //     var strProtocol = "ESLTA20PLEASE ENTER LOT NO,,,,";
                                        //     this.sendProtocol(strProtocol, str_IpAddress);
                                        // } else {
                                        this.sendProtocol(returnProtocol, str_IpAddress);
                                        // }

                                    }

                                }
                            }

                            break;
                        // List selection
                        case "LS":
                            var returnProtocol = await menuRequest.listSelection(str_IpAddress.split('.')[3], str_Protocol, str_IpAddress);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case "LC":
                            menuRequest.listCancle(str_IpAddress.split('.')[3], str_Protocol, str_IpAddress).then(returnProtocol => {
                                this.sendProtocol(returnProtocol, str_IpAddress);
                            }).catch(err => {
                                console.log('err in case LS', err)
                            });
                            break;
                        // Menu selection
                        case "MS":

                            var result = await objFetchDetails.getIds();

                            globalData.arrIdsInfo = result;

                            var selectedIds;
                            // here we are selecting IDS functionality for that cubicle 
                            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds
                            } else {
                                selectedIds = idsNo; // for compression and coating
                            };
                            if (str_Protocol.substring(2, 3) == 'B') {
                                var tempWhich = globalData.arrWhichMenuSideSelected.find(k => k.idsNo == idsNo);
                                if (tempWhich == undefined) {
                                    globalData.arrWhichMenuSideSelected.push({ idsNo: idsNo, menu: 'B', side: 'N' })
                                } else {
                                    tempWhich.menu = 'B';
                                    tempWhich.side = 'N';
                                }
                                var returnProtocol = await objipcWeighing.handleMSBin(idsNo);
                                this.sendProtocol(returnProtocol, str_IpAddress)
                            } else if (serverConfig.ProjectName == 'MLVeer') {

                                // For NonCipla project we dont have to ask Lot number
                                // setting default NA value to Lot array because that array read for cipla projects
                                let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);
                                if (objLot == undefined) {
                                    globalData.arrLot.push({
                                        idsNo: idsNo,
                                        MS: str_Protocol.trim(),
                                        LotNo: "NA"
                                    })
                                } else {
                                    objLot.MS = str_Protocol.trim(),
                                        objLot.LotNo = "NA";
                                }

                                // Here we fetch again cubicle information (specially when validation test performed and user again 
                                // performed test without logout this time this test is not validation test )
                                // For alerts if MS Protocol comes then weighmnt starts and we have to update flag that 
                                // weighment is started and not to show alert
                                let objFlagCalibWeigh2 = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == idsNo);
                                if (objFlagCalibWeigh2 != undefined) {
                                    objFlagCalibWeigh2.alertFlag = true;
                                }

                                var returnProtocol = await menuSelectModel.processMS(str_IpAddress.split('.')[3], str_Protocol);
                                this.sendProtocol(returnProtocol, str_IpAddress);
                            } else {
                                // Here we fetch again cubicle information (specially when validation test performed and user again 
                                // performed test without logout this time this test is not validation test )
                                // For alerts if MS Protocol comes then weighmnt starts and we have to update flag that 
                                // weighment is started and not to show alert

                                let objFlagCalibWeigh2 = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == idsNo);
                                if (objFlagCalibWeigh2 != undefined) {
                                    objFlagCalibWeigh2.alertFlag = true;
                                }
                                let cheackpowerbackupdata = await clspowerbackup.fetchPowerBackupData(idsNo);
                                if (cheackpowerbackupdata.status == true && cheackpowerbackupdata.result.length > 0) {
                                    var returnProtocol = await menuSelectModel.processMS(str_IpAddress.split('.')[3], str_Protocol);
                                    this.sendProtocol(returnProtocol, str_IpAddress);
                                } else if (str_Protocol.substring(2, 3) == 'R') {
                                    let retuRes = await objFetchDetails.checkFriabilityStatus(idsNo);
                                    if (retuRes.status === 'after') {
                                        var returnProtocol = await menuSelectModel.processMS(str_IpAddress.split('.')[3], str_Protocol);
                                        this.sendProtocol(returnProtocol, str_IpAddress);

                                    } else {
                                        let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);
                                        if (objLot == undefined) {
                                            globalData.arrLot.push({
                                                idsNo: idsNo,
                                                MS: str_Protocol.trim(),
                                                LotNo: ""
                                            })
                                        } else {
                                            objLot.MS = str_Protocol.trim(),
                                                objLot.LotNo = "";
                                        }

                                        var strProtocol = "ESLTA20Enter Lot No.,,,,";
                                        this.sendProtocol(strProtocol, str_IpAddress);

                                    }
                                } else if (str_Protocol.substring(2, 3) != 'G') {
                                    let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);
                                    if (objLot == undefined) {
                                        globalData.arrLot.push({
                                            idsNo: idsNo,
                                            MS: str_Protocol.trim(),
                                            LotNo: ""
                                        })
                                    } else {
                                        objLot.MS = str_Protocol.trim(),
                                            objLot.LotNo = "";
                                    }

                                    var strProtocol = "ESLTA20Enter Lot No.,,,,";
                                    this.sendProtocol(strProtocol, str_IpAddress);
                                }
                                else {

                                    this.sendProtocol('+', str_IpAddress);
                                }
                            }

                            //menuSelectModel.processMS(str_IpAddress.split('.')[3], str_Protocol).then(returnProtocol => {
                            //     this.sendProtocol(returnProtocol, str_IpAddress);
                            // }).catch(err => {
                            //     console.log('err in case TS', err)
                            // });
                            break;
                        // For current Time & Date

                        //added by vivek11101997 powerbackup 
                        case "PC":
                            // var selectedIds;
                            // var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                            // if (IPQCObject != undefined) {
                            //     selectedIds = IPQCObject.idsNo;
                            // } else {
                            //     selectedIds = idsNo; // for compression and coating
                            // };

                            var weightment_type = str_Protocol.substring(2, 3);
                            if (weightment_type == '0') {//handling powerbackup discard condition 
                                console.log('powerbakup discard');
                                // TO-DO // We can direct call MR from here
                                await clspowerbackup.deletePowerBackupData(idsNo);
                                this.handleProtocol('MRN￻', str_IpAddress, '');
                            }
                            else {

                                var fetchpowerbackup = await clspowerbackup.fetchPowerBackupData(idsNo);
                                let objhandelpcprotocol;

                                // if (fetchpowerbackup.result[0].Sys_CubType == "IPQC") {

                                //     objhandelpcprotocol = await clspowerbackup.handelPCProtocol(fetchpowerbackup[0], weightment_type, selectedIds);

                                // }
                                // else {
                                objhandelpcprotocol = await clspowerbackup.handelPCProtocol(fetchpowerbackup.result, weightment_type, idsNo);

                                // }

                                this.sendProtocol(objhandelpcprotocol, str_IpAddress);

                            }

                            break;
                        case "TM":
                            var returnProtocol = await timeModel.handleTMProtocol(str_IpAddress.split('.')[3], str_Protocol);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case "WS":
                            // clear Array of Multihealer on WS
                            //str_Protocol
                            if (globalData.arrMultiHealerCal != undefined) {
                                globalData.arrMultiHealerCal = globalData.arrMultiHealerCal
                                    .filter(k => k.idsNo != idsNo)
                            }
                            var selectedIds;
                            // here we are selecting IDS functionality for that cubicle 
                            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds
                            } else {
                                selectedIds = idsNo; // for compression and coating
                            };

                            var testType = str_Protocol.substring(2, 3)
                            var ObjCheckPoweBackUp = await clspowerbackup.fetchPowerBackupData(idsNo);
                            if (ObjCheckPoweBackUp.status && ObjCheckPoweBackUp.result.length > 0) {
                                objMonitor.monit({ case: 'WS', idsNo: idsNo });
                                var returnProtocol = await processWTModel.processWS(str_IpAddress.split('.')[3], str_Protocol);
                                this.sendProtocol(returnProtocol, str_IpAddress);
                            }
                            else {
                                // var instrument = await this.instrumentCheck(str_Protocol.substring(2, 3), idsNo)
                                // var response = await objRemarkInComplete.checkEntry(selectedIds, idsNo, instrument, idsNo, 0);
                                // if (response != false) {
                                //     var actualData = `ID3 Remark Pending For,${response.param.toUpperCase()} Test,,`;

                                //     this.sendProtocol(actualData, str_IpAddress);

                                // } else {
                                //     objMonitor.monit({ case: 'WS', idsNo: idsNo });
                                //     var returnProtocol = await processWTModel.processWS(str_IpAddress.split('.')[3], str_Protocol);
                                //     this.sendProtocol(returnProtocol, str_IpAddress);
                                // }
                                let currentCubicObject = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));
                                if (currentCubicObject.Sys_PortNo == 103 || currentCubicObject.Sys_PortNo == 104) {
                                    var portInstrument3 = currentCubicObject.Sys_Port3.toUpperCase();
                                    var portInstrument4 = currentCubicObject.Sys_Port4.toUpperCase();
                                    let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);
                                    if (portInstrument3 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "FRIABILATOR"

                                    } else if (portInstrument4 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "FRIABILATOR"
                                    } else if (portInstrument3 == 'DISINTEGRATION TESTER' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "DISINTEGRATION TESTER"
                                    } else if (portInstrument4 == 'DISINTEGRATION TESTER' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "DISINTEGRATION TESTER"
                                    }
                                    else if (portInstrument3 == 'BALANCE' && serverConfig.friabilityType == 'OB' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "BALANCE"
                                    } else if (portInstrument4 == 'BALANCE' && serverConfig.friabilityType == 'OB' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "BALANCE"
                                    }
                                    else if (portInstrument3 == 'MOISTURE ANALYZER' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "LOD"
                                    } else if (portInstrument4 == 'MOISTURE ANALYZER' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "LOD"
                                    }
                                    else if (portInstrument3 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "Hardness"

                                    } else if (portInstrument4 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "Hardness"

                                    }
                                    else if (portInstrument3 == 'TABLET TESTER' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "Tablet Tester"
                                    } else if (portInstrument4 == 'TABLET TESTER' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "Tablet Tester"
                                    }
                                    else if (portInstrument3 == 'TAPPED DENSITY' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "TAPPED DENSITY"
                                    } else if (portInstrument4 == 'TAPPED DENSITY' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "TAPPED DENSITY"
                                    }

                                } else {
                                    var portInstrument1 = currentCubicObject.Sys_Port1.toUpperCase();
                                    var portInstrument2 = currentCubicObject.Sys_Port2.toUpperCase();
                                    let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);

                                    if (portInstrument1 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "FRIABILATOR"
                                    } else if (portInstrument2 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "FRIABILATOR"
                                    } else if (portInstrument1 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "Hardness"
                                    } else if (portInstrument2 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "Hardness"
                                    }
                                    else if (portInstrument1 == 'DISINTEGRATION TESTER' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "DISINTEGRATION TESTER"
                                    } else if (portInstrument2 == 'DISINTEGRATION TESTER' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "DISINTEGRATION TESTER"
                                    }
                                    else if (portInstrument1 == 'TAPPED DENSITY' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "TAPPED DENSITY"
                                    } else if (portInstrument2 == 'TAPPED DENSITY' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "TAPPED DENSITY"
                                    }
                                    else if (portInstrument1 == 'TABLET TESTER' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "Tablet Tester"

                                    } else if (portInstrument2 == 'TABLET TESTER' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "Tablet Tester"

                                    }
                                    if (portInstrument1 == 'BALANCE' && serverConfig.friabilityType == 'OB' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "BALANCE"

                                    } else if (portInstrument2 == 'BALANCE' && serverConfig.friabilityType == 'OB' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "BALANCE"
                                    }
                                    else if (portInstrument1 == 'MOISTURE ANALYZER' && objLot.MS.substring(2, 3) == 'T') {
                                        testType = "LOD"
                                    } else if (portInstrument2 == 'MOISTURE ANALYZER' && objLot.MS.substring(2, 3) == 'H') {
                                        testType = "LOD"
                                    }

                                }

                                var response = await objRemarkInComplete.checkEntry(selectedIds, idsNo, 0, testType);
                                if (response != false) {
                                    var actualData = `ID3 Remark Pending For,${response.param.toUpperCase()} Test,,`;

                                    this.sendProtocol(actualData, str_IpAddress);

                                } else {
                                    objMonitor.monit({ case: 'WS', idsNo: idsNo });
                                    var returnProtocol = await processWTModel.processWS(str_IpAddress.split('.')[3], str_Protocol);
                                    this.sendProtocol(returnProtocol, str_IpAddress);
                                }
                            }


                            break;
                        case "WT":
                            var actualWt = str_Protocol.split(" ");
                            var type = actualWt[0];
                            var typeValue = type.substring(3, 2);
                            var returnProtocol = await processWeighment.insertWeighmentData(str_IpAddress.split('.')[3], str_Protocol);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case "SR":
                            var returnProtocol = ''
                            var IdsNo = str_IpAddress.split('.')[3];
                            var selectedIds;
                            // here we are selecting IDS functionality for that cubicle 
                            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds
                            } else {
                                selectedIds = IdsNo; // for compression and coating
                            };
                            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                            var CubicMaschineSpeedMax = currentCubicalObj.Sys_MachineSpeed_Max
                            var CubicMaschineSpeedMin = currentCubicalObj.Sys_MachineSpeed_Min
                            var apperanceVal = str_Protocol.substring(9, 10); // 0=not ok && 1=ok
                            var IDScMaschineSpeed = parseInt(str_Protocol.substring(6, 9));
                            var MscTim = date.format(new Date(), 'HH:mm:ss');
                            var AppTim = date.format(new Date(), 'HH:mm:ss');
                            var tempWhich = globalData.arrWhichMenuSideSelected.find(k => k.idsNo == IdsNo);
                            if (currentCubicalObj.Sys_RotaryType == 'Double' && tempWhich.side == 'R') {
                                IDScMaschineSpeed = await objFetchDetails.checkMachineSpeedForLR(selectedIds);
                            }

                            if ((IDScMaschineSpeed < CubicMaschineSpeedMin || IDScMaschineSpeed > CubicMaschineSpeedMax || IDScMaschineSpeed == 0)) {
                                returnProtocol = `DM0A0 Enter Valid, Machine Speed, Limit:${CubicMaschineSpeedMin}-${CubicMaschineSpeedMax},,;`
                                this.sendProtocol(returnProtocol, str_IpAddress);
                            }
                            else {
                                var obj = globalData.arGrpMschSpeedAndApp.find(k => k.idsNo == IdsNo)
                                if (obj == undefined) {
                                    globalData.arGrpMschSpeedAndApp.push({ idsNo: IdsNo, MaschineSpeed: IDScMaschineSpeed, Appereance: apperanceVal, AppearanceTime: AppTim, MachineTime: MscTim })
                                }
                                else {
                                    obj.MaschineSpeed = IDScMaschineSpeed
                                    obj.Appereance = apperanceVal
                                    obj.AppearanceTime = AppTim
                                    obj.MachineTime = MscTim
                                }
                            }
                            break;
                        case "WC":
                            var tempCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                            objMonitor.monit({ case: 'WC', idsNo: idsNo });
                            if (serverConfig.ProjectName == "SunHalolGuj1" || tempCubic.Sys_Area == 'Dosa Dry Syrup') {
                                this.sendProtocol('LO', str_IpAddress);
                            } else if (serverConfig.friabilityType == 'BFBT' && (tempCubic.Sys_Port1 == 'Friabilator' ||
                                tempCubic.Sys_Port2 == 'Friabilator' || tempCubic.Sys_Port3 == 'Friabilator' || tempCubic.Sys_Port4 == 'Friabilator')) {
                                this.handleProtocol('MPN￻', str_IpAddress, '');
                            } else {
                                var returnProtocol = "";
                                var tempIM = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
                                if (tempIM.IM == "IMC4" || tempIM.IM == "IMC2") {
                                    returnProtocol = "+";
                                }
                                else {
                                    returnProtocol = await processWeighment.insertWeighmentData(str_IpAddress.split('.')[3], str_Protocol);
                                }
                                this.sendProtocol(returnProtocol, str_IpAddress);


                                //after completion of Wgtmnt send the MENU screen on IDS 
                                let objFlagCalibWeigh1 = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == idsNo);
                                if (objFlagCalibWeigh1 != undefined) {
                                    objFlagCalibWeigh1.alertFlag = false;
                                }
                                var returnProtocol1 = await menuRequest.getProductDetail(str_IpAddress.split('.')[3]);
                                if (returnProtocol1 == 'Area setting mismatched') {
                                    this.sendProtocol('ID3 AREA SETTING,MISMATCHED,,', str_IpAddress);
                                } else {
                                    this.sendProtocol(returnProtocol1, str_IpAddress);
                                }
                            }
                            break;
                        case "TD":
                            var tempCubic = globalData.arrIdsInfo.find(cubic => cubic.Sys_IDSNo == idsNo);
                            /**
                             * HERE WE WILL SCAN PORT INSTRUMENTS AND IDS TYPE
                             */
                            var Sys_PortNo = tempCubic.Sys_PortNo;
                            if (Sys_PortNo == 101 || Sys_PortNo == 102) {
                                var instrument = tempCubic.Sys_Port2;
                                this.selectInstrument(instrument, str_IpAddress, str_Protocol);
                            } else if (Sys_PortNo == 103 || Sys_PortNo == 104) {
                                var instrument = tempCubic.Sys_Port3;
                                this.selectInstrument(instrument, str_IpAddress, str_Protocol);
                            }
                            break;
                        case "ED":
                            var tempCubic = globalData.arrIdsInfo.find(cubic => cubic.Sys_IDSNo == idsNo);
                            /**
                             * THIS CASE IS ONLY FOR IMG2/IMG3 AND PORT 2/PORT 1 INSTRUMENT
                             * HERE WE WILL SCAN PORT INSTRUMENTS AND IDS TYPE
                             */
                            var Sys_PortNo = tempCubic.Sys_PortNo;
                            if (Sys_PortNo == 101 || Sys_PortNo == 102) {
                                var instrument = tempCubic.Sys_Port2;
                                this.selectInstrument(instrument, str_IpAddress, str_Protocol);
                            } else if (Sys_PortNo == 103 || Sys_PortNo == 104) {
                                var instrument = tempCubic.Sys_Port2;
                                this.selectInstrument(instrument, str_IpAddress, str_Protocol);
                            }
                            break;
                        case "HD":
                            var tempCubic = globalData.arrIdsInfo.find(cubic => cubic.Sys_IDSNo == idsNo);
                            /**
                             * HERE WE WILL SCAN PORT INSTRUMENTS AND IDS TYPE
                             */
                            var Sys_PortNo = tempCubic.Sys_PortNo;
                            if (Sys_PortNo == 101 || Sys_PortNo == 102) {
                                var instrument = tempCubic.Sys_Port1;
                                this.selectInstrument(instrument, str_IpAddress, str_Protocol);
                            } else if (Sys_PortNo == 103 || Sys_PortNo == 104) {
                                var instrument = tempCubic.Sys_Port4;
                                this.selectInstrument(instrument, str_IpAddress, str_Protocol);
                            }
                            break;
                        case "CC":
                            var logOutType = str_Protocol.substring(2, 3);
                            var current_Time = moment();
                            var SkipStartTime = moment('07:00:00', 'hh:mm:ss');
                            var SkipEndTime = moment('9:00:00', 'hh:mm:ss');


                            if (current_Time.isBetween(SkipStartTime, SkipEndTime)) {
                                this.sendProtocol('CR0', str_IpAddress);
                            }
                            else {
                                await objIncompleteRemark.updateReportRemarkOnLO(idsNo);
                                await handleLoginModal.logOut(str_IpAddress.split('.')[3], logOutType);
                                this.sendProtocol('LO', str_IpAddress);
                            }

                            //objMonitor.monit({ case: 'LO', idsNo: idsNo });
                            break;
                        case "LO":
                            var logOutType = str_Protocol.substring(2, 3);
                            await objIncompleteRemark.updateReportRemarkOnLO(idsNo);
                            await handleLoginModal.logOut(str_IpAddress.split('.')[3], logOutType);
                            this.sendProtocol('+', str_IpAddress);
                            objMonitor.monit({ case: 'LO', idsNo: idsNo });
                            // var strReturnProtocol = "+";
                            // this.sendProtocol(strReturnProtocol, str_IpAddress);

                            break;

                        case "EN":
                            //  console.log(str_Protocol);
                            //parse edited samples from protocol.
                            var NOS = parseInt(str_Protocol.substring(2, 5));
                            var selectedIds;
                            if (!isNaN(NOS)) {
                                var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                                if (IPQCObject != undefined) {
                                    selectedIds = IPQCObject.selectedIds;
                                } else {
                                    selectedIds = idsNo;
                                }
                                var cubicObject = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                                var currentCubicObject = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));
                                //update NOs to Database table
                                let objLot = globalData.arrLot.find(k => k.idsNo == idsNo);
                                var IndORGrpORFri = "1"; // BALANCE IND
                                if (objLot.MS.substring(2, 3) == 'H' || objLot.MS.substring(2, 3) == 'T') {
                                    if (currentCubicObject.Sys_PortNo == 103 || currentCubicObject.Sys_PortNo == 104) {
                                        var portInstrument3 = currentCubicObject.Sys_Port3.toUpperCase();
                                        var portInstrument4 = currentCubicObject.Sys_Port4.toUpperCase();

                                        if (portInstrument3 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'T') {
                                            IndORGrpORFri = "3"
                                        } else if (portInstrument4 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'H') {
                                            IndORGrpORFri = "3"
                                        }

                                        if (portInstrument3 == 'DISINTEGRATION TESTER' && objLot.MS.substring(2, 3) == 'T') {
                                            IndORGrpORFri = "4"
                                        } else if (portInstrument4 == 'DISINTEGRATION TESTER' && objLot.MS.substring(2, 3) == 'H') {
                                            IndORGrpORFri = "4"
                                        }


                                        else if (portInstrument3 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'T') {
                                            IndORGrpORFri = "5"
                                        }
                                        else if (portInstrument4 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'H') {
                                            IndORGrpORFri = "5"
                                        }
                                        else {
                                            IndORGrpORFri = "1";
                                        }
                                    } else {
                                        var portInstrument1 = currentCubicObject.Sys_Port1.toUpperCase();
                                        var portInstrument2 = currentCubicObject.Sys_Port2.toUpperCase();


                                        if (portInstrument1 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'H') {
                                            IndORGrpORFri = "3"
                                        } else if (portInstrument2 == 'FRIABILATOR' && objLot.MS.substring(2, 3) == 'T') {
                                            IndORGrpORFri = "3"
                                        }
                                        else if (portInstrument1 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'H') {
                                            IndORGrpORFri = "5"
                                        }
                                        else if (portInstrument2 == 'HARDNESS' && objLot.MS.substring(2, 3) == 'T') {
                                            IndORGrpORFri = "5"
                                        }
                                        else {
                                            IndORGrpORFri = "1";
                                        }

                                    }
                                } else {
                                    IndORGrpORFri = "1";
                                }
                                var tempUser = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUser.UserId },
                                    { strUserName: tempUser.UserName },
                                    { activity: `Sample Edited to ${NOS}` })
                                objActivityLog.ActivityLogEntry(objActivity);
                                objNosUpdate.updateSample(cubicObject, NOS, IndORGrpORFri).then(result => {
                                    let tempArrLimits = globalData.arr_limits.find(k => k.idsNo == idsNo);
                                    if (IndORGrpORFri == "1" || IndORGrpORFri == "3" || IndORGrpORFri == "5") {
                                        for (let key in tempArrLimits) {
                                            if (key !== "idsNo" && key !== "Group" && key !== "Grp_Layer" &&
                                                key !== "Grp_Layer1" && key !== 'Friability') {
                                                tempArrLimits[key].noOfSamples = NOS
                                            }
                                        }
                                    } else {
                                        for (let key in tempArrLimits) {
                                            if (key == "Friability") {
                                                tempArrLimits[key].noOfSamples = NOS
                                            }
                                        }
                                    }
                                    this.sendProtocol('+', str_IpAddress);
                                    // console.log(tempArrLimits)
                                })
                            }
                            break;


                        case "CN":
                            var IPC_CODE = str_Protocol.split(',')[0]
                            IPC_CODE = IPC_CODE.substring(2, IPC_CODE.length);
                            var arrgroupipcob = globalData.arrGroupIPC.find(k => k.idsNo == idsNo);
                            if (arrgroupipcob == undefined) {
                                globalData.arrGroupIPC.push(
                                    {
                                        idsNo: idsNo,
                                        ipcCode: IPC_CODE
                                    }
                                )
                            }
                            else {
                                arrgroupipcob.ipcCode = IPC_CODE;
                            }
                            console.log(IPC_CODE);
                            break;
                        case "ES":

                            var selectedIds;
                            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds;
                            } else {
                                selectedIds = idsNo;
                            }
                            let tempCubicleObject = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                            if (str_Protocol.substring(2, 3) == 'D') { // For DT JAR Selection DT or DH
                                if (tempCubicleObject.Sys_RotaryType == 'Single') { // For single rotory
                                    // If rototy type is single then we have to store this jar in global Array for 
                                    // Further use 
                                    let objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == idsNo);
                                    let objInvalidBulk = globalData.arrBulkInvalid.find(k => k.idsNo == idsNo);
                                    let jarType = str_Protocol.substring(4, 5);
                                    if (objJARTypeDT == undefined) {
                                        globalData.arrJARTypeDT.push({
                                            idsNo: idsNo,
                                            JarType: jarType
                                        })
                                    } else {
                                        objJARTypeDT.JarType = jarType;
                                    }

                                    if (objInvalidBulk == undefined) {
                                        const objBulkInvalid = new IBulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = idsNo;
                                        globalData.arrBulkInvalid.push(objBulkInvalid.invalidObj);
                                    }
                                    else {
                                        const objBulkInvalid = new IBulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = idsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = false;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "";
                                        Object.assign(objInvalidBulk, objBulkInvalid.invalidObj);
                                    }
                                    var DTModel = await this.CheckDTModel(idsNo, str_Protocol);
                                    if (DTModel == 'Electrolab-ED3PO') {
                                        if (str_Protocol.substring(4, 5) == 'A' || str_Protocol.substring(4, 5) == 'B' || str_Protocol.substring(4, 5) == 'C') {
                                            var result = await menuSelectModel.processES(str_IpAddress.split('.')[3], str_Protocol);
                                            this.sendProtocol(result, str_IpAddress);
                                        } else {
                                            // IF Selection is rather than A OR B then we have to send this message again
                                            let protocolToBeSend = `ESD${str_Protocol.substring(3, 4)}A01Select Jar A OR Jar, B OR Jar C,,,`;
                                            this.sendProtocol(protocolToBeSend, str_IpAddress);
                                        }

                                    } else {
                                        if (str_Protocol.substring(4, 5) == 'A' || str_Protocol.substring(4, 5) == 'B') {
                                            var result = await menuSelectModel.processES(str_IpAddress.split('.')[3], str_Protocol);
                                            this.sendProtocol(result, str_IpAddress);
                                        } else {
                                            // IF Selection is rather than A OR B then we have to send this message again
                                            let protocolToBeSend = `ESD${str_Protocol.substring(3, 4)}A01Select Jar A OR Jar B,,,,`;
                                            this.sendProtocol(protocolToBeSend, str_IpAddress);
                                        }
                                    }
                                } else { // For Double rotory we ignore this message

                                    let objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == idsNo);
                                    let objInvalidBulk = globalData.arrBulkInvalid.find(k => k.idsNo == idsNo);
                                    let jarType = str_Protocol.substring(4, 5);

                                    if (objJARTypeDT == undefined) {
                                        globalData.arrJARTypeDT.push({
                                            idsNo: idsNo,
                                            JarType: jarType
                                        })
                                    } else {
                                        objJARTypeDT = jarType;
                                    }

                                    if (objInvalidBulk == undefined) {
                                        const objBulkInvalid = new IBulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = idsNo;
                                        globalData.arrBulkInvalid.push(objBulkInvalid.invalidObj);
                                    }
                                    else {
                                        const objBulkInvalid = new IBulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = idsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = false;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "";
                                        Object.assign(objInvalidBulk, objBulkInvalid.invalidObj);
                                    }
                                    if (str_Protocol.substring(4, 5) == 'A' || str_Protocol.substring(4, 5) == 'B') {
                                        var result = await menuSelectModel.processES(str_IpAddress.split('.')[3], str_Protocol);
                                        this.sendProtocol(result, str_IpAddress);

                                    }
                                    else {
                                        let protocolToBeSend = `ESD${str_Protocol.substring(3, 4)}A01JAR A FOR LHS,JAR B FOR RHS,,,`;
                                        this.sendProtocol(protocolToBeSend, str_IpAddress);
                                    }
                                }
                            }
                            else if (str_Protocol.substring(2, 4) == 'LT') { // After entering LOT number Send MS protocol reply
                                var objLotData = globalData.arrLot.find(k => k.idsNo == idsNo);
                                var LotNo = str_Protocol.substring(4, str_Protocol.indexOf(","));
                                if (LotNo == 'NULL' && LotNo == null) {
                                    LotNo = 'NA';
                                } else {
                                    LotNo = LotNo;
                                }
                                objLotData.LotNo = LotNo;
                                if (objLotData != undefined) {
                                    let strMsProtocol = objLotData.MS;
                                    var returnProtocol = await menuSelectModel.processMS(idsNo, strMsProtocol);
                                    this.sendProtocol(returnProtocol, str_IpAddress);
                                }
                            } else if (str_Protocol.substring(2, 3) == 'W') {
                                var tmpObj = globalData.arrUsers.find(k => k.IdsNo == idsNo);
                                if (str_Protocol.substring(3, 4) == '/') {
                                    // Go To login
                                    tmpObj.ForceLogin = true;
                                    var strReturnProtocol = await handleLoginModal.validateUser(tmpObj.UserId, tmpObj.UserPass, idsNo, str_IpAddress);
                                    this.sendProtocol(strReturnProtocol, str_IpAddress);
                                } else {
                                    var strReturnProtocol = await handleLoginModal.updatePassword(tmpObj, idsNo, str_Protocol);
                                    this.sendProtocol(strReturnProtocol, str_IpAddress);
                                }
                            }
                            else { // For side Change
                                let side = str_Protocol.substring(2, 3); // R OR L
                                let tempArrLimits = globalData.arr_limits.find(k => k.idsNo == idsNo);
                                var tempWhich = globalData.arrWhichMenuSideSelected.find(k => k.idsNo == idsNo);
                                if (tempWhich != undefined) {
                                    if (tempWhich.menu == '2') {
                                        tempWhich.side = side;
                                    }
                                }
                                for (let key in tempArrLimits) {
                                    if (key !== "idsNo") {
                                        tempArrLimits[key].side = side
                                    }
                                }
                                this.sendProtocol('+', str_IpAddress);
                            }

                            break;
                        case "DR":
                            if (str_Protocol.substring(3, 4) == 'G') {
                                await this.handleDRForAlert(str_IpAddress.split('.')[3]);
                                this.sendProtocol('+', str_IpAddress);
                            } else if (str_Protocol.substring(3, 4) == 'C') {
                                this.sendProtocol('CR0', str_IpAddress);
                            } else if (str_Protocol.substring(3, 4) == 'B') {
                                var objLocation = globalData.arrIPCLocation.find(k => k.idsNo == idsNo);
                                objLocation = objLocation == undefined ? 'None' : objLocation.location;

                                if (objLocation == 'cubicle') {
                                    this.handleProtocol('MRN￻', str_IpAddress, '');
                                    return 0;
                                } else {
                                    var resCubical = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                                    var strBins = await objContainer.sendIPCProductList(resCubical.Sys_CubType, resCubical.Sys_Area);
                                    this.sendProtocol(strBins, str_IpAddress);
                                }

                            }
                            else if (str_Protocol.substring(3, 4) == 'E') {//this is use for CIPLA_INDORE project added by vivek
                                var tempTDObj = globalData.arrNetwtResult.find(td => td.idsNo == idsNo);
                                if (tempTDObj == undefined) {
                                    tempTDObj.idsNo = idsNo;
                                    tempTDObj.NwResult = '';
                                } else {
                                    var result = tempTDObj.NwResult;
                                    tempTDObj.idsNo = '';
                                    tempTDObj.NwResult = '';
                                }
                                this.sendProtocol(result, str_IpAddress);
                            }
                            else {
                                this.sendProtocol('+', str_IpAddress);
                            }
                            break;
                        case "EC":
                            if (str_Protocol.substring(2, 4) == 'LT') {
                                var objLotData = globalData.arrLot.find(k => k.idsNo == idsNo);
                                objLotData.LotNo = "NA";
                                if (objLotData != undefined) {
                                    let strMsProtocol = objLotData.MS;
                                    var returnProtocol = await menuSelectModel.processMS(idsNo, strMsProtocol);
                                    this.sendProtocol(returnProtocol, str_IpAddress);
                                }
                            } else if (str_Protocol.substring(2, 3) == 'D') {
                                this.handleProtocol('MRN￻', str_IpAddress, '');
                            } else {
                                this.sendProtocol('+', str_IpAddress);
                            }
                            break;
                        case "CL":
                            objMonitor.monit({ case: 'CL', idsNo: idsNo });
                            await menuSelectModel.handleCLProtocol(idsNo);
                            await objIncompleteRemark.updateReportRemark(idsNo);
                            console.log('powerback up clear after cl');
                            await clspowerbackup.deletePowerBackupData(idsNo);
                            this.handleProtocol('MRN￻', str_IpAddress, '');
                            break;
                        case 'CM':
                            var CMFlag = globalData.arrVernierCalCMFlag.find(k => k.idsNo == idsNo);
                            var CMFlag = CMFlag == undefined ? false : CMFlag.blnDone;
                            if (str_Protocol.substring(3, 4) == '1') {
                                // Forcefuly calibration
                                var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == idsNo);
                                var calibPId = '2';
                                if (objOwner.owner == 'analytical') {
                                    calibPId = '2';
                                } else {
                                    calibPId = '5';
                                }
                                if (serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file
                                    var TempCalibType = globalData.arrcalibType.find(k => k.idsNo == idsNo);
                                    if (TempCalibType != undefined) {
                                        TempCalibType.calibType = 'periodic';
                                    } else {
                                        globalData.arrcalibType.push({ idsNo: idsNo, calibType: 'periodic' })
                                    }
                                    objMonitor.monit({ case: 'CR', idsNo: idsNo, data: { calibType: 'Linearity' } });
                                    //this.sendProtocol(`CR${calibPId}0LINEARITY CALIB,PENDING FOR BALANCE,,,`,str_IpAddress);
                                    //this.sendProtocol(`CR${calibPId}0Linearity,Calibration Pending,,,`, str_IpAddress);
                                    this.sendProtocol(`CR${calibPId}1Linearity,Calibration Pending,,,`, str_IpAddress);

                                } else {
                                    // this.sendProtocol('CR0', str_IpAddress);
                                    if (!CMFlag) {
                                        var strReturnProtocol = await objFetchDetails.checkVernierCalibration(idsNo);
                                        this.sendProtocol(strReturnProtocol, str_IpAddress);
                                    } else {
                                        // checking if reminder is for IPc or balance
                                        var temp = globalData.arrWhichMenuSideSelected.find(k => k.idsNo == idsNo);
                                        if (temp != undefined) {
                                            if (temp.menu == 'B') {
                                                temp.side = 'Done';
                                                var returnProtocol = await objipcWeighing.handleMSBin(idsNo);
                                                // using predefine menuselected array for our perpose using side varibale for our flag //N->Done

                                                this.sendProtocol(returnProtocol, str_IpAddress)
                                            } else {
                                                this.sendProtocol('CR0', str_IpAddress);
                                            }

                                        } else {
                                            this.sendProtocol('CR0', str_IpAddress);
                                        }
                                    }
                                }
                            } else {
                                // Dont take calibration
                                // check for vernier calibration
                                if (!CMFlag) {
                                    var strReturnProtocol = await objFetchDetails.checkVernierCalibration(idsNo);
                                    this.sendProtocol(strReturnProtocol, str_IpAddress);
                                } else {
                                    // checking if reminder is for IPc or balance
                                    var temp = globalData.arrWhichMenuSideSelected.find(k => k.idsNo == idsNo);
                                    if (temp != undefined) {
                                        if (temp.menu == 'B') {
                                            temp.side = 'Done';
                                            var returnProtocol = await objipcWeighing.handleMSBin(idsNo);
                                            // using predefine menuselected array for our perpose using side varibale for our flag //N->Done

                                            this.sendProtocol(returnProtocol, str_IpAddress)
                                        } else {
                                            this.sendProtocol('CR0', str_IpAddress);
                                        }

                                    } else {
                                        this.sendProtocol('CR0', str_IpAddress);
                                    }
                                }
                            }
                            break;
                        case 'SW':
                            let identification = str_Protocol.substring(2, 3);
                            var returnResult = await menuRequest.listSelection(idsNo, `LSP${identification}`, str_IpAddress);
                            //if (returnResult == 'DM0B0ALL IPCs ARE OVER,FOR THIS BATCH,,,') {
                            if (returnResult == 'DM0B0No IPC Available,,,,') {
                                returnResult = 'WO;'
                            }
                            this.sendProtocol(returnResult, str_IpAddress);
                            break;
                        case 'SB':
                            var returnResult = await menuRequest.SelectedBin(idsNo, str_Protocol, str_IpAddress);
                            // this.sendProtocol(returnResult, str_IpAddress);
                            break;
                        case 'EW':
                            //Empty weight of Bin
                            var returnProtocol = await menuRequest.saveEmptyWt(idsNo, str_Protocol, str_IpAddress);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case 'GW':
                            //Empty weight of Bin
                            var returnProtocol = await menuRequest.saveGrossWt(idsNo, str_Protocol, str_IpAddress);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case "NW":
                            var actualWt = str_Protocol.split(" ");
                            var type = actualWt[0];
                            var typeValue = type.substring(3, 2);
                            var returnProtocol = await processWeighment.insertWeighmentData(str_IpAddress.split('.')[3], str_Protocol);
                            this.sendProtocol(returnProtocol, str_IpAddress);

                            break;


                        case "LN":
                            var returnProtocol = await objContainer.handleLN(idsNo);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case "LP":
                            var returnProtocol = await objContainer.handleLP(idsNo);
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case "FL":
                            // If any protocol comes after LO then we have to send FL 
                            var returnProtocol = '+';
                            this.sendProtocol(returnProtocol, str_IpAddress);
                            break;
                        case 'WO':
                            var tempCubicInfoIPC = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));

                            if ((tempCubicInfoIPC.Sys_Area == "Compression" || tempCubicInfoIPC.Sys_Area == "Capsule Filling"
                                || tempCubicInfoIPC.Sys_Area == "Coating" || tempCubicInfoIPC.Sys_Area == 'Granulation'
                                || tempCubicInfoIPC.Sys_Area == 'Effervescent Compression' || tempCubicInfoIPC.Sys_Area == 'Effervescent Granulation'
                                || tempCubicInfoIPC.Sys_Area == 'Strepsils'
                                || tempCubicInfoIPC.Sys_Area == 'Allopathic'
                                || tempCubicInfoIPC.Sys_Area == 'Personal Care')
                                && (tempCubicInfoIPC.Sys_CubType == globalData.objNominclature.BinText)) {
                                var response = await objContainer.sendIPCProductList(tempCubicInfoIPC.Sys_CubType, tempCubicInfoIPC.Sys_Area);
                                strReturnProtocol = response;
                                this.sendProtocol(strReturnProtocol, str_IpAddress);

                            } else {
                                var strReturnProtocol = "ID3 Area Setting, Mismatched For, IPC Hex,";
                                console.log('IPC hex mismatched area');
                                this.sendProtocol(strReturnProtocol, str_IpAddress);
                            }
                            break;
                        case "LL":
                            var remarkObj = globalData.arrLLsampleRemark.find(k => k.idsNo == idsNo);

                            this.sendProtocol(remarkObj.remark, str_IpAddress);
                            if (globalData.arrLLsampleRemark != undefined) {//added by Pradip 15/12/2020
                                globalData.arrLLsampleRemark = globalData.arrLLsampleRemark
                                    .filter(k => k.idsNo != idsNo);
                            }
                            break;
                        default:

                            var strReturnProtocol = "+";
                            this.sendProtocol(strReturnProtocol, str_IpAddress);
                            break;
                    }
                }
            } // repeat pro



            // objProtocolHandler.processProtocol(strProtocolIdentification, str_IpAddress);
        } catch (err) {
            console.log('ERROR ON PROTOCOL HANDLER', err);
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            this.sendProtocol('+', str_IpAddress);
        }
    }
}
module.exports = PowerBackup;