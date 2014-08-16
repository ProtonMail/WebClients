/* global -_ */
/* jshint node: true, camelcase: false */

var _ = require("lodash"), 
    util = require("util");

var API_TARGETS = {
  local:   "http://0.0.0.0:4003",
  production: "http://api.protonmail.com",
  target:  "http://?"
};

var BROWSERS = ["PhantomJS", "Chrome", "Firefox", "Safari"];

module.exports = function (grunt) {
  grunt.loadTasks("tasks");
  require("load-grunt-tasks")(grunt);

  // Extract API URL from command-line options.
  //
  // Each target in API_TARGETS can be enabled by passing the target name as a
  // command-line option ('--staging').
  //
  // '?'s in a target's hostname are replaced with the command-line option's
  // value. For example, '--target=google.com' results in an API URL of
  // 'google.com'.
  //
  // Specifying multiple target command-line options results in undefined
  // behavior.
  function apiUrl() {
    return _(API_TARGETS)
      .pick(function (host, target) {
        return grunt.option(target);
      })
      .map(function (host, target) {
        return host.replace("?", grunt.option(target));
      })
      .first() || API_TARGETS.local;
  }

  function rewriteIndexMiddleware(connect, options) {
    // options.base is normalized to an array by grunt-contrib-connect
    if (options.base.length !== 1) {
      grunt.fail.fatal("must specify exactly one base");
    }
    var base = options.base[0];
    return [
      connect.static(base),
      function (req, res, next) {
        // no file found; send index.html
        var file = base + "/index.html";
        if (grunt.file.exists(file)) {
          require("fs").createReadStream(file).pipe(res);
          return;
        }
        res.statusCode(404);
        res.end();
      }
    ];
  }

  // Expose each supported browser as a command-line option
  function browsers() {
    var selected = _.filter(BROWSERS, function (browser) {
      return grunt.option(browser.toLowerCase());
    });

    return _.isEmpty(selected) ? [BROWSERS[0]] : selected;
  }

  var userConfig = require("./conf.build.js");

  var taskConfig = {
    pkg: grunt.file.readJSON("package.json"),
    meta: {
      banner:
        "/**\n" +
        " * <%= pkg.name %> - <%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd HH:MM:ss') %>\n" +
        " *\n" +
        " * copyright <%= grunt.template.today('yyyy') %> <%= pkg.author %>\n" +
        " * <%= pkg.license %>\n" +
        " */\n"
    },

    clean: [
      "<%= build_dir %>",
      "<%= compile_dir %>"
    ],

    aglio: {
      build: {
        files: {
          "./api/index.html": [
            "./api/specs/main.md", 
            "./api/specs/messages.md", 
            "./api/specs/contacts.md"
          ],
          theme: "default"
        }
      }
    },

    forever: {
      mock_server: {
        options: {
          command: './node_modules/api-mock/bin/api-mock ./api/blueprint.md'+ ' -p ' + (grunt.option('api-port') || '4003'),
          index: '',
          logDir: 'logs'
        }
      }
    },

    connect: {
      options: {
        hostname: "*",
        middleware: rewriteIndexMiddleware,
        port: 8080
      },

      compile: {
        options: {
          base: "<%= compile_dir %>"
        }
      },

      watch: {
        options: {
          base: "<%= build_dir %>",
          livereload: 40093
        }
      },

      api_doc: {
        options: {
          base: "./api",
          port: 4001
        }
      }
    },

    copy: {
      build_app_assets: {
        files: [
          {
            src: ["**"],
            dest: "<%= build_dir %>/assets/",
            cwd: "src/assets",
            expand: true
          }
        ]
      },
      build_vendor_assets: {
        files: [
          {
            src: ["<%= vendor_files.assets %>"],
            dest: "<%= build_dir %>/assets/",
            cwd: ".",
            expand: true,
            flatten: true
          }
        ]
      },
      build_appjs: {
        files: [
          {
            src: ["<%= app_files.js %>"],
            dest: "<%= build_dir %>/",
            cwd: ".",
            expand: true
          }
        ]
      },
      build_vendorjs: {
        files: [
          {
            src: ["<%= vendor_files.js %>"],
            dest: "<%= build_dir %>/vendor",
            cwd: ".",
            expand: true,
            flatten: true
          }
        ]
      },
      compile_assets: {
        files: [
          {
            src: ["**", "!*.css"],
            dest: "<%= compile_dir %>/assets",
            cwd: "<%= build_dir %>/assets",
            expand: true
          }
        ]
      }
    },

    sass: {
      build: {
        options: {
          includePaths: "<%= vendor_files.sass_include_dirs %>"
        },
        files: {
          "<%= build_dir %>/assets/application.css": "<%= app_files.sass %>"
        }
      }
    },

    concat: {
      build_css: {
        src: [
          "<%= vendor_files.css %>",
          "<%= build_dir %>/assets/application.css"
        ],
        dest: "<%= build_dir %>/assets/application.css"
      },
      compile_js: {
        options: {
          banner: "<%= meta.banner %>"
        },
        files: {
          "<%= compile_dir %>/assets/app.js": [
            "<%= build_dir %>/src/**/*.js",
            "<%= html2js.app.dest %>",
            "<%= html2js.common.dest %>",
          ],
          "<%= compile_dir %>/assets/vendor.js": ["<%= vendor_files.included_js %>"]
        }
      },
      compile_api_spec: {
        files: {
          "./api/blueprint.md": [ 
            "./api/specs/main.md",
            "./api/specs/messages.md",
            "./api/specs/contacts.md"
          ]
        }
      }
    },

    cssmin: {
      compile: {
        src: ["<%= build_dir %>/assets/**/*.css"],
        dest: "<%= compile_dir %>/assets/app.css"
      }
    },

    html2js: {
      app: {
        options: {
          base: "src/app"
        },
        src: ["<%= app_files.atpl %>" ],
        dest: "<%= build_dir %>/templates-app.js"
      },

      common: {
        options: {
          base: "src/common"
        },
        src: ["<%= app_files.ctpl %>" ],
        dest: "<%= build_dir %>/templates-common.js"
      }
    },

    karma: {
      options: {
        configFile: "<%= build_dir %>/conf.unit.js",
      },
      watch: {
        autoWatch: true,
        background: true,
        browsers: browsers()
      },
      once: {
        singleRun: true,
        browsers: ["PhantomJS"]
      }
    },


    testconfig: {
      unit: {
        src: [
          "<%= vendor_files.included_js %>",
          "<%= html2js.app.dest %>",
          "<%= html2js.common.dest %>",
          "<%= test_files.js %>"
        ]
      }
    },

    protractor_webdriver: {
      build: {
        options: {
          keepAlive: true,
          path: "./node_modules/.bin/"
        }
      }
    },


    ngAnnotate: {
      compile: {
        files: [
          {
            src: ["<%= app_files.js %>"],
            cwd: "<%= build_dir %>",
            dest: "<%= build_dir %>",
            expand: true
          }
        ]
      }
    },

    uglify: {
      compile: {
        options: {
          banner: "<%= meta.banner %>"
        },
        files: {
          "<%= compile_dir %>/assets/vendor.js": "<%= compile_dir %>/assets/vendor.js"
        }
      }
    },

    index: {
      options: {
        apiUrl: apiUrl()
      },
      build: {
        dir: "<%= build_dir %>",
        src: [
          "<%= html2js.common.dest %>",
          "<%= html2js.app.dest %>",
          "<%= build_dir %>/src/**/*.js",
          "<%= vendor_files.included_js %>",
          "<%= build_dir %>/assets/application.css"
        ]
      },

      compile: {
        dir: "<%= compile_dir %>",
        src: [
          "<%= compile_dir %>/assets/vendor.js",
          "<%= compile_dir %>/assets/app.js",
          "<%= cssmin.compile.dest %>"
        ]
      }
    },

    delta: {
      options: {
        livereload: 40093,
        spawn: false,
        interrupt: !grunt.option("no-watch-interrupt")
      },

      html: {
        files: ["<%= app_files.html %>"],
        tasks: ["index:build"]
      },

      sass: {
        files: [
          "src/sass/**/*.scss"
        ],
        tasks: ["sass:build", "concat:build_css"]
      },

      css: {
        files: ["<%= build_dir %>/assets/**/*.css"]
      },

      tpls: {
        files: ["<%= app_files.atpl %>", "<%= app_files.ctpl %>"],
        tasks: ["html2js"]
      },

      jssrc: {
        files: ["<%= app_files.js %>"],
        tasks: ["copy:build_appjs", "index:build"]
      },

      assets: {
        files: ["src/assets/**/*"],
        tasks: ["copy:build_app_assets"]
      },

      gruntfile: {
        files: "Gruntfile.js",
        tasks: [],
        options: { livereload: false }
      },

      api_spec: {
        files: ["api/specs/*"],
        tasks: [
          "aglio:build", 
          "concat:compile_api_spec", 
          "forever:mock_server:restart", 
          "delta"
        ]
      }
    }
  };

  grunt.initConfig(grunt.util._.extend(taskConfig, userConfig));

  grunt.renameTask("watch", "delta");
  grunt.registerTask("watch", [
    "build",
    "karma:watch:start",
    "connect:watch",
    "connect:api_doc",
    "concat:compile_api_spec",
    "forever:mock_server:start",
    "delta",
    "delta"
  ]);

  grunt.registerTask("build", [
    "clean",
    "html2js",
    "sass:build",
    "aglio:build",
    "concat:build_css",
    "copy:build_app_assets",
    "copy:build_vendor_assets",
    "copy:build_appjs",
    "copy:build_vendorjs",
    "index:build",
    "testconfig"
  ]);

  grunt.registerTask("compile", [
    "clean",
    "build",
    "copy:compile_assets",
    "ngmin",
    "cssmin",
    "concat:compile_js",
    "uglify",
    "index:compile",
    "connect:compile"
  ]);

  grunt.registerTask("default", ["watch"]);
};
