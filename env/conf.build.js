const bindPrefix = (name) => `node_modules/${name}`;

module.exports = {
    externalFiles: {
        openpgp: ['openpgp/dist/openpgp.worker.min.js', 'openpgp/dist/openpgp.min.js'].map(bindPrefix),
        list: ['.htaccess', 'manifest.json', 'robots.txt']
    },
    vendor_files: {
        js: [
            'jquery/dist/jquery.js',
            'jquery.payment/lib/jquery.payment.js',
            'fastclick/lib/fastclick.js',
            'angular/angular.js',
            'autofill-event/src/autofill-event.js',
            'angular-cookies/angular-cookies.js',
            'angular-ui-router/release/angular-ui-router.js',
            'angular-sanitize/angular-sanitize.js',
            'angular-notify/dist/angular-notify.js',
            'oclazyload/dist/ocLazyLoad.js',
            'svg4everybody/dist/svg4everybody.js',
            'angular-messages/angular-messages.js',
            'mousetrap/mousetrap.js',
            'mousetrap/plugins/pause/mousetrap-pause.js',
            'mousetrap/plugins/global-bind/mousetrap-global-bind.js',
            'angular-gettext/dist/angular-gettext.js',
            'fingerprintjs2/dist/fingerprint2.min.js',
            'bcryptjs/dist/bcrypt.js',
            'nouislider/distribute/nouislider.js',
            'ua-parser-js/src/ua-parser.js',
            'intl-tel-input/build/js/intlTelInput.js',
            'intl-tel-input/build/js/utils.js',
            'popper.js/dist/umd/popper.js',
            'tooltip.js/dist/umd/tooltip.js',
            'ng-intl-tel-input/dist/ng-intl-tel-input.js',
            'hi-base32/build/base32.min.js',
            'cssuseragent/cssua.js',
            'asmcrypto.js/asmcrypto.js',
            'babel-polyfill/dist/polyfill.js',
            'pmcrypto/dist/pmcrypto-browser.js',
            'dompurify/dist/purify.js',
            'moment/min/moment.min.js', // must be before moment-timezone
            'moment-timezone/builds/moment-timezone.min.js',
            'raven-js/dist/raven.min.js'
        ].map(bindPrefix),
        jsLazy: [
            'papaparse/papaparse.js',
            'ng-sortable/dist/ng-sortable.js',
            'pikaday/pikaday.js',
            'ng-pikaday/ng-pikaday.js',
            'jquery-timepicker/jquery.timepicker.js',
            'squire-rte/build/squire-raw.js',
            'dropzone/dist/dropzone.js',
            'angular-ical/dist/js/angular-ical.js',
            'push.js/bin/push.js',
            'awesomplete/awesomplete.js',
            'angular-ui-indeterminate/dist/indeterminate.js',
            'jquery-mousewheel/jquery.mousewheel.js',
            'malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js',
            'ng-scrollbars/dist/scrollbars.min.js',
            'sieve.js/sieve.js',
            'blob.js/Blob.js',
            'file-saver/FileSaver.js',
            'qrcodejs2/qrcode.min.js',
            'markdown-it/dist/markdown-it.min.js',
            'clipboard/dist/clipboard.js',
            'angular-vs-repeat/dist/angular-vs-repeat.js',
            'vcf/dist/vcard.js',
            'jszip/dist/jszip.min.js',
            'mimemessage/dist/mimemessage.js',
            'ical.js/build/ical.min.js'
        ].map(bindPrefix),
        jsLazy2: [
            'codemirror/lib/codemirror.js',
            'codemirror/addon/display/autorefresh.js',
            'codemirror/mode/sieve/sieve.js',
            'codemirror/addon/lint/lint.js',
            'angular-ui-codemirror/dist/ui-codemirror.min.js'
        ].map(bindPrefix),

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

        fonts: ['components-font-awesome/fonts/*'].map(bindPrefix),

        sass_include_dirs: ['bourbon/dist', 'bootstrap-sass-official/assets/stylesheets'].map(bindPrefix)
    }
};
