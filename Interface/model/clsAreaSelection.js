const globalData = require('../global/globalData');
const Database = require('../database/clsQueryProcess');
const database = new Database();

class Area {
    async areaSelection() {
        try {
            let AreaData = {
                str_tableName: 'tbl_cubicle_area',
                data: '*',
                condition: [
                    { str_colName: 'Flag', value: 1 },
                ]
            }
            var result = await database.select(AreaData);
            var arrCubicleArray = result[0];
            if (arrCubicleArray.length > 0) {
                var strProtocol = 'LDA01';
                arrCubicleArray.forEach(element => {
                    strProtocol += element.Area.substring(0,19) + ',';
                });
                strProtocol += ';';
            } else {
                var strProtocol = 'LEA';
            }
            return strProtocol;
            //
        } catch (err) {

        }

    }
}

module.exports = Area;