const dbCon = require('../utils/dbCon');
const ErrorLog = require('../model/clsErrorLog');
const serverConfig = require('../global/severConfig')
const date = require('date-and-time')
const sql = require('mssql');
/**
 * @class Class for database manipulation functions
 * @description QueryProcess mainly for saving retriving updating and deleting data from datatabse
 * @author Pradip Shinde
 */
class QueryProcess {
    constructor() { 
        this.arr_updateData;
    }
    
    //*************************************************************************************************** */
    // Function for inserting data in database                                                           //
    //*************************************************************************************************** */
    async save(insertObj) {
       // console.log(insertObj)
        try {
            // fetching columNames and data associated with them from object as from of array
            const data = insertObj.data;
            var columNames = "";
            // array for values to be inserted
            var arr_Values = [];
            // variable for hoding  ? (for prepared statement)
            var str_dummyVar = "";
            for (let i = 0; i < data.length; i++) {
                // concating columnames one by one
                columNames = columNames + data[i].str_colName + ",";
                str_dummyVar = str_dummyVar + "?,"
                arr_Values.push(data[i].value)
            }
            // removing last , from string 
            columNames = columNames.slice(0, -1);
            str_dummyVar = str_dummyVar.slice(0, -1);
            if (serverConfig.dbType == 'mysql') {
                var result = await dbCon.execute(`INSERT INTO ${insertObj.str_tableName} (${columNames}) VALUES (${str_dummyVar})`, arr_Values);
                return result;
            } else {
                var newResult = []
                await dbCon.connect();
                var newArr_Values = [];
                const request = dbCon.request();
                
                for(let val of arr_Values) {
                    /****************
                     * Some data type is bit as buff but sql not supported so we conver them before passing to query
                     */
                    if(Buffer.isBuffer(val)) {
                        newArr_Values.push(val[0]);
                    } else {
                        newArr_Values.push(val);
                    }
                }
               // console.log(newArr_Values);
                var temp = JSON.stringify(newArr_Values).replace(/"/g, "'").replace(/[\[\]]+/g, '');
                /****************
                 * 1) arr_Values is array
                 * 2) JSON.stringify() is for converting array into string ["ASD",12,"X"] -> "["ASD",12,"X"]";
                 * 3) replace(/"/g, "'") is for converting double to single quotes as 
                 * sql is not takig double quotes        "['ASD',12,'X']";
                 * 4)  replace(/[\[\]]+/g, '') is for removing [] from string "'ASD',12,'X'"
                 * Beause VALUES takes value in this 'ASD',12,'X' fashion
                 */
                var query = `INSERT INTO ${insertObj.str_tableName} (${columNames}) VALUES (${temp})`;
                query = query + ` SELECT @@IDENTITY AS 'insertId'`
                //**Mssql is not supported lastinsertId on insertion so we are using @@IDENTITY */
                const result = await request.query(query);
                newResult.push({ fieldCount: 0, info: "", insertId: result.recordsets[0][0].insertId });
                newResult.push(undefined);
               // console.dir(result)
                return newResult;
            }

        } catch (err) {
            console.log(query,err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + JSON.stringify(insertObj);
            logError = logError + err;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err);
        }
    }
    //*************************************************************************************************** */
    // Function for selecting data from database                                                           //
    //*************************************************************************************************** */
    async select(selectPrecalibSelWtObj) {
        // console.log(selectPrecalibSelWtObj)
        try {
            // which parameter has to select like * or any field
            var data = selectPrecalibSelWtObj.data;
            // fetching tableName
            var str_tableName = selectPrecalibSelWtObj.str_tableName;
            var str_condition = "";
            var str_order = "";
            // If select statement has where condition
            if (selectPrecalibSelWtObj.hasOwnProperty('condition')) {
                str_condition = "WHERE "
                for (let i = 0; i < selectPrecalibSelWtObj.condition.length; i++) {
                    var operator = '=';
                    switch (selectPrecalibSelWtObj.condition[i].comp) {
                        case 'eq': operator = '='; break;
                        case 'ne': operator = '!='; break;
                        case 'lt': operator = '<'; break;
                        case 'lte': operator = '<='; break;
                        case 'gt': operator = '>'; break;
                        case 'gte': operator = '>='; break;
                    }
                    if(typeof(selectPrecalibSelWtObj.condition[i].value) == 'string') {
                        str_condition = str_condition + selectPrecalibSelWtObj.condition[i].str_colName + " " + operator + " '" + selectPrecalibSelWtObj.condition[i].value + "' AND "
                    } else {
                        str_condition = str_condition + selectPrecalibSelWtObj.condition[i].str_colName + " " + operator + " " + selectPrecalibSelWtObj.condition[i].value + " AND "
                    }
                }
                // removing last , OR  AND from string 
                str_condition = str_condition.slice(0, -5)
            }
            if (selectPrecalibSelWtObj.hasOwnProperty('order')) {
                str_order = `ORDER BY ${selectPrecalibSelWtObj.order[0].str_colName} ${selectPrecalibSelWtObj.order[0].value}`;
            }
            // console.log(`SELECT ${data} FROM ${str_tableName} ${str_condition} ${str_order}`);
            if(serverConfig.dbType == 'mysql') {
            var result = await dbCon.execute(`SELECT ${data} FROM ${str_tableName} ${str_condition} ${str_order}`);
            return result;
            } else {
                var newResult = []
                await dbCon.connect(); // ensures that the pool has been created
                const request = dbCon.request(); // or: new sql.Request(pool1)
                var query = `SELECT ${data} FROM ${str_tableName} ${str_condition} ${str_order}`;
                // if (data.includes(',')) {
                //     data = data.split(',')[0];
                //     query = query + " GROUP BY " + data;
                // }
                const result = await request.query(query);
               // console.dir(result)
               // Object.assign(newResult,result.recordset,[])
                newResult.push(result.recordset);
                newResult.push([]);
                return newResult;
            }

        } catch (err) {
            console.log(query,err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + JSON.stringify(selectPrecalibSelWtObj);
            logError = logError + err;
             //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err)
        }
    }
    //********************************************************************************************************* */
    // Function for updating tables in database
    //********************************************************************************************************* */
    async update(updateObj) {
        try {
            // fetching data which we want to update
            this.arr_updateData = updateObj.data;
            var str_columnNames = "";
            var strWhereColumnNames = "";
            var arr_values = [];
            // For loop for concatinating column names which supposed to update
            if(serverConfig.dbType == 'mysql') {
            for (let i = 0; i < this.arr_updateData.length; i++) {
                str_columnNames = str_columnNames + this.arr_updateData[i].str_colName + "=?,";
                arr_values.push(this.arr_updateData[i].value)
            }
            // For loop for concatinating column names which appears in where clause
            for (let j = 0; j < updateObj.condition.length; j++) {
                strWhereColumnNames = strWhereColumnNames + updateObj.condition[j].str_colName + "=? AND ";
                arr_values.push(updateObj.condition[j].value);
            }
            // removing last , OR  AND from string 
            str_columnNames = str_columnNames.slice(0, -1);
            strWhereColumnNames = strWhereColumnNames.slice(0, -5);
            // const query = `UPDATE ${updateObj.str_tableName} SET ${str_columnNames} WHERE ${strWhereColumnNames}, ${arr_values}`;
            // console.log(query, arr_values);
            var result = await dbCon.execute(`UPDATE ${updateObj.str_tableName} SET ${str_columnNames} WHERE ${strWhereColumnNames}`, arr_values);
            return result;
          } else {
                for (let i = 0; i < this.arr_updateData.length; i++) {
                    if(typeof(this.arr_updateData[i].value) == 'string') {
                    str_columnNames = str_columnNames + this.arr_updateData[i].str_colName + "='" + this.arr_updateData[i].value + "',";
                    } else {
                    str_columnNames = str_columnNames + this.arr_updateData[i].str_colName + "=" + this.arr_updateData[i].value + ",";
                    }
                }
                for (let j = 0; j < updateObj.condition.length; j++) {
                    if(typeof(updateObj.condition[j].value) == 'string') {
                    strWhereColumnNames = strWhereColumnNames + updateObj.condition[j].str_colName + "='" + updateObj.condition[j].value + "' AND ";
                    } else {
                    strWhereColumnNames = strWhereColumnNames + updateObj.condition[j].str_colName + "=" + updateObj.condition[j].value + " AND ";
                    }
                }
                str_columnNames = str_columnNames.slice(0, -1);
                strWhereColumnNames = strWhereColumnNames.slice(0, -5);
                var newResult = []
                await dbCon.connect(); // ensures that the pool has been created
                const request = dbCon.request(); // or: new sql.Request(pool1)
                var query = `UPDATE ${updateObj.str_tableName} SET ${str_columnNames} WHERE ${strWhereColumnNames}`;
                const result = await request.query(query);
                 return result;
          }
        } catch (err) {
            console.log(err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + JSON.stringify(updateObj);
            logError = logError + err;
             //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err);
        }
    }
    //******************************************************************************************************** */
    // Function for updating tables in database
    //******************************************************************************************************** */
    async delete(deleteObj) {
        try {
            var arr_values = [];
            var str_whereColumnName = "";
            if (serverConfig.dbType == 'mysql') {
                for (let i = 0; i < deleteObj.condition.length; i++) {
                    str_whereColumnName = str_whereColumnName + deleteObj.condition[i].str_colName + "=? AND ";
                    arr_values.push(deleteObj.condition[i].value);
                }
                str_whereColumnName = str_whereColumnName.slice(0, -5)
                // const query = `DELETE FROM ${deleteObj.str_tableName} WHERE ${str_whereColumnName}`;
                // console.log(query,arr_values);
                var result = await dbCon.execute(`DELETE FROM ${deleteObj.str_tableName} WHERE ${str_whereColumnName}`, arr_values);
                return result
            } else {
                for (let i = 0; i < deleteObj.condition.length; i++) {
                    if (typeof (deleteObj.condition[i].value) == 'string') {
                        str_whereColumnName = str_whereColumnName + deleteObj.condition[i].str_colName + "='" + deleteObj.condition[i].value + "' AND  ";
                        //"='" + updateObj.condition[j].value + "' AND "
                    } else {
                        str_whereColumnName = str_whereColumnName + deleteObj.condition[i].str_colName + "=" + deleteObj.condition[i].value + " AND  ";
                    }
                    //  arr_values.push(deleteObj.condition[i].value);
                }
                str_whereColumnName = str_whereColumnName.slice(0, -5);
                var newResult = []
                await dbCon.connect(); // ensures that the pool has been created
                const request = dbCon.request(); // or: new sql.Request(pool1)
                var query = `DELETE FROM ${deleteObj.str_tableName} WHERE ${str_whereColumnName}`;
                const result = await request.query(query);
                return result;
            }
            //  console.log(query);
        } catch (err) {
            console.log(err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + JSON.stringify(deleteObj);
            logError = logError + err;
             //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err)
        }
    }
    //********************************************************************************************************* */

    //*************************************************************************************************** */
    // Function to select from one table and insert into another table.                                                        //
    //*************************************************************************************************** */
    async copy(copy) {
        try {
            // fetching columNames and data associated with them from object as from of array
            const data = copy.data;
            var columNames = "";
            // array for values to be inserted
            var arr_Values = [];
            var strWhereColumnName = "";
            var str_dummyVar = "";
            for (let i = 0; i < data.length; i++) {
                // concating columnames one by one
                columNames = columNames + data[i].str_colName + ",";
            }
            if(serverConfig.dbType == 'mysql') {
            for (let i = 0; i < copy.condition.length; i++) {
                // concating columnames one by one
                strWhereColumnName = strWhereColumnName + copy.condition[i].str_colName + "=? AND ";

                arr_Values.push(copy.condition[i].value);
            }
            // removing last , from string 
            columNames = columNames.slice(0, -1);
            strWhereColumnName = strWhereColumnName.slice(0, -5);

            // console.log(strWhereColumnName, arr_Values);

            var str_Query = `insert into ${copy.toCopyTableName} (${columNames}) select ${columNames} from ${copy.fromCopyTblName} where ${strWhereColumnName}`
            var result = await dbCon.execute(str_Query, arr_Values);
            return result
          } else {
            for (let i = 0; i < copy.condition.length; i++) {
                // concating columnames one by one
                if(typeof(copy.condition[i].value) == 'string') {
                strWhereColumnName = strWhereColumnName + copy.condition[i].str_colName + "='"+copy.condition[i].value+"' AND ";
                } else {
                strWhereColumnName = strWhereColumnName + copy.condition[i].str_colName + "="+copy.condition[i].value+" AND ";  
                }

               // arr_Values.push(copy.condition[i].value);
            }
            // removing last , from string 
                columNames = columNames.slice(0, -1);
                strWhereColumnName = strWhereColumnName.slice(0, -5);
                var newResult = []
                await dbCon.connect(); // ensures that the pool has been created
                const request = dbCon.request(); // or: new sql.Request(pool1)
                var query = `insert into ${copy.toCopyTableName} (${columNames}) select ${columNames} from ${copy.fromCopyTblName} where ${strWhereColumnName}`
                query = query + ` SELECT @@IDENTITY AS 'insertId'`
                const result = await request.query(query);
                newResult.push({ fieldCount: 0, info: "", insertId: result.recordsets[0][0].insertId });
                newResult.push(undefined);
               // console.dir(result)
                return newResult;

          }

        } catch (err) {
            console.log(err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + JSON.stringify(copy);
            logError = logError + err;
             //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err)
        }
    }
//*************************************************************************************************** */
    // copy2 function copies data from two tables but all column names and column count must be same  //
    //*************************************************************************************************** */
    async copy2(fromTblName, toTblName, whereColName, repSrNo) {
        try {
            if (serverConfig.dbType == 'mysql') {
                // console.log(`INSERT INTO ${toTblName} SELECT * FROM ${fromTblName} WHERE ${whereColName} = ${repSrNo}`)
                return dbCon.execute(`INSERT INTO ${toTblName} SELECT * FROM ${fromTblName} WHERE ${whereColName} = ${repSrNo}`);
            } else {
                var newResult = []
                await dbCon.connect(); // ensures that the pool has been created
                const request = dbCon.request(); // or: new sql.Request(pool1)
                var query = `INSERT INTO ${toTblName} SELECT * FROM ${fromTblName} WHERE ${whereColName} = ${repSrNo}`
                const result = await request.query(query);
                return result;
            }
        } catch (err) {
            console.log(err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err;
             //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err)
        }
    }
    //******************************************************************************************************** */
    async copyPeriodic(fromTblName, toTblName, whereColName, repSrNo) {
        try {
            if (serverConfig.dbType == 'mysql') {
                // console.log(`INSERT INTO ${toTblName} SELECT * FROM ${fromTblName} WHERE ${whereColName} = ${repSrNo}`)
                return dbCon.execute(`INSERT INTO ${toTblName} SELECT * FROM ${fromTblName} WHERE ${whereColName} = ${repSrNo}`);
            } else {
                var newResult = []
                await dbCon.connect(); // ensures that the pool has been created
                const request = dbCon.request(); // or: new sql.Request(pool1)
                var query = `INSERT INTO ${toTblName} SELECT * FROM ${fromTblName} WHERE ${whereColName} = ${repSrNo}`
                const result = await request.query(query);
                return result;
            }
        } catch (err) {
            console.log(err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err;
             //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err)
        }
    }
    async execute(query){
       
        try {
            if (serverConfig.dbType == 'mysql') {
                return await dbCon.execute(query);
            } else {
                var newResult = [];
                await dbCon.connect(); 
                const request = dbCon.request(); 
                const result = await request.query(query);
                newResult.push(result.recordset);
                newResult.push([]);
                return newResult;
            }
        } catch(err) {
            console.log(query,err)
            throw new Error(err)
        }
    }
}




module.exports = QueryProcess;