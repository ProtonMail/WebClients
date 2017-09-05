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
    openpgp: ["vendor/openpgp/dist/openpgp.worker.min.js", "vendor/openpgp/dist/openpgp.min.js"],
    manifest: ["manifest.json"]
  },
  test_files: {
    js: [
      "vendor/bower-angular-mocks/angular-mocks.js",
      "node_modules/chai-as-promised/lib/chai-as-promised.js",
      "node_modules/chai-fuzzy/index.js"
    ]
  },
  vendor_files: (vendor_files = {
    js: [
      "vendor/jquery/dist/jquery.js",
      "vendor/jquery.payment/lib/jquery.payment.js",
      "vendor/fastclick/lib/fastclick.js",
      "vendor/angular/angular.js",
      "vendor/autofill-event/src/autofill-event.js",
      "vendor/angular-cookies/angular-cookies.js",
      "vendor/angular-ui-router/release/angular-ui-router.js",
      "vendor/codemirror/lib/codemirror.js",
      "vendor/codemirror/addon/display/autorefresh.js",
      "vendor/codemirror/mode/sieve/sieveSyntax.js",
      "vendor/codemirror/addon/lint/lint.js",
      "vendor/angular-ui-codemirror/ui-codemirror.js",
      "vendor/angular-sanitize/angular-sanitize.js",
      "vendor/moment/min/moment-with-locales.js",
      "vendor/moment-timezone/builds/moment-timezone-with-data.js",
      "vendor/underscore/underscore.js",
      "vendor/dompurify/dist/purify.js",
      "vendor/papaparse/papaparse.js",
      "vendor/ng-sortable/dist/ng-sortable.js",
      "vendor/angular-notify/dist/angular-notify.js",
      "vendor/pikaday/pikaday.js",
      "vendor/ng-pikaday/ng-pikaday.js",
      "vendor/jquery-timepicker-wvega/jquery.timepicker.js",
      "vendor/Squire/build/squire-raw.js",
      "vendor/dropzone/dist/dropzone.js",
      "vendor/vcard/src/vcard.js",
      "vendor/html2canvas/build/html2canvas.js",
      "vendor/svg4everybody/dist/svg4everybody.js",
      "vendor/ical.js/build/ical.js",
      "vendor/angular-ical/dist/js/angular-ical.js",
      "vendor/angular-messages/angular-messages.js",
      "vendor/svgeezy/svgeezy.js",
      "vendor/mousetrap/mousetrap.js",
      "vendor/push.js/push.js",
      "vendor/angular-gettext/dist/angular-gettext.js",
      "vendor/awesomplete/awesomplete.js",
      "vendor/angular-ui-indeterminate/dist/indeterminate.js",
      "vendor/fingerprintjs2/fingerprint2.js",
      "vendor/bcryptjs/dist/bcrypt.js",
      "vendor/nouislider/distribute/nouislider.js",
      "vendor/ua-parser-js/dist/ua-parser.min.js",
      "vendor/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js",
      "vendor/ng-scrollbars/dist/scrollbars.min.js",
      "vendor/sieve/sieve.js",
      'vendor/intl-tel-input/build/js/intlTelInput.js',
      'vendor/intl-tel-input/build/js/utils.js',
      'vendor/ng-intl-tel-input/dist/ng-intl-tel-input.js',
      'vendor/blobjs/Blob.js',
      'vendor/file-saver/FileSaver.js',
      'vendor/hi-base32/build/base32.min.js',
      'vendor/qrcodejs/qrcode.js',
      'vendor/mailparser/mailparser.js',
      'vendor/cssua/cssua.js',
      'vendor/asmcrypto/asmcrypto.js',
      'vendor/babel-polyfill/dist/polyfill.js',
      'vendor/pmcrypto/build/pmcrypto.js'
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
      "vendor/ng-sortable/dist/ng-sortable.css",
      "vendor/angular-notify/dist/angular-notify.css",
      "vendor/pikaday/css/pikaday.css",
      "vendor/dropzone/dist/dropzone.css",
      "vendor/smooth-scrollbar/dist/smooth-scrollbar.css",
      "vendor/awesomplete/awesomplete.css",
      "vendor/nouislider/distribute/nouislider.css",
      "vendor/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.min.css",
      "vendor/codemirror/lib/codemirror.css",
      "vendor/codemirror/addon/lint/lint.css"
    ],

    fonts: [
      "vendor/components-font-awesome/fonts/*"
    ],

    sass_include_dirs: [
      "vendor/bourbon/dist",
      "vendor/bootstrap-sass-official/assets/stylesheets"
    ]
  }),

  proton_build: {
    version: "3.0",
    notes: "http://protonmail.dev/blog/",
    date: "17 Apr. 2015"
  }
};

vendor_files.js = vendor_files.js.concat(vendor_files.bootstrap_components.map(function (cmp){
  // return "vendor/bootstrap-sass-official/assets/javascripts/bootstrap/"+cmp+".js";
  return "vendor/bootstrap-sass/assets/javascripts/bootstrap.js"
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
