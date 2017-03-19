/**
 * Created by dewildt on 2/13/17.
 */
'use strict';

(function () {
    angular.module('jsonGiant', [])
        .service('electron', function () {
            return require('electron').remote;

        })
        .service('jsonpath', function () {
            return require('jsonpath-plus');
        })
        .controller('defaultCtrl', function ($scope, $timeout, $window, electron, jsonpath) {

            let jsonTree;

            $scope.filename = "";
            $scope.activeJSONFilter = null;
            $scope.data = {
                example: "JSON File",
                "sub-obj1": {"sub-value-is-null": null},
                "a-number": 30,
                "a-boolean": true,
                "sub-obj2": {
                    "array": [
                        1, 2, 3
                    ]
                },
                "sub-obj3": {
                    "array": [
                        4, 5, 6
                    ]
                },
                "an-array": [
                    "zoom",
                    10,
                    "boom",
                    {
                        "deep": "object",
                        "deep-child": {
                            "even": "deeper",
                            "is-leaf": true
                        }

                    }
                ]
            };

            $scope.onTreeCreated = function (event) {
                jsonTree = event.controller;
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
                    fs.readFile(filename[0], function (err, data) {
                        if (err) {
                            electron.dialog.showErrorBox("Unabled to load file", err.message);
                        } else {
                            loadNewJSON(data, filename[0]);
                        }
                    });
                }

            };

            $scope.saveFile = function () {
                const fs = require('fs');

                let filename = electron.dialog.showSaveDialog({
                    filters: [{
                        name: "JSON Files",
                        extensions: ["json"]
                    }], properties: ['saveFile']
                });
                if (filename && filename.length > 0) {
                    fs.writeFile(filename, JSON.stringify($scope.data), {encoding: 'utf-8'}, function (err, data) {
                        if (err) {
                            electron.dialog.showErrorBox("Unabled to save file", err.message);
                        }
                    });
                }

            };

            $scope.getSelectedPath = function () {
                if ($scope.selectedNode) {
                    return $scope.selectedNode.path.filteredPath || $scope.selectedNode.path.path;
                } else {
                    return '';
                }
            }


            $scope.pasteFromClipboard = function () {
                const clipboard = electron.clipboard;
                let text = clipboard.readText();
                if (text && text.length > 0) {
                    loadNewJSON(text, "Clipboard Data");
                } else {
                    electron.dialog.showErrorBox("Paste error", 'There is no text in the clipboard');
                }
            };

            $scope.copyToClipboard = function () {
                const clipboard = electron.clipboard;
                clipboard.writeText(JSON.stringify($scope.data));
            };

            $scope.copySelectedNode = function () {
                'use strict';
                if ($scope.selectedNode) {
                    const clipboard = electron.clipboard;
                    clipboard.writeText(JSON.stringify($scope.selectedNode.node));
                }
            };

            $scope.selectedText = function () {
                return _.get($scope, 'selectedNode.path.path') || 'None';
            };

            $scope.deleteSelectedNode = function () {
                if ($scope.selectedNode) {
                    let items = $scope.selectedNode.path.path.substring(1).split(']'); // remove $ and split at end of each name
                    items = items.map(item => item.substring(1));
                    items.pop();  // remove the last empty item
                    let parent = $scope.data;

                    for (let i = 0; i < items.length; i++) {
                        let item = null;
                        let match = items[i].match(/^'(.+)'$/);

                        if (i == items.length - 1) {
                            // Last item this is the one to remove
                            if (match) {
                                // string so the parent is an object
                                delete parent[match[1]];
                            } else {
                                parent.splice(Number(items[i]), 1);
                            }
                        } else {
                            if (match) {
                                // string so the parent is an object
                                parent = parent[match[1]];
                            } else {
                                parent = parent[Number(items[i])];
                            }
                        }
                    }

                    if ($scope.selectedNode.path.filteredPath) {
                        jsonTree.deleteNode($scope.selectedNode.path.filteredPath);
                    } else {
                        jsonTree.deleteNode($scope.selectedNode.path.path);
                    }
                    //$scope.data = _.clone($scope.data);
                    $scope.selectedNode = null;
                }
            };

            $scope.filterChanged = function (filter) {
                $timeout(function () {

                    if (!_.isString(filter) || filter.length == 0) {
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

            $scope.clearFilter = function () {
                $scope.jsonFilter = '';
                $scope.filterChanged('');
            };


            $scope.copySelectedPath = function () {
                if ($scope.selectedNode) {
                    const clipboard = electron.clipboard;
                    clipboard.writeText($scope.selectedNode.path.path);
                }
            };

            $scope.jsonFilterKeyPress = function ($event, filter) {
                if ($event.keyCode === 13) {
                    $scope.filterChanged(filter);
                }
            };

            $scope.onNodeMouseClick = function (data) {
                $scope.selectedNode = data;
                $scope.$digest();

            };

            $scope.onSyntaxError = function (e) {
                electron.dialog.showErrorBox('Invalid JSON Path "' + $scope.activeJSONFilter + '"', e.message);
            };

            function loadNewJSON(content, contentName) {

                $timeout(function () {
                    try {
                        $scope.data = JSON.parse(content);
                        $scope.filename = contentName;

                        $window.document.title = "JSON Giant - " + contentName;
                    } catch (e) {
                        let messageData = '';
                        if (_.isString(content)) {
                            if (content.length > 100) {
                                messageData = '"' + content.substring(0, 100) + '..."';
                            } else {
                                messageData = '"' + content + '"';
                            }
                            messageData = "\n\nJSON input: " + messageData;
                        }
                        electron.dialog.showErrorBox("Invalid JSON input data", e.message + messageData);
                    }
                }, 0);
            }

        });
})();
