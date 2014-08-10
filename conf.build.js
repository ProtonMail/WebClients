/* jshint node: true, camelcase: false */

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
      "vendor/angular-mocks/angular-mocks.js"
    ]
  },
  vendor_files: {
    js: [
      "vendor/angular/angular.js",
      "vendor/angular-resource/angular-resource.js",
      "vendor/angular-ui-router/release/angular-ui-router.js",
      "vendor/angular-animate/angular-animate.js",
      "vendor/angular-local-storage/angular-local-storage.js",
      "vendor/angular-route/angular-route.js",
      "vendor/requirejs/require.js",
      "vendor/jquery/dist/jquery.js",
      "vendor/lodash/dist/lodash.js",
      "vendor/moment/moment.js",
      "vendor/underscore.string/lib/underscore.string.js",
      "vendor/openpgp/*.js"
    ],
    css: [
      "vendor/pure/pure.css"
    ],
    sass_include_dirs: [
      "vendor/bourbon/dist",
      "vendor/font-awesome/scss",
    ],
    assets: [
      "vendor/font-awesome/fonts"
    ],
    exclude: [
      "openpgp",
      "require"
    ]
  },

  proton_build: {
    version: "1.09",
    notes: "http://protonmail.dev/blog/protonmail-beta-v1-09-release-notes/",
    date: "6 Aug. 2014"
  }
};
