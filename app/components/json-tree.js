(function () {
    "use strict";

    angular.module('jsonGiant')
        .component('jsonTree', {
            template: '<div class="tree tree-root tree-node"></div>',
            bindings: {
                jsonContent: '<',
                maxNodes: '<',
                jsonFilter: '<',
                selectedPath: '<',
                onError: '&',
                onNodeMouseOver: '&',
                onNodeMouseOut: '&',
                onNodeClick: '&',
                onCreated: '&'
            },
            controller: function ($element, jsonpath) {
                const ctrl = this;
                ctrl.basePath = [];

                let selectedNode;
                let jsonData;  // the effective json we are displaying (after filters if any)
                let rootPaths = [];
                let isFiltered = false;

                function jsonItemFound(value, type, details, d) {
                    rootPaths.push(details.path);
                }

                ctrl.$onInit = function () {
                    if (_.isFunction(ctrl.onCreated)) {
                        ctrl.onCreated({$event: {controller: ctrl}});
                    }
                };

                ctrl.$onChanges = function (changes) {
                    // rebuild the whole tree if needed
                    if (_.has(changes, 'jsonFilter') || _.has(changes, 'jsonContent')) {
                        $element.empty();
                        rootPaths = [];
                        jsonData = ctrl.jsonContent;
                        isFiltered = false;

                        if (_.isString(ctrl.jsonFilter) && ctrl.jsonFilter.length > 0) {
                            try {

                                jsonData = jsonpath({
                                    path: ctrl.jsonFilter,
                                    json: ctrl.jsonContent,
                                    wrap: true,
                                    //preventEval: true,
                                    callback: jsonItemFound
                                });
                                isFiltered = true;
                            } catch (e) {
                                if (_.isFunction(ctrl.onError)) {
                                    ctrl.onError({"$event": e});
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
                    }

                    if (_.has(changes, 'selectedPath')) {
                        // Deselect previous
                        if (selectedNode) {
                            selectedNode.container.removeClass('selected');
                            selectedNode.container.addClass('normal');
                            selectedNode = null;
                        }
                        let item = ctrl.findNodeAtPath(ctrl.selectedPath);
                        if (item) {
                            selectedNode = item.node;
                            selectedNode.container.addClass('selected');
                            selectedNode.container.removeClass('normal');
                        }
                    }
                };

                ctrl.findNodeAtPath = function (path) {
                    if (!ctrl.treeRoot || !_.isString(path)) {
                        return null;
                    }

                    let items = path.substring(1).split(']');
                    items = items.map(it => it.substring(1));
                    items.pop();
                    let currentParent = null;
                    let current = ctrl.treeRoot;
                    let currentIndex = -1;
                    _.forEach(items, (item) => {
                        currentIndex = _.findIndex(current.children, (child) => {
                            if (child.isInArray) {
                                return child.name == item;
                            } else {
                                return ("'" + child.name + "'") === item;
                            }
                        });
                        if (currentIndex >= 0) {
                            currentParent = current;
                            current = current.children[currentIndex];
                        }
                    });

                    if (currentIndex >= 0) {
                        return {
                            node: current,
                            parent: currentParent,
                            foundAtIndex: currentIndex  // index in parents children array
                        }
                    } else {
                        return null;
                    }
                };

                ctrl.deleteNode = function (path) {

                    let item = ctrl.findNodeAtPath(path);
                    if (item) {
                        item.parent.children.splice(item.foundAtIndex, 1);
                        item.node.container.remove();

                        // update siblings
                        if (item.node.isInArray) {
                            for (let i = item.foundAtIndex; i < item.parent.children.length; i++) {
                                let child = item.parent.children[i];
                                child.index--;
                                child.name = child.index;
                                child.childNameContainer.empty();
                                child.childNameContainer.append(child.name);
                                child.container.data(child);
                            }
                        }
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

                        let child = angular.element('<div class="tree tree-node normal"></div>');
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
                    let isInArray = false;
                    let childNameContainer;

                    if (parent && _.isArray(parent.nodeValue)) {
                        displayName = name;
                        childIndexInParent = _.toInteger(name);
                        isInArray = true;
                    }

                    if (_.isArray(value)) {
                        opener = "[ ";
                        closer = " ]";
                        childContainer = angular.element('<div class="tree"></div>');
                    } else if (_.isObject(value)) {
                        opener = "{ ";
                        closer = " }";
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

                    if (childContainer) {
                        childContainer.addClass((!parent) ? 'tree-root-child-container' : 'tree-node-child-container');
                    }

                    // add container for node name and value for processing node events
                    let childDataContainer = angular.element('<div class="tree tree-node-main"></div>');
                    childRoot.append(childDataContainer);
                    childDataContainer.on('mouseover', nodeMouseOver);
                    childDataContainer.on('mouseout', nodeMouseOut);
                    childDataContainer.on('click', nodeClick);

                    // Create intro
                    if (name !== null) {
                        if (childContainer) {
                            expander = angular.element('<div class="tree tree-node-expander tree-node-expander-expand"></div>');
                            expander.insertBefore(childDataContainer);
                        }
                        childNameContainer = angular.element('<span class="tree-node-name"></span>');
                        childNameContainer.append(displayName);
                        childDataContainer.append(childNameContainer);
                        childDataContainer.append(' : ');
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
                        isInArray: isInArray,
                        index: childIndexInParent,
                        nodeValue: value,
                        container: container,
                        childContainerRoot: childRoot,
                        childContainer: childContainer,
                        childNameContainer: childNameContainer,
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

                function isRootObject(value) {
                    return value.parent == null;
                }

                function buildNodePath(node) {
                    let path = "";
                    let pathStart = null;
                    let currentNode = node;
                    let lastNode = currentNode;


                    while (currentNode && currentNode.parent) {
                        // filtered trees have a wrapper around that is not part of the path
                        lastNode = currentNode;  // last path

                        let part = "";
                        if (currentNode.index >= 0) {
                            //array element
                            part = '[' + currentNode.index.toString() + ']';
                        } else {
                            part = '[\'' + currentNode.name.toString() + '\']';
                        }

                        if (isFiltered && isRootObject(currentNode.parent)) {
                            // store the starting object in the path separately so we can make relative paths
                            pathStart = part;
                        } else {
                            path = part + path;
                        }

                        currentNode = currentNode.parent;
                    }

                    // get root path
                    var filteredPath = null;
                    if (!isFiltered) {
                        path = '$' + path;
                    } else {
                        filteredPath = '$' + pathStart + path;  // full path in filtered result
                        for (let i = 0; i < rootPaths.length; i++) {
                            if (jsonData[i] === lastNode.nodeValue) {
                                path = rootPaths[i] + path;
                                break;
                            }
                        }
                    }

                    return {path: path, filteredPath: filteredPath};
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
                        let value;
                        if (_.isArray(data.parent.nodeValue)) {
                            value = data.nodeValue;
                        } else {
                            value = {};
                            value[data.name] = data.nodeValue;
                        }

                        event({"$event": {path: buildNodePath(data), node: value}});
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