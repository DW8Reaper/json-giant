// Karma configuration
// Generated on Thu Feb 16 2017 21:32:16 GMT-0500 (EST)

let _ = require('lodash');


module.exports = function (config) {

    let included_files = [];

    // _.forEach(['jquery', 'angular', 'angular-mocks', 'lodash', 'jsonpath', 'requirejs'],
    //     function (libName) {
    //         'use strict';
    //         // Include root JS and sub-directory js
    //         included_files.push({pattern: 'node_modules/' + libName + '/*', served: true, included: false, watched: false, nocache: false});
    //         included_files.push({pattern: 'node_modules/' + libName + '/**/*', served: true, included: false, watched: false, nocache: false});
    //
    //     });
    //
    // included_files.push({pattern: 'app/*', served: true, included: false, watched: true, nocache: false});
    // included_files.push({pattern: 'app/**/*', served: true, included: false, watched: true, nocache: false});
    //
    // included_files.push({pattern: 'app/*.js', served: true, included: false, watched: true, nocache: false});
    // included_files.push({pattern: 'app/**/*.js', served: true, included: false, watched: true, nocache: false});

    included_files.push('karma-require-config.js');
    included_files.push('app/require-config.js');


    // included_files.push({pattern: 'app/*-spec.js', served: false, included: false, watched: true, nocache: false});
    // included_files.push({pattern: 'app/**/*-spec.js', served: false, included: false, watched: true, nocache: false});
    included_files.push({pattern: 'app/*.js', served: true, included: false, watched: true, nocache: false});
    included_files.push({pattern: 'app/**/*.js', served: true, included: false, watched: true, nocache: false});
    // included_files.push('app/*-spec.js');
    // included_files.push('app/**/*-spec.js');

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)

        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'requirejs'],


        // list of files / patterns to load in the browser
        files: included_files,

        // list of files to exclude
        exclude: [
            'main.js'
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            '**/app/**/!(*-spec).js' : ['coverage'],
            '**/app/!(*-spec).js' : ['coverage']
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter



        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],
        //browsers: ['PhantomJS'],//, 'Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        // optionally, configure the reporter
        coverageReporter: {
            type: 'html',
            dir: 'build/coverage/',
            subdir: '.'
        },

        proxies: {
            "/base/app/": "http://localhost:8080/app",
            "/base/node_modules/": "http://localhost:8080/node_modules"
        },
    })
}
