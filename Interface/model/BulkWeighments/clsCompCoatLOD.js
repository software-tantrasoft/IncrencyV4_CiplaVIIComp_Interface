const globalData = require('../../global/globalData');
const Database = require('../../database/clsQueryProcess');
const database = new Database();
class CompCoatLOD {
   async checkForCubicleTypeAndProductTableName(Product,strIdsIP,CubicArea,productType) {
      
      if(productType == 1 && CubicArea == 'Compression') {
         return 'tbl_product_tablet';
      } else if(productType == 1 && CubicArea == 'Coating') {
         return 'tbl_product_tablet_coated';
      } else if(productType == 1 && (CubicArea == 'Granulation' || CubicArea == 'Effervescent Granulation')) {
         var selectObj = {
            str_tableName: 'tbl_product_gran',
            data: '*',
            condition: [
                { str_colName: 'ProductName', value: Product.ProductName },
                { str_colName: 'ProductId', value: Product.ProductId },
                { str_colName: 'ProductVersion', value: Product.ProductVersion },
                { str_colName: 'Version', value: Product.Version }
            ]
        }
        let produRes = await database.select(selectObj);
        if(produRes[0].length != 0) {
           return 'tbl_product_gran';
        } else {
           // Here we want to check if product is purely Compressed or coating 
           let objIdsInfo = globalData.arrIdsInfo.find(k=>k.Sys_ProductName == Product.ProductName
            && k.Sys_BFGCode == Product.ProductId &&  k.Sys_PVersion == Product.ProductVersion 
            && k.Sys_Version == Product.Version && k.Sys_Batch == Product.Sys_Batch && (k.Sys_Area != 'Granulation'||
            k.Sys_Area == 'Effervescent Granulation'));
            if(objIdsInfo != undefined) {
               if(objIdsInfo.Sys_Area == 'Coating') {
                  return 'tbl_product_tablet_coated'
               } else if(objIdsInfo.Sys_Area == 'Compression') {
                  return 'tbl_product_tablet'
               }
            } else {
               console.log('CompCoat product not set to granulation');
               return '';
            }
        }
      }
   }
    /**
     * 
     * @param {*} strIdsIP 
     * @description Function helps us to find out if MENU has LOD or not for compression and coating which
     *  is going to be perform in granulation
     */
    async checkLODInGranu(strIdsIP) {
      const index = globalData.arr_limits.findIndex(k => k.idsNo == strIdsIP);
      var objGranuInfo = globalData.arrIdsInfo.find(k=> k.Sys_IDSNo == strIdsIP);
      let arrCompCoatInfo = globalData.arrIdsInfo.filter(k=>k.Sys_ProductName == objGranuInfo.Sys_ProductName
         && k.Sys_BFGCode == objGranuInfo.Sys_BFGCode &&  k.Sys_PVersion == objGranuInfo.Sys_PVersion 
         && k.Sys_Version == objGranuInfo.Sys_Version && k.Sys_Batch == objGranuInfo.Sys_Batch && (k.Sys_Area != 'Granulation'
         || k.Sys_Area == 'Effervescent Granulation'));
       
       if(arrCompCoatInfo.length != 0) { 
         for(let obj of arrCompCoatInfo) {
            var productResult;
            if(obj.Sys_Area == 'Compression') {

               productResult = await this.FindProductResult(obj);

               if(productResult[0].length != 0) {
                  if (parseFloat(productResult[0][0]['Param16_T1Neg']) > 0 && parseFloat(productResult[0][0]['Param16_T1Neg']) != 99999) {
                  Object.assign(globalData.arr_limits[index], {
                     LODCOMPRESSION: {
                         nominal: 0,
                         T1Neg: productResult[0][0].Param16_T1Neg,
                         T1Pos: productResult[0][0].Param16_T1Pos,
                         LimitOn: 1,
                         dp: productResult[0][0].Param16_DP,
                         isonstd: 1,
                         port: 3,
                         noOfSamples: 0,
                         side: 'NA',
                         Type:'Compression',
                         unit:''
                     }
                 });
               }
               }
            } else if(obj.Sys_Area == 'Coating'){

               productResult = await this.FindProductResult(obj);

               if (productResult[0].length != 0) {
                  if (parseFloat(productResult[0][0]['Param16_T1Neg']) > 0 && parseFloat(productResult[0][0]['Param16_T1Neg']) != 99999) {
                     Object.assign(globalData.arr_limits[index], {
                        LODCOATING: {
                           nominal: 0,
                           T1Neg: productResult[0][0].Param16_T1Neg,
                           T1Pos: productResult[0][0].Param16_T1Pos,
                           LimitOn: 1,
                           dp: productResult[0][0].Param16_DP,
                           isonstd: 1,
                           port: 3,
                           noOfSamples: 0,
                           side: 'NA',
                           Type: 'Coating',
                           unit:''
                        }
                     });
                  }
               }
            }
            
         }
       }

   }
   async FindProductResult(obj) {
      var tableName = '';
      if(obj.Sys_Area == 'Compression') {
         tableName = 'tbl_product_tablet';
      } else if(obj.Sys_Area == 'Coating'){
         tableName = 'tbl_product_tablet_coated';
      }
      var selectObj = {
         str_tableName: tableName,
         data: '*',
         condition: [
             { str_colName: 'ProductName', value: obj.Sys_ProductName },
             { str_colName: 'ProductId', value: obj.Sys_BFGCode },
             { str_colName: 'ProductVersion', value: obj.Sys_PVersion },
             { str_colName: 'Version', value: obj.Sys_Version }
         ]
     }
     var result = await database.select(selectObj);
     return result;
   }
}
module.exports = CompCoatLOD;