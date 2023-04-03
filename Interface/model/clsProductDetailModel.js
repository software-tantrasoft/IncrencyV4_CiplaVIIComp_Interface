const Database = require("../database/clsQueryProcess");
const serverConfig = require("../global/severConfig");
const objDatabase = new Database();
/**
 * @description to get tbl_product_tablet data
 */
class ProductDetail {
  async productData(productObj, temptblName = "") {
    try {
      var productMasterData = {
        str_tableName: "tbl_product_master",
        data: "*",
        condition: [
          {
            str_colName: "ProductId",
            value: productObj.Sys_BFGCode,
            comp: "eq",
          },
          {
            str_colName: "ProductName",
            value: productObj.Sys_ProductName,
            comp: "eq",
          },
          {
            str_colName: "ProductVersion",
            value: productObj.Sys_PVersion,
            comp: "eq",
          },
          { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
        ],
      };

      var masterData = await objDatabase.select(productMasterData);
      var result = [];
      let str_tableName;
      var productType = masterData[0][0].ProductType;
      if (
        productObj.Sys_Area == "Effervescent Granulation" ||
        productObj.Sys_Area == "Granulation" ||
        productObj.Sys_Area == "MFG-1 Processing Area" ||
        productObj.Sys_Area == "MFG-1 Blending Area" ||
        productObj.Sys_Area == "MFG-3 IPQC" ||
        productObj.Sys_Area == "MFG-2 Processing Area" ||
        productObj.Sys_Area == "MFG-2 Blending Area" ||
        productObj.Sys_Area == "MFG-8 Processing Area" ||
        productObj.Sys_Area == "MFG-8 IPQC" ||
        productObj.Sys_Area == "MFG-5 Capsule" ||
        productObj.Sys_Area == "MFG-6 Capsule" ||
        productObj.Sys_Area == "Pellet IPQC"
      ) {
        if (productType == 1) {
          str_tableName = "tbl_product_gran";
        } else {
          str_tableName = "tbl_product_gran_cap";
        }
      } else if (productObj.Sys_Area == "Coating") {
        // if (productObj.Sys_CubType == "Coating") { // && productObj.Sys_IPQCType == 'Compression'
        //   str_tableName = "tbl_product_tablet";
        // }
        // else if (productObj.Sys_CubType == "Coating" && productObj.Sys_IPQCType == 'Coating') {
        //   str_tableName = "tbl_product_tablet_coated";
        // }
        // else
        if (
          productObj.Sys_CubType == "IPQC" &&
          productObj.Sys_IPQCType == "Coating"
        ) {
          str_tableName = "tbl_product_tablet_coated";
        } else if (
          productObj.Sys_CubType == "IPQC" &&
          productObj.Sys_IPQCType == "Compression"
        ) {
          str_tableName = "tbl_product_tablet";
        } else {
          str_tableName = "tbl_product_tablet_coated";
        }
      } else if (productObj.Sys_Area == "Pallet Coating") {
        if (temptblName == "") {
          str_tableName = "tbl_product_gran_cap";
        } else {
          str_tableName = temptblName;
        }
      } else if (
        productObj.Sys_Area == "Capsule Filling" ||
        productObj.Sys_Area == "Pellets-II" ||
        productObj.Sys_Area == "CheckWeigher"
      ) {
        if (temptblName == "") {
          str_tableName = "tbl_product_capsule";
        } else {
          str_tableName = temptblName;
        }
      } else if (productObj.Sys_Area == "Multihaler") {
        str_tableName = "tbl_product_multihaler";
      } else if (productObj.Sys_Area == "Softshell") {
        str_tableName = "tbl_product_softshell";
      } else if (productObj.Sys_Area == "Dosa Dry Syrup") {
        str_tableName = "tbl_product_dosadry";
      } else if (productObj.Sys_Area.includes("IPQA")) {
        if (productObj.Sys_IPQCType == "Capsule Filling") {
          str_tableName = "tbl_product_capsule";
        } else if (productObj.Sys_IPQCType == "Coating") {
          str_tableName = "tbl_product_tablet_coated";
        } else {
          str_tableName = "tbl_product_tablet";
        }
      } else {
        str_tableName = "tbl_product_tablet";
      }
      var productData = {
        str_tableName: str_tableName,
        data: "*",
        condition: [
          {
            str_colName: "ProductId",
            value: productObj.Sys_BFGCode,
            comp: "eq",
          },
          {
            str_colName: "ProductName",
            value: productObj.Sys_ProductName,
            comp: "eq",
          },
          {
            str_colName: "ProductVersion",
            value: productObj.Sys_PVersion,
            comp: "eq",
          },
          { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
        ],
      };

      if (serverConfig.ProjectName == "SunHalolGuj1") {
        productData.condition.push({
          str_colName: "BatchNo",
          value: productObj.Sys_Batch,
          comp: "eq",
        });
      }

      var resultData = await objDatabase.select(productData);
      result.push(masterData[0][0], resultData[0][0]);
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }
}
module.exports = ProductDetail;
