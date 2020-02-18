const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function render(name = 'help') {
    const CLI_DIR = path.resolve(__dirname, '..', '..');
    const file = fs.readFileSync(path.join(CLI_DIR, name), 'utf8');
    const content = file.replace(/\[(\w+)\](<\w+>|\w+|--\w+\|-\w|\w+-\w+)\[\/\w+\]/g, (match, g1, g2) => {
        return chalk[g1](g2);
    });
    console.log(content);
}

module.exports = render;
