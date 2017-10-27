/* jshint node: true, camelcase: false */

var vendor_files;
module.exports = {
  build_dir: "build",
  compile_dir: "dist",
  app_files: {
    js: [
      "src/app/**/index.js",
      "src/**/**/*.js",
      "src/**/*.js",
      "!src/**/*.spec.js",
      "!src/**/*.scenario.js",
      "!src/assets/**/*.js",
      "!src/static/*.js"
    ],
    jsunit: ["src/**/*.spec.js"],
    jse2e: ["src/**/*.scenario.js"],
    atpl: ["src/app/**/*.tpl.html"],
    html: ["src/app.html"],
    sass: ["src/sass/app.scss"]
  },
  external_files: {
    openpgp: ["node_modules/openpgp/dist/openpgp.worker.min.js", "node_modules/openpgp/dist/openpgp.min.js"],
    manifest: ["manifest.json"]
  },
  test_files: {
    js: [
      "node_modules/chai-as-promised/lib/chai-as-promised.js",
      "node_modules/chai-fuzzy/index.js"
    ]
  },
  vendor_files: (vendor_files = {
    js: [
      "node_modules/jquery/dist/jquery.js",
      "node_modules/jquery.payment/lib/jquery.payment.js",
      "node_modules/fastclick/lib/fastclick.js",
      "node_modules/angular/angular.js",
      "node_modules/autofill-event/src/autofill-event.js",
      "node_modules/angular-cookies/angular-cookies.js",
      "node_modules/angular-ui-router/release/angular-ui-router.js",
      "node_modules/codemirror/lib/codemirror.js",
      "node_modules/codemirror/addon/display/autorefresh.js",
      "node_modules/codemirror/mode/sieve/sieve.js",
      "node_modules/codemirror/addon/lint/lint.js",
      "node_modules/angular-ui-codemirror/src/ui-codemirror.js",
      "node_modules/angular-sanitize/angular-sanitize.js",
      "node_modules/moment/min/moment-with-locales.js",
      "node_modules/moment-timezone/builds/moment-timezone-with-data.js",
      "node_modules/underscore/underscore.js",
      "node_modules/dompurify/dist/purify.js",
      "node_modules/papaparse/papaparse.js",
      "node_modules/ng-sortable/dist/ng-sortable.js",
      "node_modules/angular-notify/dist/angular-notify.js",
      "node_modules/pikaday/pikaday.js",
      "node_modules/ng-pikaday/ng-pikaday.js",
      "node_modules/jquery-timepicker/jquery.timepicker.js",
      "node_modules/squire-rte/build/squire-raw.js",
      "node_modules/dropzone/dist/dropzone.js",
      "node_modules/vcard/src/vcard.js",
      "node_modules/html2canvas/dist/html2canvas.js",
      "node_modules/svg4everybody/dist/svg4everybody.js",
      "node_modules/ical.js/build/ical.js",
      "node_modules/angular-ical/dist/js/angular-ical.js",
      "node_modules/angular-messages/angular-messages.js",
      "node_modules/svgeezy/svgeezy.js",
      "node_modules/mousetrap/mousetrap.js",
      "node_modules/push.js/push.js",
      "node_modules/angular-gettext/dist/angular-gettext.js",
      "node_modules/awesomplete/awesomplete.js",
      "node_modules/angular-ui-indeterminate/dist/indeterminate.js",
      "node_modules/fingerprintjs2/fingerprint2.js",
      "node_modules/bcryptjs/dist/bcrypt.js",
      "node_modules/nouislider/distribute/nouislider.js",
      "node_modules/ua-parser-js/src/ua-parser.js",
      "node_modules/jquery-mousewheel/jquery.mousewheel.js",
      "node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js",
      "node_modules/ng-scrollbars/dist/scrollbars.min.js",
      "node_modules/sieve.js/sieve.js",
      'node_modules/intl-tel-input/build/js/intlTelInput.js',
      'node_modules/intl-tel-input/build/js/utils.js',
      'node_modules/ng-intl-tel-input/dist/ng-intl-tel-input.js',
      'node_modules/pt.blobjs/Blob.js',
      'node_modules/file-saver/FileSaver.js',
      'node_modules/hi-base32/build/base32.min.js',
      'node_modules/pt.qrcodejs/qrcode.js',
      'node_modules/pt.mailparser/mailparser.js',
      'node_modules/cssuseragent/cssua.js',
      'node_modules/pt.asmcrypto.js/asmcrypto.js',
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/pmcrypto/build/pmcrypto.js',
      'node_modules/markdown-it/dist/markdown-it.min.js',
      'node_modules/jszip/dist/jszip.min.js'
    ],
    bootstrap_components: [
      "affix",
      "alert",
      "tooltip",
      "transition"
    ],

    required_js: [],

    included_js: [],

    css: [
      "node_modules/ng-sortable/dist/ng-sortable.css",
      "node_modules/angular-notify/dist/angular-notify.css",
      "node_modules/pikaday/css/pikaday.css",
      "node_modules/dropzone/dist/dropzone.css",
      "node_modules/awesomplete/awesomplete.css",
      "node_modules/nouislider/distribute/nouislider.css",
      "node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css",
      "node_modules/codemirror/lib/codemirror.css",
      "node_modules/codemirror/addon/lint/lint.css"
    ],

    fonts: [
      "node_modules/components-font-awesome/fonts/*"
    ],

    sass_include_dirs: [
      "node_modules/bourbon/dist",
      "node_modules/bootstrap-sass-official/assets/stylesheets"
    ]
  }),

  proton_build: {
    version: "3.0",
    notes: "http://protonmail.dev/blog/",
    date: "17 Apr. 2015"
  }
};

vendor_files.js = vendor_files.js.concat(vendor_files.bootstrap_components.map(function (cmp){
  // return "node_modules/bootstrap-sass-official/assets/javascripts/bootstrap/"+cmp+".js";
  return "node_modules/bootstrap-sass/assets/javascripts/bootstrap.js"
}));

vendor_files.included_js = vendor_files.js.filter(function (file) {
  return vendor_files.included_js.every(function (included) {
    return file.indexOf(included) === -1;
  });
});

vendor_files.required_js = vendor_files.js.filter(function (file) {
  return vendor_files.required_js.some(function (required) {
    return file.indexOf(required) !== -1;
  });
});
