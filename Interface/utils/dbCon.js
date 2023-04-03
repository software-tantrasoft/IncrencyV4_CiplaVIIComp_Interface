// This dbCOn is only for FingerPrint all the dbConnection for the interface coming from APIV1 Part

const { Console } = require('winston/lib/winston/transports');
const conf = require('../global/severConfig');
if (conf.dbType == 'mysql') {
    const mysql = require('mysql2')
    var Pool;
    const conPool = mysql.createPool(
        {
            host: conf.dbHost,
            database: conf.dbName,
            user: conf.dbUser,
            password: conf.dbPass
        })
    Pool = conPool.promise();
    setInterval(function () {
        conPool.query('SELECT 1');
    }, 5000);
} else {
    const sql = require('mssql')
    var config = {
        user: 'sa',
        password: '123',
        server: 'TS1033\\SQLEXPRESS',
        database: 'increncyV4_indore',
        options: {
            encrypt: true,
            enableArithAbort: true
        },
    };

    Pool = new sql.ConnectionPool(config);
    setInterval(function () {
        conPool.query('SELECT 1');
    }, 5000);

}
module.exports = Pool;