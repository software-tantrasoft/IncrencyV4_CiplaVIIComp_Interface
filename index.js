var dgram = require('dgram');
var http = require('http');
var path = require('path');
const express = require('express');
const app = express();
var conf = require('./Interface/global/severConfig');
const server = dgram.createSocket('udp4');
const serverConfig = require('./Interface/global/severConfig')
const globalData = require('./Interface/global/globalData');
const checkSum = require('./Interface/middleware/checksum')
const objEncryptDecrypt = require('./Interface/middleware/encdecAlgo')
const appInterFace = require('./Interface/app')
const FetchDetails = require('./Interface/model/clsFetchDetails');
const fetchDetails = new FetchDetails();
var LoginModal = require('./Interface/model/clsLoginModal');
var loginModal = new LoginModal();
var clsArrayInit = require('./Interface/model/clsArrayInitialize');
var objArrayInit = new clsArrayInit();
var ShowAlert = require('./Interface/model/Alert/alert.model');
var logFromPC = require('./Interface/model/clsLogger');
const date = require('date-and-time');
let TCP = require('./tcpServer');
/**
 * INTERFACE SERVER INITIALZATION
 * @description Below is the implementation of UDP server
 */
server.on('message', (msg, rinfo) => {
    appInterFace.interface(msg, rinfo);
});

server.on('listening', () => {

    var IdsArray = [];
    for (let i = 0; i < globalData.arrIdsInfo.length; i++) {
        if (globalData.arrIdsInfo[i].Sys_IDSNo != 0) {
            IdsArray.push(conf.strIpSeries + globalData.arrIdsInfo[i].Sys_IDSNo);
            globalData.arrFriabilityMenuVisibility.push({ idsNo: globalData.arrIdsInfo[i].Sys_IDSNo, ETS: 0 })
            globalData.arrBFBO.push({ idsNo: globalData.arrIdsInfo[i].Sys_IDSNo, before: false, setParam: false, after: false })
        }
    }
    console.log(`INTERFACE SERVER STARTED ON:${port}....`);
    console.log(`DATABSE CHOSEN : ${serverConfig.dbType.toUpperCase()}`)
    setInterval(() => {
        //  var protocol = "?";
        objEncryptDecrypt.encrypt("?").then(protocol => {
            var arrQMarkProtocol = [];
            arrQMarkProtocol.push(...Buffer.from(protocol, 'utf8'));
            checkSum.getCheckSumBuffer(arrQMarkProtocol).then(result => {

                var arr_IDS = [];
                arr_IDS = IdsArray;
                for (let i = 0; i < arr_IDS.length; i++) {
                    if (arr_IDS[i].Sys_IDSNo != 0) {
                        server.send(result, serverConfig.port, arr_IDS[i], (error) => {
                            if (error) {
                                console.log(error);// ERROR WHILE SENDING
                            }
                            else {
                                var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , (SENT) From PC : To  " + arr_IDS[i] + " : ?";
                                //commented by vivek on 31-07-2020********************************
                                //logFromPC.info(logQ);
                                logFromPC.addtoProtocolLog(logQ)
                                //************************************************************** */
                                let ipSplit = arr_IDS[i].split(3);
                                if (globalData.arrCommunication.find(k => k.IdsNo == arr_IDS[i].split('.')[3])) {
                                    // console.log(i)
                                    if (globalData.arrCommunication[i].QCount < 25) {
                                        globalData.arrCommunication[i].QCount = globalData.arrCommunication[i].QCount + 1;
                                        /* release User from table when timeout reached after direct power off
                                        and not log in 
                                        */
                                        //  console.log(globalData.arrCommunication[i])
                                        if (globalData.arrCommunication[i].QCount == 17) {
                                            loginModal.releaseUserFromIds(globalData.arrCommunication[i]);
                                        }
                                    }
                                }

                            }
                        })
                    }
                }

            })
        });

    }, 3000)
    setTimeout(() => {
        //  var protocol = "*";
        objEncryptDecrypt.encrypt("*").then(protocol => {
            var arrStarProtocol = [];
            arrStarProtocol.push(...Buffer.from(protocol, 'utf8'));

            checkSum.getCheckSumBuffer(arrStarProtocol).then(result => {
                var arr_IDS = [];
                arr_IDS = IdsArray;
                for (let i = 0; i < arr_IDS.length; i++) {
                    //  console.log(arr_IDS[i]);
                    //var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , (SENDING) From PC : To  " + arr_IDS[i] + " : *";
                    //logFromPC.info(logQ);

                    server.send(result, serverConfig.port, arr_IDS[i], (error) => {
                        if (error) {
                            console.log('error while sending * ', error);
                        }
                        else {
                            var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , (SENT) From PC : To  " + arr_IDS[i] + " : *";
                            //commented by vivek on 31-07-2020********************************
                            //logFromPC.info(logQ);
                            logFromPC.addtoProtocolLog(logQ)
                            //************************************************************** */
                            objEncryptDecrypt.decrypt(result.toString()).then(result => {
                            })
                        }
                    })
                }
            })
        });

    }, 1000)

    fetchDetails.prepareAlertObject().then(() => {
        // here 
        globalData.alertArrTemp = globalData.alertArr;

    }); // This function filled the global array i-e alert object

    let objShowAlert = new ShowAlert()
    setInterval(() => {
        objShowAlert.updateAlertObject();
        objShowAlert.showAlert();
    }, 3000)
    // Friability Timer
    setInterval(() => {
        for (let obj of globalData.arrFriabilityMenuVisibility) {
            if (obj.ETS > 0) {
                obj.ETS = obj.ETS - 1;
            } else if (obj.ETS > 0 && obj.ETS < 1) {
                obj.ETS = 0;
            }
        }
    }, 1000)
    //******************************************************************************************************** */

});
server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});
objArrayInit.InitializeArrays().then((res) => {
    server.bind({
        address: serverConfig.host,
        port: serverConfig.port,
        exclusive: false
    }, () => {
        /**
         * We need to fill array for the Monitoring that will newer gets updated or changed its through 
         * out instance so that user gets realTime monitoring
         * 
         */
        let arrCubicalObj1 = [];
        for (const value of globalData.arrIdsInfo) {
            let tempObj = {
                cno: value.Sys_CubicNo,
                cubicName: value.Sys_CubicName,
                idsNo: value.Sys_IDSNo,
                status: 'Offline',
                cubicArea: value.Sys_Area,
                userName: 'NA',
                selection1: 'NA',
                selection2: 'NA',
                selection3: 'NA',
                selection4: 'NA',
                weight: [ // {wt:'', flag:out/in}

                ],
                bulkData: ''
            }
            arrCubicalObj1.push(tempObj);

        }
        globalData.arrMonitCubic = arrCubicalObj1;
    });
}).catch(err => console.log(err));

// creating instance of Web server which handles Angular request
const WebSocketServer = http.createServer(app);
var io = require('socket.io')(WebSocketServer);
/**
 * WEBSOCKET SERVER IMPLEMETATION
 * @description below is the initialization of web server
 */
WebSocketServer.listen(serverConfig.MonitPort, serverConfig.host, function () {
    console.log(`WEB SERVER STARTED ON :${serverConfig.MonitPort}...`);
    setInterval(() => {
        // below code pushes the communication status to Angular
        // console.log(globalData.arrWebSocket)
        globalData.arrCommunication.forEach(e => {
            if (e.QCount != 25) { // Why 25 if all client offline then we wait for 25 seconds on indivisual after then function will sleep
                // till next client comes online
                globalData.arrWebSocket.forEach(sock => {

                    if (e.QCount <= 3) {
                        var online;
                        online = globalData.arrMonitCubic.find(k => k.idsNo == e.IdsNo);
                        if (online != undefined) {
                            online.status = 'Online';
                        }
                    } else if (e.QCount > 3 && e.QCount < 13) {
                        var config;
                        config = globalData.arrMonitCubic.find(k => k.idsNo == e.IdsNo);
                        if (config != undefined) {
                            config.status = 'Configuring';
                        }
                    } else {
                        var offline;
                        offline = globalData.arrMonitCubic.find(k => k.idsNo == e.IdsNo);
                        if (offline != undefined) {
                            offline.status = 'Offline';
                        }
                    }
                    sock.emit('communication', {
                        message: globalData.arrMonitCubic
                    });
                })
            }

        })
        // console.log(globalData.arrMonitCubic)
    }, 3000)
}).on("error", function (err) {
    console.log(err)
    console.log('WEB SERVER FAILED..');
})
//************************************************************************************ */
io.on('connection', function (sock) {
    // Every single socket push in global arrWebSocket Array
    if (!globalData.arrWebSocket.includes(sock)) {
        globalData.arrWebSocket.push(sock);
    }
    setTimeout(() => {
        sock.emit('data', {
            message: globalData.arrMonitCubic
        });
    }, 2000)
    // When protocol comes from client side using significance of `comm`
    sock.on('comm', function (msg) {
        console.log('msg', msg);
        sock.emit('comm', {
            message: msg
        })
    })
    sock.on('data', function (msg) {
        // console.log('data', msg);
        sock.emit('data', {
            message: globalData.arrMonitCubic
        })
    })
    /************************************************************************ */
    // invokes when WEB CLIENT SOCKET disconnects
    sock.on("disconnect", function () {
        //console.log('diconnected');
        globalData.arrWebSocket.splice(globalData.arrWebSocket.indexOf(sock), 1);

    });
    //************************************************************************* */
    // invokes when error occured while in network
    sock.on("error", function (error) {

        globalData.arrWebSocket.splice(globalData.arrWebSocket.indexOf(sock), 1);
        // WebSocketHandler.handleSocket(sock);
        console.log('something wrong happpened here', error);
    });
    //******************************************************************************/
});

module.exports.server = server;



