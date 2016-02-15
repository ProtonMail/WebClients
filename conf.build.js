/* jshint node: true, camelcase: false */

var vendor_files;
module.exports = {
  build_dir: "build",
  compile_dir: "dist",
  app_files: {
    js: [
      "src/**/*.js",
      "!src/**/*.spec.js",
      "!src/**/*.scenario.js",
      "!src/assets/**/*.js",
      "!src/static/*.js"
    ],
    jsunit: ["src/**/*.spec.js"],
    jse2e: ["src/**/*.scenario.js"],
    atpl: ["src/app/**/*.tpl.html"],
    ctpl: ["src/common/**/*.tpl.html"],
    html: ["src/app.html", "src/admin.html", "src/static/**.html"],
    sass: ["src/sass/application.scss"]
  },
  external_files: {
    openpgp: ["openpgp.worker.min.js", "openpgp.min.js"]
  },
  test_files: {
    js: [
      "vendor/angular-mocks/angular-mocks.js",
      "node_modules/chai-as-promised/lib/chai-as-promised.js",
      "node_modules/chai-fuzzy/index.js"
    ]
  },
  vendor_files: (vendor_files = {
    js: [
      "vendor/jquery/dist/jquery.js",
      "vendor/jquery-ui/jquery-ui.js",
      "vendor/jquery.payment/lib/jquery.payment.js",
      "vendor/fastclick/lib/fastclick.js",
      "vendor/angular/angular.js",
      "vendor/autofill-event/src/autofill-event.js",
      "vendor/angular-cookies/angular-cookies.js",
      "vendor/angular-resource/angular-resource.js",
      "vendor/angular-ui-router/release/angular-ui-router.js",
      "vendor/angular-sanitize/angular-sanitize.js",
      "vendor/angular-route/angular-route.js",
      "vendor/moment/moment.js",
      "vendor/underscore/underscore.js",
      "vendor/DOMPurify/dist/purify.min.js",
      "vendor/papaparse/papaparse.min.js",
      "vendor/ng-sortable/dist/ng-sortable.js",
      "vendor/angular-notify/dist/angular-notify.js",
      "vendor/pikaday/pikaday.js",
      "vendor/pikaday-angular/pikaday-angular.js",
      "vendor/Squire/build/squire.js",
      "vendor/dropzone/dist/dropzone.js",
      "vendor/angular-translate/angular-translate.js",
      "vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.js",
      "vendor/angular-translate-storage-cookie/angular-translate-storage-cookie.js",
      "vendor/angular-translate-storage-local/angular-translate-storage-local.js",
      "vendor/vcard/src/vcard.js",
      "vendor/mellt/javascript/Mellt.js",
      "vendor/mellt/javascript/common-passwords.js",
      "vendor/html2canvas/build/html2canvas.js",
      "vendor/svg4everybody/dist/svg4everybody.js",
      "vendor/ical.js/build/ical.js",
      "vendor/angular-ical/dist/js/angular-ical.js",
      "vendor/smooth-scrollbar/dist/smooth-scrollbar.js",
      "vendor/angular-smooth-scrollbar/dist/angular-smooth-scrollbar.js",
      "vendor/angular-messages/angular-messages.js",
      "vendor/svgeezy/svgeezy.js"
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
      "vendor/open-sans-fontface/open-sans.css",
      "vendor/smooth-scrollbar/dist/smooth-scrollbar.css"
    ],

    sass_include_dirs: [
      "vendor/bourbon/dist",
//      "vendor/font-awesome/scss",
      "vendor/bootstrap-sass-official/assets/stylesheets"
    ],
    assets: [
//      "vendor/font-awesome/fonts"
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
