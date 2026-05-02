const fs = require('fs');

const productController = fs.readFileSync('src/controllers/productController.ts', 'utf8');
const fixed = productController.replace('../models/product', '../models/Product');
fs.writeFileSync('src/controllers/productController.ts', fixed, {encoding: 'utf8'});
console.log('Fixed!');