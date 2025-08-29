const fs = require('fs');
const path = require('path');
// get the html file
const html = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'templates', 'google-pay.html'), 'utf8');

module.exports = html;
