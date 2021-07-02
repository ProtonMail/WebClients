const path = require('path');

module.exports = {
    TEMPLATE_FILE: process.env.I18N_TEMPLATE_FILE || path.join('po', 'template.pot'),
};
