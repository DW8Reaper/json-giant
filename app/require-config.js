/**
 * Created by dewildt on 2/18/17.
 */
(function () {

    basePath = '';
    nodeBase = '../node_modules';
    testMode = false;

    if (window.hasOwnProperty('____running_karma_test_config____')) {
        basePath = 'base/app';
        nodeBase = '../node_modules';
        testMode = true;
    }

    requirejs.config({
        baseUrl: basePath,

        paths: {
            jquery: (nodeBase + '/jquery/dist/jquery'),
            angular: (nodeBase + '/angular/angular'),
            "angular-mocks": (nodeBase + '/angular-mocks/angular-mocks'),
            lodash: (nodeBase + '/lodash/lodash')
        },

        shim: {
            lodash: {
                exports: '_'
            },
            angular: {
                deps: ['jquery'],
                exports: 'angular'
            }
        }

    });

    requirejs(['jquery', 'lodash'], function (jquery, lodash) {
        'use strict';

        // load angular but first set window.jQuery to force angular to reuse it
        window.jQuery = jquery;

        let modules = ['angular',
            'json-giant-main',
            'components/json-tree'];

        if (testMode) {
            // running karma tests so add all the test specs we need
            modules = modules.concat(
                ['angular-mocks',
                 'components/json-tree-spec']
            );
        };

        // recursively load angular and js files with require. This ensures they load in the correct order. It's a
        // little ungly but lets us shared this configuration with tests and the real app

        let load = function () {
            modules.splice(0, 1);  //remove loaded module
            if (modules.length > 0) {
                let name = modules[0];
                requirejs([name], load);
            } else if (testMode) {
                    callback: window.__karma__.start();
            } else {
                // Running the app so start angular
                angular.bootstrap(document, ['jsonGiant']);
            }
        };
        requirejs([modules[0]], load);

    });
})();