const globalData = require('../../global/globalData');
/**
 * @description Monitor class is used to handle the traffic from `UDP to Websocket`, Here we have separate 
 * gateway for Websocket
 **/
class Monitor {
/**
 * 
 * @param {*} Mobj 
 * @description 1) Below asynchronous function works as a mediator for `protocol exachange betwwen` 
 * `IDS and WebApp`
 */
async monit(Mobj) {
    let tempObj;
   // console.log(Mobj.case)
    switch(Mobj.case) {
        // for startup protocol we need to reinitialize particular object for the particular IDS
      
        case 'ST':
        case 'LO':
             let tempMonitST;
            tempMonitST = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
            tempMonitST.status = 'Online';
            tempMonitST.userName = 'NA';
            tempMonitST.selection1 = 'NA';
            tempMonitST.selection2 = 'NA';
            tempMonitST.selection3 = 'NA';
            tempMonitST.selection4 = 'NA';
            tempMonitST.weight = [];
            tempMonitST.bulkData = '';
            globalData.arrWebSocket.forEach(e => {
                e.emit('data', {
                    message: globalData.arrMonitCubic
                });
            })
            break;
        case 'ID':
            let tempMonitID;
            tempMonitID = globalData.arrMonitCubic.find(k=>k.idsNo == Mobj.idsNo);
            tempMonitID.status = 'Online';
            tempMonitID.userName = Mobj.data.UserName;
            globalData.arrWebSocket.forEach(e => {
                e.emit('data', {
                    message: globalData.arrMonitCubic
                });
            })
            break;
        case 'CR':
                let tempMonitCR;
                tempMonitCR = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitCR.status = 'Online';
                tempMonitCR.selection1 = 'Calibration';
                tempMonitCR.selection2 = Mobj.data.calibType;
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
          break;
          case 'CB':
                let tempMonitCB;
                tempMonitCB = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitCB.status = 'Online';
                tempMonitCB.weight.push({wt:Mobj.data.Weight, flag:'in'})
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
          break;
        case 'CP':
        case 'WS':
                let tempMonitCP;
                tempMonitCP = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitCP.status = 'Online';
                tempMonitCP.weight = [];
                tempMonitCP.bulkData = '';
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'MP':
        case 'MR':
        case 'WC':
                let tempMonitMP;
                tempMonitMP = globalData.arrMonitCubic.find(k=>k.idsNo == Mobj.idsNo);
                tempMonitMP.status = 'Online';
                tempMonitMP.weight = [];
                tempMonitMP.selection1 = 'NA';
                tempMonitMP.selection2 = 'NA';
                tempMonitMP.selection3 = 'NA';
                tempMonitMP.selection4 = 'NA';
                tempMonitMP.bulkData = '';
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'MS':
                let tempMonitMS;
                tempMonitMS = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitMS.status = 'Online';
                tempMonitMS.selection1 = 'Test';
                tempMonitMS.selection2 = Mobj.data.menu;
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'WT':
                let tempMonitWT;
                tempMonitWT = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitWT.status = 'Online';
                tempMonitWT.weight.push({wt:Mobj.data.weight, flag:Mobj.data.flag})
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'BL':
                    let tempMonitBL;
                    tempMonitBL = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                    tempMonitBL.status = 'Online';
                    tempMonitBL.bulkData = `${Mobj.data.test} TEST ${Mobj.data.flag}`
                    globalData.arrWebSocket.forEach(e => {
                        e.emit('data', {
                            message: globalData.arrMonitCubic
                        });
                    })
                    if(Mobj.data.flag !='STARTED') {
                        setTimeout(() =>{
                            tempMonitBL.status = 'Online';
                            tempMonitBL.bulkData = '';
                            globalData.arrWebSocket.forEach(e => {
                                e.emit('data', {
                                    message: globalData.arrMonitCubic
                                });
                            })
                        },2000)
                    }
                break;
        case 'HDT':
                let tempMonitHDT;
                tempMonitHDT = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitHDT.status = 'Online';
                tempMonitHDT.bulkData = `${Mobj.data.sample} TEST SAMPLE RECIVED`;
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'LODFINWT':
                let tempMonitLODFINWT;
                tempMonitLODFINWT = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitLODFINWT.status = 'Online';
                tempMonitLODFINWT.bulkData = `${Mobj.data.test} TEST IN PROCESS, WAITING FOR FINAL WT.`;
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'FRIFINWT':
            let tempMonitFriFINWT;
            tempMonitFriFINWT = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
            tempMonitFriFINWT.status = 'Online';
            tempMonitFriFINWT.bulkData = `${Mobj.data.test} TEST IN PROCESS, WAITING FOR AFTER WT.`;
            globalData.arrWebSocket.forEach(e => {
                e.emit('data', {
                    message: globalData.arrMonitCubic
                });
            })
        break;
        case 'CL':
                let tempMonitCL;
                tempMonitCL = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
                tempMonitCL.status = 'Online';
                tempMonitCL.bulkData = '';
                tempMonitCL.weight = [];
                globalData.arrWebSocket.forEach(e => {
                    e.emit('data', {
                        message: globalData.arrMonitCubic
                    });
                })
            break;
        case 'LE':
            let tempMonitLE;
            tempMonitLE = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
            var msg = '';
            if(Mobj.data == 'LE0'){
                msg = 'Report Generated Within Limit';
            } else {
                msg = 'Report Generated Out Of Limit';
            }
            tempMonitLE.status = 'Online';
            tempMonitLE.bulkData = msg;
            tempMonitLE.weight = [];
            globalData.arrWebSocket.forEach(e => {
                e.emit('data', {
                    message: globalData.arrMonitCubic
                });
            })
            break;
        case 'DF':
            let tempMonitDF;
            tempMonitDF = globalData.arrMonitCubic.find(k=>k.idsNo ==Mobj.idsNo);
            let tempDiffObj = globalData.arrdifferential.find(k=>k.idsNo == Mobj.idsNo);
            tempMonitDF.status = 'Online';
            tempMonitDF.bulkData = '';
            if(Mobj.type == 'F'){
                tempMonitDF.weight.push({wtF:parseFloat(Mobj.data.weight),wtE:0,wtN:0,flagF:Mobj.data.flag,flagE:'in', flagN:'in',DiffCheck:false})
            } else if(Mobj.type == 'E'){
                let tempObj = tempMonitDF.weight.find(k => k.DiffCheck == false);
                if(tempObj != undefined){
                tempObj.wtE = parseFloat(Mobj.data.weight);
                tempObj.flagE = Mobj.data.flag;
                }
            } else {
                // For Net WT
                let tempObj = tempMonitDF.weight.find(k => k.DiffCheck == false);
                if(tempObj != undefined){
                tempObj.wtN = parseFloat(Mobj.data.weight);
                tempObj.flagN = Mobj.data.flag;
                tempObj.DiffCheck = true;
                }
            }
            globalData.arrWebSocket.forEach(e => {
                e.emit('data', {
                    message: globalData.arrMonitCubic
                });
            })
            break;
        
    }
}
}
module.exports = Monitor;