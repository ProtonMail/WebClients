/* global -_ */
/* jshint node: true, camelcase: false */

var _ = require("lodash"),
util = require("util");
var appVersion = '3.1.0';
var apiVersion = '1';
var dateVersion = new Date().toDateString();
var clientID = 'Angular';
var clientSecret = '00a11965ac0b47782ec7359c5af4dd79';
var BROWSERS = ["PhantomJS", "Chrome", "Firefox", "Safari"];
var API_TARGETS = {
    blue: "https://52.32.164.147/api",
    prod: "https://mail.protonmail.com/api",
    dev: "https://dev.protonmail.com/api",
    v2: "https://v2.protonmail.com/api",
    build: "/api"
};

module.exports = function(grunt) {
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
        .pick(function(host, target) {
            return grunt.option(target);
        })
        .map(function(host, target) {
            return host.replace("?", grunt.option(target));
        })
        .first() || API_TARGETS.build;
    }

    function rewriteIndexMiddleware(connect, options) {
        // options.base is normalized to an array by grunt-contrib-connect
        if (options.base.length !== 1) {
            grunt.fail.fatal("must specify exactly one base");
        }
        var base = options.base[0];
        return [
            connect.static(base),
            function(req, res, next) {
                // no file found; send app.html
                var file = base + "/app.html";
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
        var selected = _.filter(BROWSERS, function(browser) {
            return grunt.option(browser.toLowerCase());
        });

        return _.isEmpty(selected) ? [BROWSERS[0]] : selected;
    }

    var userConfig = require("./conf.build.js");

    var taskConfig = {
        pkg: grunt.file.readJSON("package.json"),
        meta: {
            banner: "/**\n" +
            " * <%= pkg.name %> - <%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd HH:MM:ss') %>\n" +
            " *\n" +
            " * copyright <%= grunt.template.today('yyyy') %> <%= pkg.author %>\n" +
            " * <%= pkg.license %>\n" +
            " */\n"
        },

        notify_hooks: {
            options: {
                enabled: true,
                max_jshint_notifications: 5, // maximum number of notifications from jshint output
                title: "ProtonMail Angular", // defaults to the name in package.json, or will use project directory's name
                success: false, // whether successful grunt executions should be notified automatically
                duration: 3 // the duration of notification in seconds, for `notify-send only
            }
        },

        ngconstant: {
            options: {
                name: 'proton.config',
                dest: 'src/app/config.js'
            },
            dev: {
                constants: {
                    CONFIG: {
                        debug: true,
                        apiUrl: apiUrl(),
                        app_version: appVersion,
                        api_version: apiVersion,
                        date_version: dateVersion,
                        clientID: clientID,
                        clientSecret: clientSecret
                    }
                }
            },
            prod: {
                constants: {
                    CONFIG: {
                        debug: false,
                        apiUrl: apiUrl(),
                        app_version: appVersion,
                        api_version: apiVersion,
                        date_version: dateVersion,
                        clientID: clientID,
                        clientSecret: clientSecret
                    }
                }
            }
        },

        i18nextract: {
            default_options: {
                src: ["<%= app_files.js %>", "<%= app_files.atpl %>", "<%= app_files.ctpl %>", "<%= app_files.html %>"],
                dest: "src/assets/locales",
                lang: ['fr_FR', 'en_US', 'de_DE', 'it_IT', 'es_ES'],
                defaultLang: "en_US",
                prefix: "",
                suffix: ".json",
                stringifyOptions: true // the output will be sort (case insensitive)
            }
        },

        clean: {
            build: [
                "<%= build_dir %>"
            ],
            dist: [
                "<%= compile_dir %>"
            ],
            after: [
                "<%= build_dir %>/_footer.html",
                "<%= build_dir %>/_nav.html",
                "<%= build_dir %>/about.html",
                "<%= build_dir %>/faq.html",
                "<%= build_dir %>/invite.html",
                "<%= build_dir %>/careers.html",
                "<%= build_dir %>/media.html",
                "<%= build_dir %>/perks.html",
                "<%= build_dir %>/press.html",
                "<%= build_dir %>/privacy-policy.html",
                "<%= build_dir %>/security-details.html",
                "<%= build_dir %>/technical-details.html",
                "<%= build_dir %>/terms-and-conditions.html",
                "<%= build_dir %>/why-protonmail.html",
                "<%= build_dir %>/privacy-policy.html"
            ]
        },

        forever: {
            mock_server: {
                options: {
                    command: './node_modules/api-mock/bin/api-mock ./api/blueprint.md' + ' -p ' + (grunt.option('api-port') || '4003'),
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

        },

        copy: {
            build_app_assets: {
                files: [{
                    src: ["**"],
                    dest: "<%= build_dir %>/assets/",
                    cwd: "src/assets",
                    expand: true
                }]
            },
            build_vendor_assets: {
                files: [{
                    src: ["<%= vendor_files.assets %>"],
                    dest: "<%= build_dir %>/assets/",
                    cwd: ".",
                    expand: true,
                    flatten: true,
                    nonull: true
                }]
            },
            build_fonts: {
                files: [{
                    src: ["**"],
                    dest: "<%= build_dir %>/fonts",
                    cwd: "./src/assets/fonts",
                    expand: true
                }]
            },
            build_appjs: {
                files: [{
                    src: ["<%= app_files.js %>"],
                    dest: "<%= build_dir %>/",
                    cwd: ".",
                    expand: true,
                    nonull: true
                }]
            },
            build_vendorjs: {
                files: [{
                    src: ["<%= vendor_files.js %>"],
                    dest: "<%= build_dir %>/vendor",
                    cwd: ".",
                    expand: true,
                    flatten: true,
                    nonull: true
                }]
            },
            compile_assets: {
                files: [{
                    src: ["**", "!*.css"],
                    dest: "<%= compile_dir %>/assets",
                    cwd: "<%= build_dir %>/assets",
                    expand: true
                }]
            },
            compile_fonts: {
                files: [{
                    src: ["**"],
                    dest: "<%= compile_dir %>/fonts",
                    cwd: "./src/assets/fonts",
                    expand: true
                }]
            },
            deploy: {
                files: [{
                    src: [".htaccess"],
                    filter: "isFile",
                    expand: true,
                    dest: "./<%= compile_dir %>/",
                    cwd: "./src",
                    nonull: true
                }]
            },
            build_external: {
                files: [{
                    src: ["<%= external_files.openpgp %>"],
                    dest: "./<%= build_dir %>/",
                    nonull: true
                }]
            },
            compile_external: {
                files: [{
                    src: ["<%= external_files.openpgp %>"],
                    dest: "./<%= compile_dir %>/",
                    nonull: true
                }]
            },
            htaccess: {
                files: [{
                    src: [".htaccess"],
                    filter: "isFile",
                    expand: true,
                    dest: "./<%= build_dir %>/",
                    cwd: "./src",
                    nonull: true
                }]
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
                dest: "<%= build_dir %>/assets/application.css",
                nonull: true
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
                },
                nonull: true
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
                src: ["<%= app_files.atpl %>"],
                dest: "<%= build_dir %>/templates-app.js"
            },

            common: {
                options: {
                    base: "src/common"
                },
                src: ["<%= app_files.ctpl %>"],
                dest: "<%= build_dir %>/templates-common.js"
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
            options: {
                singleQuotes: true
            },
            compile: {
                files: [{
                    src: ["<%= app_files.js %>"],
                    cwd: "<%= build_dir %>",
                    dest: "<%= build_dir %>",
                    expand: true
                }]
            }
        },

        jshint: {
            files: ["<%= app_files.js %>", "!src/app/libraries/**/*.js", "!src/static/**"],
            options: {
                curly: true, // This option requires you to always put curly braces around blocks in loops and conditionals.
                eqeqeq: true, // This options prohibits the use of == and != in favor of === and !==.
                globals: {
                    _: true,
                    jQuery: true
                }
            }
        },

        uglify: {
            options: {
                mangle: false,
                sourceMap: false,
                preserveComments: false,
                report: 'min'
            },
            compile: {
                options: {
                    banner: "<%= meta.banner %>"
                },
                files: {
                    "<%= compile_dir %>/assets/app.js": "<%= compile_dir %>/assets/app.js",
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
                    "<%= build_dir %>/openpgp.min.js",
                    "<%= build_dir %>/pmcrypto.js",
                    "<%= build_dir %>/src/**/*.js",
                    "<%= vendor_files.included_js %>",
                    "<%= build_dir %>/assets/application.css"
                ],
                deployment: false
            },

            compile: {
                dir: "<%= compile_dir %>",
                src: [
                    "<%= compile_dir %>/assets/vendor.js",
                    "<%= compile_dir %>/openpgp.min.js",
                    "<%= compile_dir %>/pmcrypto.js",
                    "<%= compile_dir %>/assets/app.js",
                    "<%= cssmin.compile.dest %>"
                ],
                deployment: true
            }
        },

        cacheBust: {
            options: {
                deleteOriginals: false,
                ignorePatterns: [
                    'openpgp.min.js'
                ]
            },
            assets: {
                files: [{
                    src: ['<%= compile_dir %>/app.html']
                }]
            }
        },

        delta: {
            options: {
                livereload: 40093,
                spawn: false,
                // interrupt: !grunt.option("no-watch-interrupt")
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
                tasks: ["jshint", "copy:build_appjs", "index:build"]
            },

            assets: {
                files: ["src/assets/**/*"],
                tasks: ["copy:build_app_assets"]
            },

            gruntfile: {
                files: "Gruntfile.js",
                tasks: [],
                options: {
                    livereload: false
                }
            },

        },

        shell: {
            setup_dist: {
                command: [
                    "mkdir dist && cd dist",
                    "git init",
                    "git remote add origin git@github.com:ProtonMail/Angular.git",
                    "git fetch origin",
                    "git checkout -b deploy3 origin/deploy3",
                    "rm -rf *"
                ].join("&&")
            },
            push: {
                command: [
                    "cd dist",
                    "git ls-files --deleted -z | xargs -0 git rm",
                    "git add --all",
                    "git commit -m \"New Release\"",
                    "git push"
                ].join("&&")
            },
            bower: {
                command: [
                    // "[ -d vendor/ ] && rm -r vendor",
                    "bower update"
                ].join("&&")
            },

        },

        wait: {
            push: {
                options: {
                    delay: 3000
                }
            }
        }
    };

    // Project config
    grunt.initConfig(grunt.util._.extend(taskConfig, userConfig));

    // Load the grunt plugins
    grunt.loadNpmTasks('grunt-angular-translate');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-ng-constant');

    grunt.renameTask("watch", "delta");

    grunt.registerTask("watch", [
        "notify_hooks",
        "ngconstant:dev",
        "build",
        "jshint",
        "connect:watch",
        "delta"
    ]);

    grunt.registerTask("extract", [
        "i18nextract"
    ]);

    grunt.registerTask("build", [
        "clean:build",
        "jshint",
        "html2js",
        "sass:build",
        "concat:build_css",
        "copy:build_app_assets",
        "copy:build_vendor_assets",
        "copy:build_appjs",
        "copy:build_vendorjs",
        "copy:build_external",
        "copy:build_fonts",
        "index:build",
        "testconfig",
        "clean:after"
    ]);

    grunt.registerTask("compile", [
        "ngconstant:prod",
        "build",
        "copy:compile_assets",
        "copy:compile_fonts",
        "ngAnnotate",
        "cssmin",
        "concat:compile_js",
        "uglify",
        "copy:compile_external",
        "index:compile",
        "cacheBust",
        "connect:compile"
    ]);

    grunt.registerTask("deploy", [
        "clean:dist",
        "shell:setup_dist",
        "compile",
        "copy:deploy",
        "copy:htaccess",
        "clean:after",
        "shell:push",
        "wait:push"
    ]);


    grunt.registerTask("bower", [
        "shell:bower"
    ]);

};
