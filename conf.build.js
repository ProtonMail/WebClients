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
    sass: ["src/sass/application.scss", "src/sass/admin.scss"]
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
      "vendor/jquery-ui/ui/jquery-ui.js",
      "vendor/angular/angular.js",
      "vendor/autofill-event/src/autofill-event.js",
      "vendor/angular-cookies/angular-cookies.js",
      "vendor/angular-resource/angular-resource.js",
      "vendor/angular-bootstrap/ui-bootstrap.js",
      "vendor/angular-bootstrap/ui-bootstrap-tpls.js",
      "vendor/angular-ui-router/release/angular-ui-router.js",
      "vendor/angular-animate/angular-animate.js",
      "vendor/angular-sanitize/angular-sanitize.js",
      "vendor/angular-route/angular-route.js",
      "vendor/angular-toggle-switch/angular-toggle-switch.js",
      "vendor/ng-file-upload/dist/ng-file-upload-all.js",
      "vendor/lodash/dist/lodash.js",
      "vendor/moment/moment.js",
      "vendor/underscore.string/lib/underscore.string.js",
      "vendor/DOMPurify/purify.js",
      "vendor/papaparse/papaparse.min.js",
      "vendor/showdown/compressed/showdown.js",
      "vendor/angular-markdown-directive/markdown.js",
      "vendor/typeahead.js/dist/typeahead.bundle.js",
      "vendor/tagmanager/tagmanager.js",
      "vendor/autosize-input/jquery.autosize.input.js",
      "vendor/mousetrap/mousetrap.js",
      "vendor/ng-sortable/dist/ng-sortable.js",
      "vendor/dragdealer/src/dragdealer.js",
      "vendor/angular-notify/dist/angular-notify.js",
      "vendor/pikaday/pikaday.js",
      "vendor/pikaday-angular/pikaday-angular.js",
      "vendor/squire-rte/build/squire.js",
      "vendor/dropzone/dist/dropzone.js",
      "vendor/angular-translate/angular-translate.js",
      "vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.js",
      "vendor/angular-translate-storage-cookie/angular-translate-storage-cookie.js",
      "vendor/angular-translate-storage-local/angular-translate-storage-local.js",
      "vendor/angular-dragdrop/src/angular-dragdrop.js",
      "vendor/vcard/src/vcard.js",
      "vendor/mellt/javascript/Mellt.js",
      "vendor/mellt/javascript/common-passwords.js",
      "vendor/dragster/lib/dragster.js",
      "vendor/html2canvas/build/html2canvas.js"
    ],
    bootstrap_components: [
      "affix",
      "alert",
      "collapse",
      "tooltip",
      "dropdown",
      "modal",
      "transition",
      "popover"
    ],

    required_js: [],

    included_js: [],

    css: [
      "vendor/tagmanager/tagmanager.css",
      "vendor/ng-sortable/dist/ng-sortable.css",
      "vendor/angular-notify/dist/angular-notify.css",
      "vendor/angular-modal/modal.css",
      "vendor/angular-toggle-switch/angular-toggle-switch.css",
      "vendor/angular-toggle-switch/angular-toggle-switch-bootstrap.css",
      "vendor/pikaday/css/pikaday.css",
      "vendor/dropzone/dist/dropzone.css"
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
    version: "2.0",
    notes: "http://protonmail.dev/blog/",
    date: "17 Apr. 2015"
  }
};

vendor_files.js = vendor_files.js.concat(vendor_files.bootstrap_components.map(function (cmp){
  return "vendor/bootstrap-sass-official/assets/javascripts/bootstrap/"+cmp+".js";
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
