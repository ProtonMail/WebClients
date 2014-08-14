/* jshint node: true */

module.exports = function (karma) {
  karma.set({
    basePath: "../",
    /* jshint ignore:start */
    files: [
      <% scripts.forEach(function (file) { %>"<%= file %>",
      <% }); %>
      "src/**/*.js"
    ],
    /* jshint ignore:end */
    exclude: [
      "src/assets/**/*.js",
      "src/**/*.scenario.js"
    ],
    frameworks: ["mocha", "chai-sinon"],
    reporters: ["dots"],
    port: 9018,
    runnerPort: 9100,
    urlRoot: "/",
    autoWatch: false
  });
};

