const fs = require('fs');
const path = require('path');
// get the html file
const html = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'templates', 'apple-pay.html'), 'utf8');

module.exports = html;
