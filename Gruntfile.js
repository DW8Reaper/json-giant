/**
 * Created by dewildt on 2/15/17.
 */

let _ = require('lodash');

module.exports = function (grunt) {
    'use strict';

    function getOSXPackage() {
        return 'build/<%= pkg.productName %>-darwin-x64';
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dmgPath: 'build/<%= pkg.productName%>-<%= pkg.version%>.dmg',
        clean: {
            build: ['build/'],
            release: ['build/']
        },
        run: {
            "electron": {
                cmd: "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron",
                args: [
                    "."
                ]
            },
            "electron-debug": {
                cmd: "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron",
                args: [
                    ".",
                    "debug-mode"
                ]
            },
            "make-osx-dmg": {
                cmd: "hdiutil",
                args: [
                    "create",
                    "-fs",
                    "HFS+",
                    "-volname",
                    "<%= pkg.productName %>",
                    "-srcfolder",
                    getOSXPackage(),
                    "<%=dmgPath%>"
                ]
            },
            "karma":{
                cmd: 'karma',
                args: [
                    'start',
                    'karma.conf.js',
                    '--log-level',
                    'debug'
                ]
            }
        },
        electron: {
            osx: {
                options: {
                    dir: '.',
                    name: '<%= pkg.productName %>',
                    out: 'build',
                    electronVersion: "1.4.15",
                    overwrite: true,
                    platform: 'darwin',
                    arch: 'x64',
                    asar: true,
                    "app-version": '<%= pkg.version %>',
                    "app-bundle-id": "com.broken-d.json-giant",
                    "app-copyright" : "Copyright 2016 De Wildt van Reenen"
                }
            },
            windows: {
                options: {
                    dir: '.',
                    name: '<%= pkg.productName %>',
                    out: 'build',
                    electronVersion: "1.4.15",
                    overwrite: true,
                    platform: 'win32',
                    arch: 'all',
                    asar: true,
                    "app-version": '<%= pkg.version %>',
                    "app-bundle-id": "com.broken-d.json-giant",
                    "app-copyright" : "Copyright 2016 De Wildt van Reenen"
                }
            },
            linux: {
                options: {
                    dir: '.',
                    name: '<%= pkg.productName %>',
                    out: 'build',
                    electronVersion: "1.4.15",
                    overwrite: true,
                    platform: 'linux',
                    arch: 'all',
                    asar: true,
                    "app-version": '<%= pkg.version %>',
                    "app-bundle-id": "com.broken-d.json-giant",
                    "app-copyright" : "Copyright 2016 De Wildt van Reenen"
                }
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: false,
                reporters: ['progress']
            },
            coverage: {
                configFile: 'karma.conf.js',
                singleRun: true,
                logLevel: 'ERROR',
                reporters: ['progress', 'coverage']
            }
        },
        open: {
            coverage: {
                path: './build/coverage/index.html',
                app: 'Google Chrome'
            }
        },
        rename: {
            "osx-license" : {

            }
        },
        copy: {
            "osx-license": {
                files: [
                    // copy original license files
                    {
                        expand: true,
                        src: [(getOSXPackage() + '/LICENSE')],
                        dest: (getOSXPackage() + '/'),
                        filter: 'isFile',
                        flatten: true,
                        rename: function(dest, src) {
                            return dest + src + '-ELECTRON';
                        }
                    },
                    {
                        expand: true,
                        src: ['app/used_libraries.json'],
                        dest: (getOSXPackage() + '/'),
                        filter: 'isFile',
                        flatten: true
                    },
                    {
                        expand: true,
                        src: ['app/'],
                        dest: (getOSXPackage() + '/'),
                        filter: 'isFile',
                        flatten: true
                    },
                ],
            },
        },
    });

    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-electron');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('app-run', 'Run JSON Giant electron app', ['run:electron']);
    grunt.registerTask('app-debug', 'Run JSON Giant electron app', ['run:electron-debug']);

    grunt.registerTask('app-update-used-libs', 'Update list of used libraries with license information', function () {
        let done = this.async();

        var nlf = require('nlf');

        nlf.find({production: true, directory: './'}, function (err, licenses) {
            if (err) {
                grunt.log.error(err);
            }

            let used_libraries = [];

            _.forEach(licenses, function (license) {
                let names = [];
                _.forEach(_.get(license, 'licenseSources.package.sources'), function (src) {
                    if (src.license) {
                        names.push(src.license);
                    }
                });
                let text = [];
                _.forEach(_.get(license, 'licenseSources.license.sources'), function (src) {
                    if (src.text) {
                        text.push(src.text);
                    }
                });

                if ((names.length === 0) && (text.length !== 0)) {
                    names.push("Custom license");
                }

                used_libraries.push({
                    library: _.get(license, 'name'),
                    version: _.get(license, 'version'),
                    repository: _.get(license, 'repository'),
                    license: names,
                    licenseText: text
                });

                grunt.file.write("app/used_libraries.json", JSON.stringify(used_libraries));


            });
            done();
        });

    });

    grunt.registerTask('app-build', 'Build JSON Giant', function () {
        //grunt.config.set('electron.osx.options.version', grunt.config.get('pkg.app-version'));
        grunt.task.run('clean:release');

        let excludeList = grunt.file.expand({}, ['*', '!app', '!package.json', '!node_modules']);
        grunt.config.set('electron.osx.options.ignore', excludeList);

        if (grunt.option('osx')) {
            grunt.task.run('electron:osx');
            grunt.task.run('copy:osx-license');
            grunt.task.run('run:make-osx-dmg');
        } else if (grunt.option('windows')) {
            grunt.task.run('electron:windows');
        } else if (grunt.option('linux')) {
            grunt.task.run('electron:linux');
        } else {
            grunt.task.run('electron');
        }

    });

    grunt.registerTask('app-test', 'Run unit tests for JSON Giant', ['test-http-server', 'karma:unit']);

    grunt.registerTask('app-coverage', 'Run unit tests for JSON Giant', ['test-http-server', 'karma:coverage', 'open:coverage']);



    // task to start an HTTP server to serve all file for unit tests so that we don't have to redefine all of them
    // in karma config
    grunt.registerTask('test-http-server', function () {
        var liveServer = require("live-server");

        var params = {
            port: 8080, // Set the server port. Defaults to 8080.
            host: "127.0.0.1", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
            root: ".", // Set root directory that's being served. Defaults to cwd.
            open: false, // When false, it won't load your browser by default.
            ignore: 'scss,my/templates', // comma-separated string for paths to ignore
            file: "", // When set, serve this file for every 404 (useful for single-page applications)
            wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
            logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
        };
        liveServer.start(params);
    });

};



