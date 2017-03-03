/**
 * Created by dewildt on 2/13/17.
 */

(function() {
    angular.module('jsonGiant', [])
        .service('electron', function () {
            'use strict';
            return require('electron').remote;

        })
        .service('jsonpath', function () {
            'use strict';
            // let jp = null;
            // jp = require('jsonpath-plus');
            // return jp;
            return require('jsonpath-plus');
        })
        .controller('defaultCtrl', function ($scope, $timeout, $window, electron, jsonpath) {

            $scope.filename = "";
            $scope.activeJSONFilter = null;
            $scope.data = {
                example: "JSON File",
                "sub-obj1": {"sub-value-is-null": null},
                "a-number": 30,
                "a-boolean": true,
                "sub-obj2" : {
                    "array" : [
                        1, 2, 3
                    ]
                },
                "sub-obj3" : {
                    "array" : [
                        4,5,6
                    ]
                },
                "an-array": [
                    "zoom",
                    10,
                    "boom"
                ]
            };

            $scope.openFile = function () {
                const fs = require('fs');

                let filename = electron.dialog.showOpenDialog({
                    filters: [{
                        name: "JSON Files",
                        extensions: ["json"]
                    }], properties: ['openFile']
                });
                if (filename && filename.length > 0) {
                    //fs.open(filename[0], 'r', function (err, handle) {
                    //  let buff = Buffer.alloc(512);
                    fs.readFile(filename[0], function (err, data) {
                        if (err) {
                            electron.dialog.showErrorBox("Unabled to load file", err.message);
                        } else {
                            loadNewJSON(data, filename[0]);
                        }
                    });
                    //});
                }

            }

            $scope.pastFromClipboard = function () {
                const clipboard = electron.clipboard;
                text = clipboard.readText();
                if (text && text.length > 0) {
                    loadNewJSON(text, "Clipboard Data");
                } else {
                    electron.dialog.showErrorBox("No data on the clipboard to load");
                }
            };

            $scope.filterChanged = function (filter) {
                "use strict";
                $timeout(function () {

                    if (!_.isString(filter)|| filter.length == 0) {
                        $scope.activeJSONFilter = null;
                    } else {
                        try {

                            //jsonpath({path: filter, json: {}});
                            $scope.activeJSONFilter = filter;
                            $scope.$apply();
                        } catch (e) {
                            electron.dialog.showErrorBox('Invalid JSON Path "' + filter + '"', e.message);
                        }
                    }

                }, 0);

            };

            $scope.copySelectedNode = function() {
                'use strict';
                if ($scope.selectedNode) {
                    const clipboard = electron.clipboard;
                    clipboard.writeText(JSON.stringify($scope.selectedNode.node));
                }
            };
            $scope.copySelectedPath = function() {
                'use strict';
                if ($scope.selectedNode) {
                    const clipboard = electron.clipboard;
                    clipboard.writeText($scope.selectedNode.path.path);
                }
            };

            $scope.jsonFilterKeyPress = function ($event, filter) {
                "use strict";
                if ($event.keyCode === 13) {
                    $scope.filterChanged(filter);
                }
            };

            $scope.onNodeMouseClick = function(data) {
                'use strict';

                $scope.selectedNode = data;
                $scope.$digest();

            };

            $scope.onSyntaxError = function(e) {
                'use strict';
                 electron.dialog.showErrorBox('Invalid JSON Path "' + $scope.activeJSONFilter + '"', e.message);
            };

            function loadNewJSON(content, contentName) {

                $timeout(function () {
                    try {
                        $scope.data = JSON.parse(content);
                        $scope.filename = contentName;

                        $window.document.title = "JSON Giant - " + contentName;
                    } catch (e) {
                        electron.dialog.showErrorBox("Invalid JSON input data: ", e.message);
                    }
                }, 0);
            }

        });
})();
