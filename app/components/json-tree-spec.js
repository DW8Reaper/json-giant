/**
 * Created by dewildt on 2/16/17.
 */
describe('JSON Tree control', function () {
    'use strict';

    let errorCnt = 0;
    let rootElement = angular.element('<div></div>');

    let testData = {
        a : {
            child1: "a-text-1",
            child2: "a-text-2",
            child3: [
                "a-val-1",
                "a-val-2",
                "a-val-3"
            ],
            child4: "a-text-4",
            child5: "a-text-5"
        },
        b : 200,
        c : {
            child3: [
                'c-a3-1',
                'c-a3-2'
            ]
        },
    };

    let controller = null;
    let scope = null;
    let jp = {
        jsonpath : require('jsonpath-plus')
    };

    let electronService = {
        local: 'its me'
    };

    let delegate = {
        error: null,
        nodePath: null,
        filteredPath: null,
        errorMessage : function (e) {delegate.error = e;},
        reset: function () {
            delegate.error = null;
            delegate.nodePath = null;
            delegate.filterPath = null;
            delegate.nodeClicked.calls.reset();
            delegate.nodeMouseOver.calls.reset();
            delegate.nodeMouseOut.calls.reset();
        },
        nodeMouseOver: function(path) {
            delegate.nodePath = path.path;
            delegate.filteredPath = path.filteredPath;
        },
        nodeMouseOut: function (path) {
            delegate.nodePath = path.path;
            delegate.filteredPath = path.filteredPath;
        },
        nodeClicked: function (path) {
            delegate.nodePath = path.path;
            delegate.filteredPath = path.filteredPath;
        }
    }

    //****************************************************************************************************************//
    // Setup scenarios
    //****************************************************************************************************************//
    beforeEach(angular.mock.module("jsonGiant"));

    beforeEach(angular.mock.inject(function ($rootScope, $componentController, $document) {
        scope = $rootScope.$new();
        errorCnt = 0;

        $document[0].body.appendChild(rootElement[0]);

        // Set spy for delegate methods before we pass them in
        spyOn(jp, 'jsonpath').and.callThrough();
        spyOn(delegate, 'errorMessage').and.callThrough();
        spyOn(delegate, 'nodeMouseOver').and.callThrough();
        spyOn(delegate, 'nodeMouseOut').and.callThrough();
        spyOn(delegate, 'nodeClicked').and.callThrough();

        controller = $componentController('jsonTree', {
                $scope: scope,
                $element: rootElement,
                jsonpath: jp.jsonpath
            },
            {
            jsonContent: testData,
            maxNodes: 200,
            jsonFilter: "",
            onError: delegate.errorMessage,
            onNodeMouseOver: delegate.nodeMouseOver,
            onNodeMouseOut: delegate.nodeMouseOut,
            onNodeClick: delegate.nodeClicked

        });
    }));

    afterEach(function () {
        // Check for uncaught errors
        expect(errorCnt).toEqual(0);
    });

    //****************************************************************************************************************//
    // Scenarios
    //****************************************************************************************************************//
    it('does not apply a null filter', function () {

        try {
            controller.jsonFilter = null;
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(jp.jsonpath).not.toHaveBeenCalled();

    });

    it('does not apply an empty filter', function () {

        try {
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(jp.jsonpath).not.toHaveBeenCalled();

    });

    it('displays an empy view for null json', function () {


        try {
            controller.jsonContent = null;
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(angular.element('.tree-node', rootElement).length).toEqual(0);
    });


    it('displays an empy view if all nodes are filtered out', function () {

        try {
            controller.jsonFilter = "some filter";
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(jp.jsonpath).toHaveBeenCalled();
        expect(angular.element('.tree-node', rootElement).length).toEqual(0);

    });

    it('builds and displays only the root nodes for the provided json', function () {
        controller.$onChanges();
        expect(angular.element('.tree-node', rootElement).length).toEqual(3);

    });

    it('Reports error messages for invalid filters', function() {

        try {
            controller.jsonFilter = "$[?(@array)]";  // path with missing . in @array
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(delegate.errorMessage).toHaveBeenCalled();
        expect(delegate.error.message).toBeDefined();
        expect(jp.jsonpath).toHaveBeenCalled();
    });

    it('Raises an exception for invalid filters if no handler was provided', function() {

        try {
            controller.onError = null;
            controller.jsonFilter = "$[?(@array)]";
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }
        expect(jp.jsonpath).toHaveBeenCalled();
        expect(errorCnt).toEqual(1);
        errorCnt = 0;
    });

    it('Expanded nodes with children', function () {
        controller.$onChanges();

        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');
        expect(angular.element('.tree-node', rootElement).length).toEqual(8);
    });

    it('Limits the displayed children when there are too many', function () {
        // limit to max 3 nodes and draw
        controller.maxNodes = 3;
        controller.$onChanges();

        // expand and make sure only the first 3 children are shown
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');
        expect(angular.element('.tree-node', rootElement).length).toEqual(6);

    });

    it('Provided a link to show more children when they have been limited', function(){
        // limit to max 3 nodes and draw
        controller.maxNodes = 3;
        controller.$onChanges();

        // make sure there are no exanders when we start our
        expect(angular.element('div.tree-node-show-more:visible', rootElement).length).toEqual(0);

        // expand and make sure only the first 3 children are shown
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');
        angular.element('div.tree-node-show-more:visible', rootElement).trigger('click');
        expect(angular.element('.tree-node', rootElement).length).toEqual(8);
    });

    it('Expands and collapses nodes with children', function () {
        controller.$onChanges();

        // Start with 3 elements
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(3);

        // expand node "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(8);

        // collapse node "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(3);

        // expand node "a" again
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(8);

    });

    it('Sends enter and leave events for interacting with nodes', function () {

        controller.$onChanges();

        // skip root node go to first child "a"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('mouseover');
        expect(delegate.nodeMouseOver).toHaveBeenCalledWith({"$event": {path: {path: "$['a']", filteredPath: null}, node: testData.a}});

        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('mouseout');
        expect(delegate.nodeMouseOut).toHaveBeenCalledWith({"$event": {path: {path:"$['a']", filteredPath: null}, node: testData.a}});

        // expand "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');

        // check child paths for "a"->"child3"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(4).trigger('mouseover');
        expect(delegate.nodeMouseOver).toHaveBeenCalledWith({"$event": {path: {path: "$['a']['child3']", filteredPath: null}, node: testData.a.child3}});


        // expand "child3"
        angular.element('div:nth-child(3) div.tree-node-expander', rootElement).eq(0).trigger('click');

        // check child paths for "a"->"child3"[2]
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(7).trigger('mouseover');
        expect(delegate.nodeMouseOver).toHaveBeenCalledWith({"$event": {path: {path: "$['a']['child3'][2]", filteredPath: null}, node: testData.a.child3[2]}});
    });

    it('Sends click events when a node is clicked', function () {

        controller.$onChanges();

        // expand "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(0).trigger('click');

        // skip root node go to first child "a"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalledWith({"$event": {path: {path: "$['a']", filteredPath: null}, node: testData.a}});

        // check child paths for "a"->"child3"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(4).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalledWith({"$event": {path: {path: "$['a']['child3']", filteredPath: null}, node: testData.a.child3}});

    });

    it('Includes parent path if there are filters', function () {

        controller.jsonFilter= '$..child3';
        controller.$onChanges();

        // Click on each array and ensure that the path includes the parent path
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalledWith({"$event": {path: {path: "$['a']['child3']", filteredPath: "$[0]"}, node: testData.a.child3}});

        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(2).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalledWith({"$event": {path: {path: "$['c']['child3']", filteredPath: "$[1]"}, node: testData.c.child3}});

        // expand second array and validate child path
        delegate.reset();
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).eq(1).trigger('click');
        angular.element('div.tree div.tree-node-main', rootElement).eq(4).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalledWith({"$event": {path: {path: "$['c']['child3'][1]", filteredPath: "$[1][1]"}, node: testData.c.child3[1]}});
    });


    //****************************************************************************************************************//
    // Filtering scenarios
    //****************************************************************************************************************//

});