var config = require("../global/severConfig")
var dbCon = require('../utils/dbCon')
var mysql = require('mysql2');
var sql = require('mssql')

var connection = mysql.createConnection({
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPass,
    database: config.dbName,
    multipleStatements: true
});

class StoredProcedure {

   fetchDetailForStats(resultdata, TestType, RepSerNoFromTable = 0) {
       return new Promise((resolve, reject) => {
        var masterTable, detailTable, RepSerNo;
        var int_paramNo;
        if (RepSerNoFromTable == 0) {
            RepSerNo = resultdata.incompleteData.RepSerNo
        } else {
            RepSerNo = RepSerNoFromTable
        }

        masterTable = resultdata.incompleteTableName;
        detailTable = resultdata.incompletedetailTableName;
        // if(true) {
        //     var config = {
        //         user: 'sa',
        //         password: '123',
        //         server: 'TS1033\\SQLEXPRESS',
        //         database: 'increncyV4_indore',
        //         options: {
        //             encrypt: true,
        //             enableArithAbort: true
        //         },
        //     };
       
        //     // request.input('detailTableName',sql.VarChar(100),detailTable);
        //     // request.input('RepSerNo',sql.Int,parseInt(RepSerNo));
        //     // request.input('weighmentModeNumber',sql.Int,parseInt(TestType));
        //     let pool = await sql.connect(config)
        //     let result2 = await pool.request()
        //         .input('detailTableName',sql.VarChar(100),detailTable)
        //         .input('RepSerNo',sql.Int,parseInt(RepSerNo))
        //         .input('weighmentModeNumber',sql.Int,parseInt(TestType))
        //         .output('minDataValue',sql.VarChar(15))
        //         .output('maxDataValue',sql.VarChar(15))
        //         .output('avgDataValue',sql.VarChar(15))
        //         .execute('batchSummaryReportCalculationsForInterface');
        //         console.log(result2)

        // }

        let strquery = "CALL batchSummaryReportCalculationsForInterface('" + detailTable + "'," + RepSerNo + "," + TestType + "," +
            "@minWeight,@maxWeight,@average);" +
            "SELECT @minWeight,@maxWeight,@average;";
        connection.query(strquery, function (err, rows, fields) {
            if (err) {
                console.log(err);
            }
            //console.log(rows);
            resolve(rows);
        });
       })
        
    }


    getRemarkForTD(resultdata) {
        return new Promise((resolve, reject) => {
            var repSerNo = resultdata;
            var tableName = "tbl_tab_tapdensity";
            let strquery = "CALL reportCalculationTapDensity(" + repSerNo + ",'" + tableName + "'," +
                "@stdNeg,@stdPos,@bulkNegLimit,@bulkPosLimit,@tapDensity,@bulkDensity,@remark);" +
                "SELECT @remark;";
            connection.query(strquery, function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //console.log(rows);
                resolve(rows);
            });

        })

    }

    getRemarkForFriability(resultdata) {
        return new Promise((resolve, reject) => {
            var repSerNo = resultdata;
            let strquery = "CALL reportCalculationFriabilityForInterface(" + repSerNo + "," +
                "@remark);" +
                "SELECT @remark;";
            connection.query(strquery, function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //console.log(rows);
                resolve(rows);
            });

        })
    }
    CallSPRepeatabilityPercentage(repSrNo, balId, repetabilityDetailTable) {
        return new Promise((resolve,reject) => {
            let strquery = "CALL RepeatabilityPercentage(" + repSrNo + ",'" + balId + "','" + repetabilityDetailTable + "'," +
                "@balLeastCount,@balDSNW,@repeatabilityPer,@result);"+
                "SELECT @balLeastCount,@balDSNW,@repeatabilityPer,@result;";
            connection.query(strquery, function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //console.log(rows);
                resolve(rows);
            });
        })
    }
    /**
     * 
     * @param {*} RepSerNo 
     */
    async PercentageCalculationForFriability(RepSerNo) {
        return new Promise((resolve, reject) => {
            var repSerNo = RepSerNo;
            let strquery = "CALL reportCalculationFriabilityForInterfaceMVL(" + repSerNo + "," +
                "@FriabilityPercentageNA,@FriabilityPercentageLeft,@FriabilityPercentageRight,@RemarkNA,@RemarkLeft,@RemarkRight);" +
                "SELECT @FriabilityPercentageNA,@FriabilityPercentageLeft,@FriabilityPercentageRight,@RemarkNA,@RemarkLeft,@RemarkRight;";
            connection.query(strquery, function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //console.log(rows);
                resolve(rows);
            });

        })
    }

    /**
     * 
     * @param {*} repSrNo
     * @param {*} mstTblName
     * @param {*} detTblname 
     */
    CalculateRptRemarkForSoftShell(repSrNo, mstTblName, detTblname) {
        return new Promise((resolve,reject) => {
            let strquery = "CALL reportCalculationForSoftshellNet(" + repSrNo + ",'" + mstTblName + "','" + detTblname + "'," +
            "@nominal, @lowerLimitActual,@upperLimitActual,@lowerLimitPercentage, @upperLimitPercentage, " +
            "@minWeight, @maxWeight, @minPercentage , @maxPercentage , @belowLimitCount, " +
            "@aboveLimitCount, @average, @standardDeviation , @result, @avgGrossWt, " +
            "@maxGrossWt, @minGrossWt, @avgShellWt, @maxShellWt, @minShellWt , " +
            "@avgNetWt, @maxNetWt, @minNetWt,@lowT2, @uppT2, @lowT1,@uppT1);" +
            "SELECT @result;"
            connection.query(strquery, function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //console.log(rows);
                resolve(rows);
            });
        })
    }


    async CalrepeatPercantage(repSrNo,repetabilityDetailTable,balId){
        return new Promise((resolve,reject) => {
            let strquery = "CALL RepeatabilityPercentage(" + repSrNo + ",'" + balId + "','" + repetabilityDetailTable + "'," +
                "@balLeastCount,@balDSNW,@repeatabilityPer,@repFormula,@result);"+
                "SELECT @balLeastCount,@balDSNW,@repeatabilityPer,@repFormula,@result;";
            connection.query(strquery, function (err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                //console.log(rows);
                resolve(rows);
            });
        })
    }

}
module.exports = StoredProcedure;