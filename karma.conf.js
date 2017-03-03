// Karma configuration
// Generated on Thu Feb 16 2017 21:32:16 GMT-0500 (EST)

// let _ = require('lodash');

module.exports = function (config) {

    let included_files = [];



    // _.forEach(['jquery', 'angular', 'angular-mocks', 'lodash', 'jsonpath-plus'],
    //     function (libName) {
    //         'use strict';
    //         // Include root JS and sub-directory js
    //         included_files.push({pattern: 'node_modules/' + libName + '/!(*.js)', served: true, included: false, watched: false, nocache: false});
    //         included_files.push({pattern: 'node_modules/' + libName + '/**/!(*.js)', served: true, included: false, watched: false, nocache: false});
    //
    //         // Include root JS and sub-directory js
    //         // included_files.push({pattern: 'node_modules/' + libName + '/*.js', served: true, included: true, watched: false, nocache: false});
    //         // included_files.push({pattern: 'node_modules/' + libName + '/**/*.js', served: true, included: true, watched: false, nocache: false});
    //
    //     });

    //include libraries
    included_files.push({pattern: 'node_modules/jquery/dist/jquery.js', served: true, included: true, watched: false, nocache: false});

    // setup karma globals once jquery is available
    included_files.push({pattern: 'karma-require-config.js', served: true, included: true, watched: true, nocache: true});


    included_files.push({pattern: 'node_modules/angular/angular.js', served: true, included: true, watched: false, nocache: false});
    included_files.push({pattern: 'node_modules/angular-mocks/angular-mocks.js', served: true, included: true, watched: false, nocache: false});
    included_files.push({pattern: 'node_modules/lodash/lodash.js', served: true, included: true, watched: false, nocache: false});
    // included_files.push({pattern: 'node_modules/jsonpath-plus/lib/jsonpath.js', served: true, included: true, watched: false, nocache: false});

    // included_files.push({pattern: 'app/*-spec.js', served: false, included: false, watched: true, nocache: false});
    // included_files.push({pattern: 'app/**/*-spec.js', served: false, included: false, watched: true, nocache: false});
    included_files.push({pattern: 'app/img/**/*', served: true, included: false, watched: true, nocache: false});
    included_files.push({pattern: 'app/img/*', served: true, included: false, watched: true, nocache: false});
    included_files.push({pattern: 'app/*.css', served: true, included: false, watched: true, nocache: false});
    included_files.push({pattern: 'app/**/*.css', served: true, included: false, watched: true, nocache: false});





    //Include application files
    included_files.push({pattern: 'app/json-giant.js', served: true, included: true, watched: true, nocache: true});
    included_files.push({pattern: 'app/**/*.js', served: true, included: true, watched: true, nocache: true});

    included_files.push('app/*-spec.js');
    included_files.push('app/**/*-spec.js');

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)

        basePath: '.',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: included_files,

        // list of files to exclude
        exclude: [
            'app/main.js',
            'app/globalizeLibs.js'
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            '**/app/**/!(*-spec).js' : ['electron','coverage'],
            '**/app/!(*-spec).js' : ['electron','coverage']
        },

        reporters: ['progress', 'coverage'],

              // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values  : config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Electron'],
        // browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        // optionally, configure the reporter
        coverageReporter: {
            type: 'html',
            dir: 'build/coverage/',
            subdir: '.',
            includeAllSources: false,
            instrumenterOptions: {
                istanbul: { noCompact: true }
            }
        },
        client: {
            useIframe: false
        },


        plugins: [
            "karma-electron",
            //"karma-electron-launcher",
            "karma-chrome-launcher",
            "karma-coverage",
            "karma-jasmine",
            "karma-threshold-reporter"
        ]
        // proxies: {
        //     "/base/app/": "http://localhost:8080/app",
        //     "/base/node_modules/": "http://localhost:8080/node_modules"
        // },
    })
}
