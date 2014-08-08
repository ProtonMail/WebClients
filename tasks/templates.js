/* jshint node: true */

function filterForJS(files) {
  return files.filter(function (file) {
    return file.match(/\.js$/);
  });
}

function filterForCSS(files) {
  return files.filter(function (file) {
    return file.match(/\.css$/);
  });
}

module.exports = function (grunt) {
  grunt.registerMultiTask("index", "Process index.html template", function () {
    var dirRE = new RegExp("^(" + grunt.config("build_dir") + "|" + grunt.config("compile_dir") + ")\/", "g");
    var jsFiles = filterForJS(this.filesSrc).map(function (file) {
      return file.replace(dirRE, "");
    });
    var cssFiles = filterForCSS(this.filesSrc).map(function (file) {
      return file.replace(dirRE, "");
    });
    var templateData = {
      scripts: jsFiles,
      settings: this.options(),
      styles: cssFiles,
      version: grunt.config("pkg.version"),
      build: grunt.config("proton_build")
    };

    grunt.file.copy("src/index.html", this.data.dir + "/index.html", {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: templateData
        });
      }
    });
    grunt.log.writeln("Built against API server:", this.options().apiUrl.green);
  });

  grunt.registerMultiTask("testconfig", "Process test config templates", function () {
    var jsFiles = filterForJS(this.filesSrc)
      , inFile = "conf." + this.target + ".tpl.js"
      , outFile = grunt.config("build_dir") + "/conf." + this.target + ".js";

    grunt.file.copy(inFile, outFile, {
      process: function (contents, path) {
        return grunt.template.process(contents, {
          data: {
            scripts: jsFiles
          }
        });
      }
    });
  });
};
