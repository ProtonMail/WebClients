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
      "!src/assets/**/*.js"
    ],
    jsunit: ["src/**/*.spec.js"],
    jse2e: ["src/**/*.scenario.js"],
    atpl: ["src/app/**/*.tpl.html"],
    ctpl: ["src/common/**/*.tpl.html"],
    html: ["src/index.html", "src/admin.html"],
    sass: ["src/sass/application.scss", "src/sass/admin.scss"]
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
      "vendor/angular/angular.js",
      "vendor/angular-file-upload/dist/angular-file-upload-shim.js",
      "vendor/angular-resource/angular-resource.js",
      "vendor/angular-ui-router/release/angular-ui-router.js",
      "vendor/angular-animate/angular-animate.js",
      "vendor/angular-local-storage/dist/angular-local-storage.js",
      "vendor/angular-sanitize/angular-sanitize.js",
      "vendor/angular-route/angular-route.js",
      "vendor/angular-file-upload/dist/angular-file-upload.js",
      "vendor/lodash/dist/lodash.js",
      "vendor/moment/moment.js",
      "vendor/underscore.string/lib/underscore.string.js",
      "vendor/openpgp/*.js",
      "vendor/showdown/compressed/showdown.js",
      "vendor/angular-markdown-directive/markdown.js",
      "vendor/wysihtml5x/parser_rules/advanced.js",
      "vendor/wysihtml5x/dist/wysihtml5x-toolbar.js",
      "vendor/typeahead.js/dist/typeahead.bundle.js",
      "vendor/tagmanager/tagmanager.js",
      "vendor/autosize-input/jquery.autosize.input.js",
      "vendor/mousetrap/mousetrap.js",
      "vendor/ng-sortable/dist/ng-sortable.js",
      "vendor/dragdealer/src/dragdealer.js",
      "vendor/angular-notify/dist/angular-notify.js"
    ],
    bootstrap_components: [
      "affix",
      "alert",
      "collapse",
      "tooltip",
      "dropdown",
      "modal"
    ],

    required_js: [],

    css: [
      "vendor/tagmanager/tagmanager.css",
      "vendor/ng-sortable/dist/ng-sortable.css",
      "vendor/angular-notify/dist/angular-notify.css"
    ],

    sass_include_dirs: [
      "vendor/bourbon/dist",
      "vendor/font-awesome/scss",
      "vendor/bootstrap-sass-official/assets/stylesheets"
    ],
    assets: [
      "vendor/font-awesome/fonts"
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
  return vendor_files.required_js.every(function (required) {
    return file.indexOf(required) === -1;
  });
});

vendor_files.required_js = vendor_files.js.filter(function (file) {
  return vendor_files.required_js.some(function (required) {
    return file.indexOf(required) !== -1;
  });
});
