import { TestBed, inject, __core_private_testing_placeholder__ } from '@angular/core/testing';
import { has } from 'lodash';
import { Parser, JsonNode, JsonNodeType, JsonValueNode } from './parser';

fdescribe('Parser', () => {

    let parser: Parser;

    beforeEach(() => {
        parser = new Parser(null, true, false);

    });

    it('should parse an object', () => {
        const rootNode = parser.parse(`{"key1": "b", "key2":"c", "key3":null,"key4":true,"key5":false,"key6":-100.58,"key7":{"key8": null}}`);
        
        const nodeList = parser.allNodes;

        expect(nodeList[0]).toBe(rootNode);
        expect(rootNode.type).toBe(JsonNodeType.Object);
        expect(rootNode.start).toBe(0);
        expect(rootNode.end).toBe(99);
        expect(rootNode.previousNode).toBeNull();
        expect(rootNode.data).toBeDefined();
        expect(has(rootNode.data, 'key1')).toBeTruthy();
        expect(has(rootNode.data, 'key2')).toBeTruthy();
        expect(has(rootNode.data, 'key3')).toBeTruthy();
        expect(has(rootNode.data, 'key4')).toBeTruthy();
        expect(has(rootNode.data, 'key5')).toBeTruthy();
        expect(has(rootNode.data, 'key6')).toBeTruthy();

        // check for object key1
        expectNode(nodeList[1], JsonNodeType.Key, rootNode, `"key1"`, nodeList[2]);
        expectNode(nodeList[2], JsonNodeType.Value, nodeList[1], `"b"`, 'b');

        // check for object key2
        expectNode(nodeList[3], JsonNodeType.Key, rootNode, `"key2"`, nodeList[4]);
        expectNode(nodeList[4], JsonNodeType.Value, nodeList[3], `"c"`, 'c');

        // check for object key3
        expectNode(nodeList[5], JsonNodeType.Key, rootNode, `"key3"`, nodeList[6]);
        expectNode(nodeList[6], JsonNodeType.Value, nodeList[5], `null`, null);

        // check for object key4
        expectNode(nodeList[7], JsonNodeType.Key, rootNode, `"key4"`, nodeList[8]);
        expectNode(nodeList[8], JsonNodeType.Value, nodeList[7], `true`, true);

        // check for object key5
        expectNode(nodeList[9], JsonNodeType.Key, rootNode, `"key5"`, nodeList[10]);
        expectNode(nodeList[10], JsonNodeType.Value, nodeList[9], `false`, false);

        // check for object key6
        expectNode(nodeList[11], JsonNodeType.Key, rootNode, `"key6"`, nodeList[12]);
        expectNode(nodeList[12], JsonNodeType.Value, nodeList[11], `-100.58`, -100.58);

        // check for object key6
        expectNode(nodeList[13], JsonNodeType.Key, rootNode, `"key7"`, nodeList[14]);
        expectNode(nodeList[14], JsonNodeType.Object, nodeList[13], `{"key8": null}`);

        // expectNode(nodeList[13], JsonNodeType.Key, rootNode, `"key7"`, nodeList[14]);
        // expectNode(nodeList[14], JsonNodeType.Object, nodeList[13], `{"key8", null}`);
    });

    it('Should parse and array with values', () => {
        const rootNode = parser.parse(`["a" ,null, true,false,-100.58,{"key1" :true}, [], [1], 1]`);
        const nodeList = parser.allNodes;

        expect(nodeList[0]).toBe(rootNode);
        expect(rootNode.type).toBe(JsonNodeType.Array);
        expect(rootNode.start).toBe(0);
        expect(rootNode.end).toBe(57);
        expect(rootNode.previousNode).toBeNull();
        expect(rootNode.data).toBeDefined();
        expect(Array.isArray(rootNode.data)).toBeTruthy();

        // Check values
        expectNode(nodeList[1], JsonNodeType.Value, rootNode, `"a"`, 'a');
        expectNode(nodeList[2], JsonNodeType.Value, rootNode, `null`, null);
        expectNode(nodeList[3], JsonNodeType.Value, rootNode, `true`, true);
        expectNode(nodeList[4], JsonNodeType.Value, rootNode, `false`, false);
        expectNode(nodeList[5], JsonNodeType.Value, rootNode, `-100.58`, -100.58);

        // validate embedded object
        expectNode(nodeList[6], JsonNodeType.Object, rootNode, `{"key1" :true}`);
        expectNode(nodeList[7], JsonNodeType.Key, nodeList[6], `"key1"`, nodeList[8]);
        expectNode(nodeList[8], JsonNodeType.Value, nodeList[7], `true`, true);

        // validate embedded arrays
        expectNode(nodeList[9], JsonNodeType.Array, rootNode, `[]`);
        expectNode(nodeList[10], JsonNodeType.Array, rootNode, `[1]`);
        expectNode(nodeList[11], JsonNodeType.Value, nodeList[10], `1`, 1);
    });

    it('Should parse and object ignoring whitespace', () => {
        const rootNode = parser.parse(`    { "key1"   : "b"   , "key2"    :   "c"  ,  `
                  + `"key3"  :  null  ,  "key4"  :  true  ,  "key5"  :  false  ,  "key6"   :   -100.58  }    `);
        const nodeList = parser.allNodes;

        expect(nodeList[0]).toBe(rootNode);
        expect(rootNode.type).toBe(JsonNodeType.Object);
        expect(rootNode.start).toBe(4);
        expect(rootNode.end).toBe(130);
        expect(rootNode.previousNode).toBeNull();
        expect(rootNode.data).toBeDefined();
        expect(has(rootNode.data, 'key1')).toBeTruthy();
        expect(has(rootNode.data, 'key2')).toBeTruthy();

        // check for object key1
        expectNode(nodeList[1], JsonNodeType.Key, rootNode, `"key1"`, nodeList[2]);
        expectNode(nodeList[2], JsonNodeType.Value, nodeList[1], `"b"`, 'b');

        // check for object key2
        expectNode(nodeList[3], JsonNodeType.Key, rootNode, `"key2"`, nodeList[4]);
        expectNode(nodeList[4], JsonNodeType.Value, nodeList[3], `"c"`, 'c');

        // check for object key3
        expectNode(nodeList[5], JsonNodeType.Key, rootNode, `"key3"`, nodeList[6]);
        expectNode(nodeList[6], JsonNodeType.Value, nodeList[5], `null`, null);

        // check for object key4
        expectNode(nodeList[7], JsonNodeType.Key, rootNode, `"key4"`, nodeList[8]);
        expectNode(nodeList[8], JsonNodeType.Value, nodeList[7], `true`, true);

        // check for object key5
        expectNode(nodeList[9], JsonNodeType.Key, rootNode, `"key5"`, nodeList[10]);
        expectNode(nodeList[10], JsonNodeType.Value, nodeList[9], `false`, false);

        // check for object key6
        expectNode(nodeList[11], JsonNodeType.Key, rootNode, `"key6"`, nodeList[12]);
        expectNode(nodeList[12], JsonNodeType.Value, nodeList[11], `-100.58`, -100.58);
    });

    it('Should find the end of a string considering escaped "', () => {
        // test use a / instead of \ so the test strings a readable. These are replaced by \ for test execution
        expect(parser.findStringEnd(makeJson(` "            "`), 1)).toBe(14);
        expect(parser.findStringEnd(makeJson(` "   /"/"     "`), 1)).toBe(14);
        expect(parser.findStringEnd(makeJson(` "   ///"   //"`), 1)).toBe(14);
        expect(parser.findStringEnd(makeJson(` " /////" ////"`), 1)).toBe(14);
        expect(parser.findStringEnd(makeJson(` "  ///"/"/"/""`), 1)).toBe(14);
    });

    it('Should return -1 if the string is never closed', () => {
        // test use a / instead of \ so the test strings a readable. These are replaced by \ for test execution
        expect(parser.findStringEnd(makeJson(` "            `), 1)).toBe(-1);
        expect(parser.findStringEnd(makeJson(` "   ///"    /"`), 1)).toBe(-1);
    });

    it('Should parse a number with decimals', () => {
        expect(parser.findNumberEnd(makeJson(`  12.3g`), 2)).toBe(-1);  // invalid char after number causes a mismatch

        expect(parser.findNumberEnd(makeJson(`  12.3`), 2)).toBe(5);    // match at the end of a string
        expect(parser.findNumberEnd(makeJson(`  12.3]`), 2)).toBe(5);   // match in object
        expect(parser.findNumberEnd(makeJson(`  12.3}`), 2)).toBe(5);   // match in array
        expect(parser.findNumberEnd(makeJson(`  12.3,`), 2)).toBe(5);   // match followed by another element
        expect(parser.findNumberEnd(makeJson(`  12.3\n`), 2)).toBe(5);   // match followed by new line
        expect(parser.findNumberEnd(makeJson(`  12.3\t`), 2)).toBe(5);   // match followed by tab
        expect(parser.findNumberEnd(makeJson(`  12.3\r`), 2)).toBe(5);   // match followed by carriage return

        expect(parser.findNumberEnd(makeJson(`   12.3e10    `), 3)).toBe(9);
        expect(parser.findNumberEnd(makeJson(`  12.3e-10    `), 2)).toBe(9);

        expect(parser.findNumberEnd(makeJson(`  123     `), 2)).toBe(4);
        expect(parser.findNumberEnd(makeJson(` -123     `), 2)).toBe(4);

        // ignore trailing digits
        expect(parser.findNumberEnd(makeJson(`  123 2   `), 2)).toBe(4);
        expect(parser.findNumberEnd(makeJson(`  123  2  `), 2)).toBe(4);
    });


    it('should convert a JsonNode to a JS representation', () => {
        const root = parser.parse(`{"a": "100", "b": 200, "c" : [{"d": 10}, 10, null, false, true]}`);
        const jsObj = root.toJS();
        expect(jsObj).toEqual({
            a: '100',
            b: 200,
            c: [
                {d: 10},
                10,
                null,
                false,
                true
            ]
        });
    }); 

    /**
     * Validate that a node matches all the expectations of the test
     * @param actual json node we that we are testing
     * @param expType expected type fro the node
     * @param expParent expected parent node
     * @param expSrc expected source text for the node
     * @param expData expected data value for the node
     */
    function expectNode(actual: JsonNode, expType: JsonNodeType, expParent: JsonNode, expSrc: string, expData?: any) {
        expect(actual.type).toBe(expType);
        expect(actual.previousNode).toBe(expParent);
        expect(actual.getSourceText()).toBe(expSrc);
        if (expData) {
            if (actual instanceof JsonValueNode) {
                expect(actual.getValue()).toBe(expData);
            } else {
                expect(actual.data).toBe(expData);
            }
        }
    }
        
    /**
     * 
     * @param text json string with / that must be replaced with \
     */
    function makeJson(text: string): string {
        return text.replace(/\//g, '\\');
    }
})