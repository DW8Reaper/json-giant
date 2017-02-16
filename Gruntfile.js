/**
 * Created by dewildt on 2/15/17.
 */

let _ = require('lodash');

module.exports = function(grunt) {
    'use strict';

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
            "make-osx-dmg": {
                cmd: "hdiutil",
                args: [
                    "create",
                    "-fs",
                    "HFS+",
                    "-volname",
                    "<%= pkg.productName %>",
                    "-srcfolder",
                    "build/<%= pkg.productName %>-darwin-x64",
                    "<%=dmgPath%>"
                ]
            }
        },
        electron: {
            osx: {
                options: {
                    dir: './',
                    name: '<%= pkg.productName %>',
                    out: 'build',
                    electronVersion: "1.4.15",
                    overwrite : true,
                    platform: 'darwin',
                    arch: 'x64',
                    asar: true,
                    "app-version" : '<%= pkg.version %>',
                    "app-bundle-id": "com.broken-d.json-giant"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-electron');

    grunt.registerTask('run-app', 'Run JSON Giant electron app', ['run:electron']);
    grunt.registerTask('default', ['run-app']);

    grunt.registerTask('update-used-libraries', 'Update list of used libraries with license information', function () {
        let done = this.async();

        var nlf = require('nlf');

        nlf.find({production: true, directory: './' }, function (err, licenses) {
            grunt.log.error(err);

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

    grunt.registerTask('build-app', 'Build JSON Giant', function () {
        //grunt.config.set('electron.osx.options.version', grunt.config.get('pkg.app-version'));
        grunt.task.run('clean:release');

        let excludeList = grunt.file.expand({}, ['*', '!app', '!package.json', '!node_modules']);
        grunt.config.set('electron.osx.options.ignore', excludeList);

        grunt.task.run('electron');

        grunt.task.run('run:make-osx-dmg');

    });

};



