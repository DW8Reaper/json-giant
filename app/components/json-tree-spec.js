/**
 * Created by dewildt on 2/16/17.
 */
describe('JSON Tree control', function () {
    'use strict';

    let errorCnt = 0;
    let rootElement = angular.element('<div></div>');

    let controller = null;
    let scope = null;

    let electronService = {
        local: 'its me'
    };
    let jsonpathService = {
        query : function (object, path) {
        }
    }

    let delegate = {
        error: null,
        nodePath: null,
        errorMessage : function (e) {delegate.error = e;},
        reset: function () {
            delegate.error = null;
            delegate.nodePath = null;
        },
        nodeMouseOver: function(path) {
            delegate.nodePath = path;
        },
        nodeMouseOut: function (path) {
            delegate.nodePath = path;
        },
        nodeClicked: function (path) {
            delegate.nodePath = path;
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
        spyOn(delegate, 'errorMessage').and.callThrough();
        spyOn(delegate, 'nodeMouseOver').and.callThrough();
        spyOn(delegate, 'nodeMouseOut').and.callThrough();
        spyOn(delegate, 'nodeClicked').and.callThrough();

        controller = $componentController('jsonTree', {
                //$scope: scope,
                $element: rootElement,
                electron: electronService,
                jsonpath: jsonpathService
            },
            {
            jsonContent: {
                a : {
                    a1: "a-text-1",
                    a2: "a-text-2",
                    a3: [
                        "a-val-1",
                        "a-val-2",
                        "a-val-3"
                    ],
                    a4: "a-text-4",
                    a5: "a-text-5"
                },
                b : 200,
                c : 300.
            },
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
        spyOn(jsonpathService, 'query').and.returnValue(null);

        try {
            controller.jsonFilter = null;
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(jsonpathService.query).not.toHaveBeenCalled();

    });

    it('does not apply an empty filter', function () {
        spyOn(jsonpathService, 'query').and.returnValue(null);

        try {
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(jsonpathService.query).not.toHaveBeenCalled();

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
        spyOn(jsonpathService, 'query').and.returnValue(null);

        try {
            controller.jsonFilter = "some filter";
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(jsonpathService.query).toHaveBeenCalled();
        expect(angular.element('.tree-node', rootElement).length).toEqual(0);

    });

    it('builds and displays only the root nodes for the provided json', function () {
        controller.$onChanges();
        expect(angular.element('.tree-node', rootElement).length).toEqual(3);

    });

    it('Reports error messages for invalid filters', function() {

        spyOn(jsonpathService, 'query').and.throwError("the error");

        try {
            controller.jsonFilter = "some invalid filter";
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }

        expect(delegate.errorMessage).toHaveBeenCalled();
        expect(delegate.error.message).toEqual("the error");
        expect(jsonpathService.query).toHaveBeenCalled();
    });

    it('Raises an exception for invalid filters if no handler was provided', function() {

        spyOn(jsonpathService, 'query').and.throwError("the error");

        try {
            controller.onError = null;
            controller.jsonFilter = "some invalid filter";
            controller.$onChanges();
        } catch (e) {
            errorCnt++;
        }
        expect(jsonpathService.query).toHaveBeenCalled();
        expect(errorCnt).toEqual(1);
        errorCnt = 0;
    });

    it('Expanded nodes with children', function () {
        controller.$onChanges();

        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');
        expect(angular.element('.tree-node', rootElement).length).toEqual(8);
    });

    it('Limits the displayed children when there are too many', function () {
        // limit to max 3 nodes and draw
        controller.maxNodes = 3;
        controller.$onChanges();

        // expand and make sure only the first 3 children are shown
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');
        expect(angular.element('.tree-node', rootElement).length).toEqual(6);

    });

    it('Provided a link to show more children when they have been limited', function(){
        // limit to max 3 nodes and draw
        controller.maxNodes = 3;
        controller.$onChanges();

        // make sure there are no exanders when we start our
        expect(angular.element('div.tree-node-show-more:visible', rootElement).length).toEqual(0);

        // expand and make sure only the first 3 children are shown
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');
        angular.element('div.tree-node-show-more:visible', rootElement).trigger('click');
        expect(angular.element('.tree-node', rootElement).length).toEqual(8);
    });

    it('Expands and collapses nodes with children', function () {
        controller.$onChanges();

        // Start with 3 elements
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(3);

        // expand node "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(8);

        // collapse node "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(3);

        // expand node "a" again
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');
        expect(angular.element('.tree-node:visible', rootElement).length).toEqual(8);

    });

    it('Sends enter and leave events for interacting with nodes', function () {

        controller.$onChanges();

        // skip root node go to first child "a"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('mouseover');
        expect(delegate.nodeMouseOver).toHaveBeenCalled();
        expect(delegate.nodePath).toEqual(["a"]);

        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('mouseout');
        expect(delegate.nodeMouseOut).toHaveBeenCalled();
        expect(delegate.nodePath).toEqual(["a"]);

        // expand "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');

        // check child paths for "a"->"a3"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(4).trigger('mouseover');
        expect(delegate.nodeMouseOver).toHaveBeenCalled();
        expect(delegate.nodePath).toEqual(["a", "a3"]);

        // expand "a3"
        angular.element('div:nth-child(3) div.tree-node-expander', rootElement).trigger('click');

        // check child paths for "a"->"a3"[2]
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(7).trigger('mouseover');
        expect(delegate.nodeMouseOver).toHaveBeenCalled();
        expect(delegate.nodePath).toEqual(["a", "a3", 2]);
    });

    it('Sends click events when a node is clicked', function () {

        controller.$onChanges();

        // expand "a"
        angular.element('div:nth-child(1) div.tree-node-expander', rootElement).trigger('click');

        // skip root node go to first child "a"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(1).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalled();
        expect(delegate.nodePath).toEqual(["a"]);

        // check child paths for "a"->"a3"
        delegate.reset();
        angular.element('div.tree div.tree-node-main', rootElement).eq(4).trigger('click');
        expect(delegate.nodeClicked).toHaveBeenCalled();
        expect(delegate.nodePath).toEqual(["a", "a3"]);

    });

});