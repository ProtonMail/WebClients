const templates = require.context('../src/templates', true, /\.html$/);
templates.keys().forEach(templates);
