const Net = require('net');
const globalData = require('../global/globalData');
const BulkData = require('../model/clsBulkWeighment')
const objBulkData  = new BulkData();
class TCPClient {

    async connect(host, port) {
        try {
            // The port number and hostname of the server.
            // const port = 4210;
            //const host = '192.168.1.203';

            // Create a new TCP client.
            const client = new Net.Socket();

            // Send a connection request to the server.
            client.connect(({ port: port, host: host }), function (err) {
                // If there is no error, the server has accepted the request and created a new 
                // socket dedicated to us.
                console.log(`TCP connection established with the server ${host} : ${port}. `);

                // The client can now send data to the server by writing to its socket.
                client.write(`Hello, server.${host}`);
            });
            client.on('error', ex => {
                console.log(ex);
            })
            var tcpObject = globalData.arrHardnessST50LAN.find(k => k.host == host);
            if (!tcpObject) {
                globalData.arrHardnessST50LAN.push({ host, port, conObj: client });
            }

            await this.TCPStartWeighment(host);

        } catch (error) {
            console.log(error);
        }
    }

    async TCPStartWeighment(host) {
        try {
            var tcpObject = globalData.arrHardnessST50LAN.find(k => k.host == host);
            // The client can also receive data from the server by reading from its socket.

            if (tcpObject) {
                tcpObject.conObj.on('data', async function (chunk) {
                   // console.log(`Data received from the server : ${host} : ${chunk.toString()}.`);
                    await objBulkData.insertST50TCP(chunk.toString().split('\n'),host);
                    // Request an end to the connection after the data has been received.
                    //tcpObject.conObj.end();
                });

               
            }
            tcpObject.conObj.on('error', function () {
                console.log('Connection encountered in error')
                globalData.arrHardnessST50LAN = globalData.arrHardnessST50LAN.filter(k => k.host != host);
            });
            tcpObject.conObj.on('end', function () {
                console.log('Connection ended')
                globalData.arrHardnessST50LAN = globalData.arrHardnessST50LAN.filter(k => k.host != host);
            });
        } catch (error) {
            console.log(error)
        }

    }
    async closeConnection(hostIP) {
        try {
            var tcpObject = globalData.arrHardnessST50LAN.find(k => k.host == hostIP);
            tcpObject.conObj.end();
        } catch(error) {
            console.log(error);
            return error;
        }
    }
}


module.exports = TCPClient;