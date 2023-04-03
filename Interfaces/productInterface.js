const implementjs = require('implement-js')
const implement = implementjs.default
const { Interface, type } = implementjs

const IProduct = Interface('Product')({
    ProductId: type('string'),
    ProductName: type('string'),
    ProductVersion: type('string'),
    Version: type('string')
})

module.exports = IProduct;