const bindPrefix = (name) => `node_modules/${name}`;

module.exports = {
    externalFiles: {
        openpgp: ['openpgp/dist/openpgp.min.js', 'openpgp/dist/compat/openpgp.min.js'].map(bindPrefix),
        openpgp_workers: ['openpgp/dist/openpgp.worker.min.js'].map(bindPrefix),
        list: ['.htaccess', 'manifest.json', 'robots.txt']
    },
    babel: {
        excludedFiles: ['mailparser.js', 'checkCompatApp.js'],
        includedNodeModules: ['asmcrypto.js', 'pmcrypto', 'sieve.js', 'angular-ui-codemirror']
    },
    vendor_files: {
        css: [
            'ng-sortable/dist/ng-sortable.css',
            'angular-notify/dist/angular-notify.css',
            'pikaday/css/pikaday.css',
            'dropzone/dist/dropzone.css',
            'awesomplete/awesomplete.css',
            'nouislider/distribute/nouislider.css',
            'malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css',
            'codemirror/lib/codemirror.css',
            'codemirror/addon/lint/lint.css',
            'normalize.css/normalize.css'
        ].map(bindPrefix),

        fonts: ['components-font-awesome/fonts', 'text-security/dist/text-security-disc.*'].map(bindPrefix),

        sass_include_dirs: ['bourbon/dist', 'bootstrap-sass-official/assets/stylesheets'].map(bindPrefix)
    }
};
