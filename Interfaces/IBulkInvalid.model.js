class BulkInvalid { 
    constructor() {
        this.invalidObj = {
            idsNo : 0,
            DT : {
                invalid: false,
                invalidMsg: "",
            },
            TD : {
                invalid: false,
                invalidMsg: "",
            },
            HD425 : {
                invalid: false,
                invalidMsg: "",
            },
            HD125 : {
                invalid: true,
                invalidMsg: "",
            },
            Friabilitor : {
                invalid: false,
                invalidMsg: "",
            },
        }
    }
}

module.exports = BulkInvalid;