(function() {
    "use strict";

    angular.module('jsonGiant')
        .component('jsonTree', {
        //templateUrl: 'json-tree.html',
        template: '<div class="tree-node"></div>',
        bindings: {
            jsonContent: '<',
            maxNodes: '<',
            jsonFilter: '<'
        },
        controller: function ($element, electron) {
            const ctrl = this;
            const jsonpath = require('jsonpath');

            ctrl.$onInit = function () {
                let v = 20;
            }

            ctrl.$onChanges = function () {
                $element.empty();

                if (!ctrl.jsonContent) {
                    return;
                }
                let jsonData = ctrl.jsonContent;
                if (_.isString(ctrl.jsonFilter)){
                    try {
                        jsonData = jsonpath.query(ctrl.jsonContent, ctrl.jsonFilter);
                    } catch (e) {
                        electron.dialog.showErrorBox('Invalid JSON Path "' + ctrl.jsonFilter + '"', e.message);
                    }
                }

                let rootContainer = $($element);
                ctrl.treeRoot = null;
                ctrl.treeRoot = createNodeData(null, null, jsonData, rootContainer);
                rootContainer.data(ctrl.treeRoot);
                ctrl.treeRoot.isLast = true;
                ctrl.drawNode(ctrl.treeRoot);

            };

            ctrl.toggleNode = function (treeNode) {
                if (treeNode.isBuilt) {
                    if (treeNode.expanded) {
                        treeNode.expanded = false;
                        treeNode.childContainer.hide();
                        treeNode.expander.addClass("tree-node-expander-expand");
                        treeNode.expander.removeClass("tree-node-expander-collapse");

                        if (treeNode.showMoreContainer) {
                            treeNode.showMoreContainer.hide();
                        }
                    } else {
                        treeNode.expanded = true;
                        treeNode.childContainer.show();
                        treeNode.expander.removeClass("tree-node-expander-expand");
                        treeNode.expander.addClass("tree-node-expander-collapse");

                        if (treeNode.childrenLimited && treeNode.showMoreContainer) {
                            treeNode.showMoreContainer.show();
                        }
                    }
                } else {
                    ctrl.drawNode(treeNode);
                }
                ;
            };

            ctrl.drawNode = function (treeNode) {
                treeNode.isBuilt = true;
                treeNode.expanded = true;

                if (treeNode.childContainer && treeNode.expander) {
                    treeNode.childContainer.show();
                    treeNode.expander.removeClass("tree-node-expander-expand");
                    treeNode.expander.addClass("tree-node-expander-collapse");
                }

                let last = null;
                let nodeNumber = 0;
                let initialNodeCount = treeNode.children.length;
                let nodeCount = 0;
                let buildChildren = function (value, key) {
                    nodeNumber++;
                    nodeCount++;
                    if (treeNode.maxChildren > 0 && treeNode.children.length >= treeNode.maxChildren) {
                        // already reached max children to process
                        treeNode.childrenLimited = true;
                        return;
                    } else if (treeNode.children.length >= nodeNumber) {
                        // drawn in previous iteration
                        return;
                    }

                    let child = $('<div class="tree-node"></div>');
                    let childData = createNodeData(treeNode, key, value, child);
                    last = childData;
                    child.data(childData);

                    treeNode.children.push(childData);
                    treeNode.childContainer.append(child);

                    if (childData.childContainer && childData.expander) {
                        childData.childContainer.hide();
                        childData.expander.on('click', nodeClicked);
                    }
                };

                treeNode.childrenLimited = false;  // assume we will be adding all children

                if (_.isArray(treeNode.nodeValue)) {
                    for (let i = 0; i < treeNode.nodeValue.length; i++) {
                        buildChildren(treeNode.nodeValue[i], i);
                    }
                } else {
                    _.forOwn(treeNode.nodeValue, buildChildren);
                }

                if (treeNode.childrenLimited) {
                    treeNode.showMoreContainer.text('…load ' + ctrl.maxNodes + ' more. There are ' + String(nodeCount - treeNode.children.length) + ' more node(s)');
                    treeNode.showMoreContainer.show();
                } else {
                    treeNode.showMoreContainer.hide();
                }

                for (let i = 0; i < treeNode.children.length; i++) {
                    let item = treeNode.children[i];
                    item.isLast = last === item;
                    if (!item.isLast && i >= initialNodeCount - 1) {
                        item.childContainerRoot.append(", ");
                    }
                }

            };


            function createNodeData(parent, name, value, container) {


                let childRoot = $('<div></div>');

                container.append(childRoot);

                let opener = "";
                let closer = "";
                let childContainer = null;
                let expander = null;
                let showMoreContainer = null;
                let displayName = '"' + name + '"';
                let valueText = "";

                if (parent && _.isArray(parent.nodeValue)) {
                    displayName = name;
                }

                if (_.isArray(value)) {
                    opener = "[ ";
                    closer = " ]"
                    childContainer = $('<div></div>');
                } else if (_.isObject(value)) {
                    opener = "{ ";
                    closer = " }"
                    childContainer = $('<div></div>');
                } else if (_.isBoolean(value)) {
                    valueText = '<span class="tree-node-val-boolean">' + _.escape(String(value)) + '</span>';
                } else if (_.isNumber(value)) {
                    valueText = '<span class="tree-node-val-number">' + _.escape(String(value)) + '</span>';
                } else if (value == null) {
                    valueText = '<span class="tree-node-val-null">' + _.escape(String(value)) + '</span>';
                } else {
                    valueText = '<span class="tree-node-val-string">' + _.escape('"' + String(value) + '"') + '</span>';
                }

                // Create intro
                if (name !== null) {
                    if (childContainer) {
                        expander = $('<div class="tree-node-expander tree-node-expander-expand"></div>');
                        childRoot.append(expander);
                    }
                    childRoot.append(displayName + ' : ');
                }
                if (!expander) {
                    childRoot.addClass("tree-node-no-expander");
                }
                if (childContainer) {
                    childRoot.append(opener);
                    childRoot.append(childContainer);
                    showMoreContainer = $('<div class="tree-node-show-more">...load more nodes...</div>');
                    showMoreContainer.on('click', showMoreClicked);
                    childRoot.append(showMoreContainer);
                    showMoreContainer.hide();

                    if (!parent) {
                        // root element does not indent
                        childRoot.append(closer);
                    } else {
                        childRoot.append('<span class="tree-node-close-spacer">' + _.escape(closer) + '</span>');
                    }
                } else {
                    childRoot.append(valueText);
                }

                return {
                    parent: parent,
                    name: name,
                    nodeValue: value,
                    container: container,
                    childContainerRoot: childRoot,
                    childContainer: childContainer,
                    expander: expander,
                    isBuilt: false,
                    expanded: false,
                    last: false,
                    maxChildren: ctrl.maxNodes,
                    childrenLimited: false,
                    showMoreContainer: showMoreContainer,
                    children: []
                };
            }

            function findTreeNode(object) {
                var current = object.eq(0);
                for (let i = 0; i < 4; i++) {
                    let data = current.data();
                    if (_.isObject(data) && _.has(data, 'parent') && _.has(data, 'name') && _.has(data, 'nodeValue') && _.has(data, 'container')) {
                        return data;
                    }
                    current = current.parent(0);
                }
                return null;
            }

            function showMoreClicked(e) {
                let node = $(e.target);
                let data = findTreeNode(node);
                if (data) {
                    data.maxChildren += ctrl.maxNodes ;
                    ctrl.drawNode(data);
                }
            }

            function nodeClicked(e) {
                // This should be the expander for a node. The expanded is in the childContainerRoot which in
                // turn is in the nodes root container that has all its data
                let node = $(e.target);
                let data = findTreeNode(node);
                if (_.isObject(data.nodeValue)) {
                    ctrl.toggleNode(data);
                }

            }


        }

    });

})();