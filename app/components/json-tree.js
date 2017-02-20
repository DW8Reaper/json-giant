(function () {
    "use strict";

    angular.module('jsonGiant')
        .component('jsonTree', {
            template: '<div class="tree tree-root tree-node"></div>',
            bindings: {
                jsonContent: '<',
                maxNodes: '<',
                jsonFilter: '<',
                onError: '&',
                onNodeMouseOver: '&',
                onNodeMouseOut:'&',
                onNodeClick:'&'
            },
            controller: function ($element, jsonpath) {
                const ctrl = this;
                ctrl.basePath = [];

                ctrl.$onChanges = function () {
                    $element.empty();

                    let jsonData = ctrl.jsonContent;
                    if (_.isString(ctrl.jsonFilter) && ctrl.jsonFilter.length > 0) {
                        try {
                            jsonData = jsonpath.query(ctrl.jsonContent, ctrl.jsonFilter);
                        } catch (e) {
                            if (_.isFunction(ctrl.onError)) {
                                ctrl.onError(e);
                            } else {
                                throw e;
                            }
                        }
                    }

                    // only continue building if there is data to build
                    if (jsonData) {
                        let rootContainer = angular.element($element);
                        ctrl.treeRoot = null;
                        ctrl.treeRoot = createNodeData(null, null, jsonData, rootContainer);
                        rootContainer.data(ctrl.treeRoot);
                        ctrl.treeRoot.isLast = true;
                        ctrl.drawNode(ctrl.treeRoot);
                    }
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

                        let child = angular.element('<div class="tree tree-node"></div>');
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


                    let childRoot = angular.element('<div class="tree"></div>');

                    container.append(childRoot);

                    let opener = "";
                    let closer = "";
                    let childContainer = null;
                    let expander = null;
                    let showMoreContainer = null;
                    let displayName = '"' + name + '"';
                    let valueText = "";
                    let childIndexInParent = -1;

                    if (parent && _.isArray(parent.nodeValue)) {
                        displayName = name;
                        childIndexInParent = _.toInteger(name);
                    }

                    if (_.isArray(value)) {
                        opener = "[ ";
                        closer = " ]"
                        childContainer = angular.element('<div class="tree"></div>');
                    } else if (_.isObject(value)) {
                        opener = "{ ";
                        closer = " }"
                        childContainer = angular.element('<div class="tree"></div>');
                    } else if (_.isBoolean(value)) {
                        valueText = '<span class="tree tree-node-val-boolean">' + _.escape(String(value)) + '</span>';
                    } else if (_.isNumber(value)) {
                        valueText = '<span class="tree tree-node-val-number">' + _.escape(String(value)) + '</span>';
                    } else if (value == null) {
                        valueText = '<span class="tree tree-node-val-null">' + _.escape(String(value)) + '</span>';
                    } else {
                        valueText = '<span class="tree tree-node-val-string">' + _.escape('"' + String(value) + '"') + '</span>';
                    }

                    // add container for node name and value for processing node events
                    let childDataContainer = angular.element('<div class="tree tree-node-main"></div>');
                    childRoot.append(childDataContainer);
                    if (_.isFunction(ctrl.onNodeMouseOver)) {
                        childDataContainer.on('mouseover', nodeMouseOver);
                    }
                    if (_.isFunction(ctrl.onNodeMouseOut)) {
                        childDataContainer.on('mouseout', nodeMouseOut);
                    }
                    if (_.isFunction(ctrl.onNodeClick)) {
                        childDataContainer.on('click', nodeClick);
                    }

                    // Create intro
                    if (name !== null) {
                        if (childContainer) {
                            expander = angular.element('<div class="tree tree-node-expander tree-node-expander-expand"></div>');
                            expander.insertBefore(childDataContainer);
                        }
                        childDataContainer.append(displayName + ' : ');
                    }
                    if (!expander) {
                        childRoot.addClass("tree-node-no-expander");
                    }
                    if (childContainer) {
                        childRoot.append(opener);
                        childRoot.append(childContainer);
                        showMoreContainer = angular.element('<div class="tree tree-node-show-more">...load more nodes...</div>');
                        showMoreContainer.on('click', showMoreClicked);
                        childRoot.append(showMoreContainer);
                        showMoreContainer.hide();

                        if (!parent) {
                            // root element does not indent
                            childRoot.append(closer);
                        } else {
                            childRoot.append('<span class="tree tree-node-close-spacer">' + _.escape(closer) + '</span>');
                        }
                    } else {
                        childDataContainer.append(valueText);
                    }

                    return {
                        parent: parent,
                        name: name,
                        index: childIndexInParent,
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
                    let node = angular.element(e.target);
                    let data = findTreeNode(node);
                    if (data) {
                        data.maxChildren += ctrl.maxNodes;
                        ctrl.drawNode(data);
                    }
                }

                function buildNodePath(node) {
                    let path = [];
                    let currentNode = node;
                    while (currentNode && currentNode.parent) {
                        if (currentNode.index >= 0) {
                            //array element
                            path.push(currentNode.index)
                        } else {
                            path.push(currentNode.name)
                        }

                        currentNode = currentNode.parent;
                    }

                    return path.reverse();
                }

                function nodeMouseOver(e) {
                    runNodeEvent(e, ctrl.onNodeMouseOver);
                }

                function nodeMouseOut(e) {
                    runNodeEvent(e, ctrl.onNodeMouseOut);
                }

                function nodeClick(e) {
                    runNodeEvent(e, ctrl.onNodeClick);
                }

                function runNodeEvent(e, event) {
                    if (!_.isFunction(event)) {
                        return;
                    }

                    let node = angular.element(e.target);
                    let data = findTreeNode(node);
                    if (data != null) {
                        event(buildNodePath(data));
                    }

                }

                function nodeClicked(e) {
                    // This should be the expander for a node. The expanded is in the childContainerRoot which in
                    // turn is in the nodes root container that has all its data
                    let node = angular.element(e.target);
                    let data = findTreeNode(node);
                    if (_.isObject(data.nodeValue)) {
                        ctrl.toggleNode(data);
                    }

                }


            }

        });

})();