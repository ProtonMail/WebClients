const fs = require('fs');
const path = require('path');
// get the html file
const html = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'templates', 'warningicon.html'), 'utf8');

module.exports = html;
