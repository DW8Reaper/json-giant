/**
 * Created by dewildt on 2/13/17.
 */

(function () {

    angular.module('jsonGiant', [])
        .constant("electron", require('electron').remote)
        .controller('defaultCtrl', function ($scope, $timeout, $window, electron) {

            $scope.filename = "";
            $scope.activeJSONFilter = null;
            $scope.data = {
                example: "JSON File",
                "sub-object": {"sub-value-is-null": null},
                "a-number": 30,
                "a-boolean": true,
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
                        let jsonpath = require('jsonpath');
                        try {
                            $scope.activeJSONFilter = jsonpath.stringify(jsonpath.parse(filter));
                        } catch (e) {
                            electron.dialog.showErrorBox('Invalid JSON Path "' + filter + '"', e.message);
                        }
                    }

                }, 0);

            }
            $scope.jsonFilterKeyPress = function ($event, filter) {
                "use strict";
                if ($event.keyCode === 13) {
                    $scope.filterChanged(filter);
                }
            }

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
