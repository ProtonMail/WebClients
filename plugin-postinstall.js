module.exports = {
    name: 'plugin-postinstall',
    factory: function (require) {
        var shell = require('@yarnpkg/shell');
        return {
            hooks: {
                afterAllInstalled: function () {
                    shell.execute('yarn workspaces foreach --all run postinstall');
                },
            },
        };
    },
};
