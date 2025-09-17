const fs = require('fs');
const path = require('path');

function render(name = 'help') {
    const CLI_DIR = path.resolve(__dirname, '..', '..');
    const file = fs.readFileSync(path.join(CLI_DIR, name), 'utf8');
    console.log(file);
}

module.exports = render;
