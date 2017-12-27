import { isNumber, isUndefined } from 'lodash';

/**
 * Enumeration of the valid states the parser can be in
 */
enum State {
    Start = 'start',
    Object = 'object',
    Array = 'array',
    Value = 'value',
    Key = 'key'
}

/**
 * Enum of types that are permitted for a json node created by the parser
 */
export enum JsonNodeType {
    Value = 'value',
    Array = 'array',
    Object = 'object',
    Key = 'key'
}

/**
 * Enumeration of the valid data types that a value node can hold. Object and Array are not included
 * as they are independent types not stored inside a value node
 */
export enum DataType {
    Number,
    Null,
    Boolean,
    String
}

/**
 * JsonNode base class to represent all the details of a node in the JSON document that was parsed
 */
export abstract class JsonNode {
    public id: number;
    public type: JsonNodeType;
    public previousNode: JsonNode;
    public start: number;
    public end: number;
    public data: any;
    public userData: any;
    public expanded: boolean = false;
    public readonly sourceData: string;

    public constructor(id: number, sourceData: string, type: JsonNodeType, start: number, end: number = -1) {
        this.id = id;
        this.sourceData = sourceData;
        this.type = type;
        this.start = start;
        this.end = end;
        this.previousNode = null;
    }

    public abstract get hasChildren();

    public get name(): string {
        return this.getSourceText();
    }

    public getSourceText(): string {
        return this.sourceData.substring(this.start, this.end + 1);
    }

    public getPath(humanReadable: boolean = false): string {
        if (this.previousNode) {
            switch (this.previousNode.type) {
                case JsonNodeType.Array:
                    return this.previousNode.getPath(humanReadable) + '[' + this.previousNode.data.indexOf(this) + ']';
                default:
                    return this.previousNode.getPath(humanReadable);
            }
        } else {
            return '$';
        }
    }
}


export class JsonObjectNode extends JsonNode {
    public constructor(id: number, sourceData: string, start: number, end: number = -1) {
        super(id, sourceData, JsonNodeType.Object, start, end);
        this.data = {};
    }

    public get hasChildren() {
        return true;
    }
    public get name(): string {
        const prefix = (this.previousNode instanceof JsonKeyNode) ? `${this.previousNode.name} : ` : '';
        return prefix + '{';
    }    
}
export class JsonArrayNode extends JsonNode {
    public constructor(id: number, sourceData: string, start: number, end: number = -1) {
        super(id, sourceData, JsonNodeType.Array, start, end);
        this.data = [];
    }

    public get hasChildren() {
        return true;
    }  
    public get name(): string {
        const prefix = (this.previousNode instanceof JsonKeyNode) ? `${this.previousNode.key} : ` : '';
        return prefix + '[';
    }    
}

export class JsonKeyNode extends JsonNode {
    public readonly key: string;
    
    public constructor(id: number, sourceData: string, start: number, end: number = -1, key: string) {
        super(id, sourceData, JsonNodeType.Key, start, end);
        this.key = key;
    }

    public getPath(humanReadable: boolean): string {
        if (!this.previousNode){
            return '';  // a key must alway have a parent so there can be no path to a key without a parent
        } else if (humanReadable && /^\w+[\d\w_]*$/.test(this.key)) {
            return this.previousNode.getPath(humanReadable) + '.' + this.key;
        } else {
            return this.previousNode.getPath(humanReadable) + "['" + this.key + "']";
        }        
    }

    public get hasChildren() {
        return false;
    }    
    
}

export class JsonValueNode extends JsonNode {
    private value: any;

    public constructor(id: number, sourceData: string, start: number, end: number = -1, value?: any) {
        super(id, sourceData, JsonNodeType.Value, start, end);
        this.value = value;
    }

    public getValue() {
        if (isUndefined(this.value)) {
            this.value = JSON.parse(this.getSourceText());
        }
        return this.value;
    }

    public get hasChildren() {
        return false;
    }    

    public get name(): string {
        if (this.previousNode instanceof JsonKeyNode) {
            return this.previousNode.key + ' : ' + this.getSourceText();
        } else {
            return this.getSourceText();
        }
    }      
}

/**
 * Interface to receive events during parsing
 */
export interface ParserEvents {
    onValue(type: DataType, start: number, end: number);
    onKey(key: any, start: number, end: number);
    onOpenObject(start: number);
    onCloseObject(end: number);
    onOpenArray(start: number);
    onCloseArray(end: number);
}

/**
 * Class to implement a Json parser that provides additional details about each node parse like the location in the original file
 * and the JSON path to access the node
 */
export class Parser {

    private static numberMatcher = RegExp(/^(?:-?(?:0\.\d+|[1-9]\d*(?:\.\d+)?)(?:e[\-+]{0,1}\d+){0,1})(?=,|\}|\]|\s|$)/);

    public allNodes: Array<JsonNode>;

    private eventCallback: ParserEvents;
    private states: Array<State>;
    private debug: boolean;
    private collectNodes = false;
    private active: JsonNode;
    private root: JsonNode;
    private nextId: number = 1;


    public constructor(eventCallback?: ParserEvents, collectNodes: boolean = false, debug: boolean = false) {
        this.eventCallback = eventCallback;
        this.debug = debug;
        this.collectNodes = collectNodes;
    }

    private reset() {
        this.states = new Array<State>();
        this.root = null;
        this.active = null;
        this.nextId = 1;
        if (this.collectNodes) {
            this.allNodes = new Array<JsonNode>();
        }
    }


    private pushState(newState: State) {
        this.states.push(newState);
        return newState;
    }

    private popState(restoreOnParent?: State) {
        this.states.pop();
        return this.states[this.states.length - 1];
    }

    private logDebug(sourceText: string, name: string, start: number, end: number, isEndMessage: boolean = false) {
        if (!isEndMessage) {
            console.log(``.padEnd(65, ' ') + ` new states: [${this.states}]`);
        } else {
            console.log(`${name}:`.padEnd(15, ' ') +
                ` >>${sourceText.substring(start, end + 1)}<<`.padEnd(50, ' ') +
                ` states: [${this.states}]`);
        }
    }

    private parseFixedValue(currentState: State, source: string, index: number, 
                            dataType: DataType, expected: string, value: any) : [State, number] {
        if (currentState === State.Value) {
            if (source.substr(index, expected.length) === expected) {
                let end = index + expected.length - 1;
                if (this.debug) {
                    this.logDebug(source, expected, index, end);
                }
                // matched so pop the current state this value completes it
                const newState = this.popState();
                if (this.debug) {
                    this.logDebug(source, expected, index, end, true);
                }

                this.onValue(source, dataType, index, end, value);
                return [newState, end];
            } else {
                throw new Error(`Unexpected value found, expected "${expected}" but found "${source.substr(index, expected.length)}" ` +
                                `at index ${index} in state "${currentState}".` );
            }
        } else {
            throw new Error(`Unexpected value, cannot have "${expected}" in state "${currentState}" at index ${index}.`);
        }
    }

    public parse(src: string): JsonNode {

        let char = null;
        let index = 0;
        let state: State;

        this.reset();
        state = this.pushState(State.Start);

        while (index < src.length) {
            char = src.charAt(index);
            switch (char) {
                case '{':
                    if (state === State.Start || state === State.Value) {
                        if (this.debug) {
                            this.logDebug(src, 'object start', index, 1);
                        }
                        this.onOpenObject(src, index);
                        this.popState();
                        this.pushState(State.Object);
                        state = this.pushState(State.Key);
                        if (this.debug) {
                            this.logDebug(src, 'object start', index, 1);
                        }
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                                    ` An object can only be opened at the start of a json string or as a value`);
                    }
                    break;
                case '}':
                    // if the current state is key pop and see if we are in an object
                    if (state === State.Key) {
                        state = this.popState();
                        if (state !== State.Object) {
                            state = this.pushState(State.Key);
                            throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                                ` There are no open objects to close.`);
                        }
                    }

                    if (state === State.Object) {
                        if (this.debug) {
                            this.logDebug(src, 'object end', index, 1)
                        }
                        this.onCloseObject(index);
                        state = this.popState();
                        if (this.debug) {
                            this.logDebug(src, 'object end', index, 1, true)
                        }
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                            ` There are no open objects to close.`);
                    }
                    break;
                case '[':
                    if (state === State.Start || state === State.Value) {
                        if (this.debug) {
                            this.logDebug(src, 'array start', index, 1)
                        }
                        this.onOpenArray(src, index);
                        this.popState();
                        this.pushState(State.Array);
                        state = this.pushState(State.Value);  //Expect to get a value in this array
                        if (this.debug) {
                            this.logDebug(src, 'object end', index, 1, true)
                        }
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                            `  An array can only be opened at the start of a json string or as a value`);
                    }
                    break;
                case ']':
                    // if the current state is key pop and see if we are in an array
                    if (state === State.Value) {
                        state = this.popState();
                        if (state !== State.Array) {
                            state = this.pushState(State.Value);
                            throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                                ` There are no open arrays to close.`);
                        }
                    }

                    if (state === State.Array) {
                        if (this.debug) {
                            this.logDebug(src, 'array end', index, 1);
                        }
                        this.onCloseArray(index);
                        state = this.popState();
                        if (this.debug) {
                            this.logDebug(src, 'array end', index, 1, true);
                        }
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                            ` There are no open arrays to close.`);
                    }
                    break;
                case '"':
                    if (state === State.Key) {
                        const end = this.findStringEnd(src, index);
                        if (this.debug) {
                            this.logDebug(src, 'key', index, end);
                        }
                        this.onKey(src, JSON.parse(src.substring(index, end + 1)), index, end);
                        if (this.debug) {
                            this.logDebug(src, 'key', index, end, true);
                        }
                        index = end;
                    } else if (state === State.Value || state === State.Start) {
                        const end = this.findStringEnd(src, index);
                        if (this.debug) {
                            this.logDebug(src, 'value', index, end);
                        }
                        this.onValue(src, DataType.String, index, end);
                        state = this.popState();
                        if (this.debug) {
                            this.logDebug(src, 'value', index, end);
                        }
                        index = end;
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                            ` Cannot start a string here.`);
                    }
                    break;
                case 'n':
                    [state, index] = this.parseFixedValue(state, src, index, DataType.Null, 'null', null);
                    break;
                case 't':
                    [ state, index ] = this.parseFixedValue(state, src, index, DataType.Boolean, 'true', true);
                    break;
                case 'f':
                    [state, index] = this.parseFixedValue(state, src, index, DataType.Boolean, 'false', false);
                    break;
                case ':':
                    if (state === State.Key) {
                        this.popState();
                        state = this.pushState(State.Value);
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                            ` A : can only be placed after a key name in an object`);
                    }
                    break;
                case ',':
                    if (state === State.Array) {
                        state = this.pushState(State.Value);
                    } else if (state === State.Object) {
                        state = this.pushState(State.Key)
                    } else {
                        throw new Error(`Invalid state "${state}", found "${char}" at index ${index}.` +
                            ` A , can only be placed after a value in an array or and object`);
                    }
                    break;
                default:
                    if ('-0123456789'.indexOf(char) !== -1) {
                        if (state === State.Value) {
                            let end = this.findNumberEnd(src, index);
                            if (end !== -1) {
                                if (this.debug) {
                                    this.logDebug(src, 'number', index, end);
                                }
                                this.onValue(src, DataType.Number, index, end);
                                // pop value state, if we are in an array though expect another value
                                state = this.popState();
                                if (this.debug) {
                                    this.logDebug(src, 'number', index, end, true);
                                }
                                index = end;
                            } else {
                                throw new Error(`Invalid numberic value found at index ${index}.`);
                            }
                        }
                    } else if (char === '\n' || char === '\r' || char === '\t' || char === ' ') {
                        // nothing to do just skipping whitespace
                    } else {
                        throw new Error(`Unexpected character "${char}" found at index ${index}. ` +
                                        `This character cannot appear in state "${state}"`);
                    }
                    break;
            }
            index++;
        }

        if (this.states.length) {
            throw new Error(`Unexpected end of json data at index ${index} in state "${state}". ` +
                  `The following states remain to be completed: [${this.states}]`);
        }

        return this.root;
    }

    public findNumberEnd(text: string, numberStart: number) {
        const match = Parser.numberMatcher.exec(text.substr(numberStart));
        if (match) {
            return numberStart + match[0].length - 1;
        } else {
            return -1;
        }
    }

    public findStringEnd(text: string, stringStart: number) {
        const foundIndex = text.indexOf('"', stringStart + 1);
        if (foundIndex === -1) {
            return foundIndex; // invalid string could not find a closing "
        }

        // Check if this string is escaped
        let i = foundIndex;
        let escapes = 0;
        while (text.charAt(--i) === '\\') {
            escapes++;
        }

        if ((escapes % 2)) {
            // found uneven preceding \ so this is an escaped "
            return this.findStringEnd(text, foundIndex);
        } else {
            // no backslash or backslash was and escaped backslash
            return foundIndex;
        }
    }

    private pushActive(newNode: JsonNode) {
        if (this.active) {
            newNode.previousNode = this.active;
        } else {
            newNode.previousNode = null;
        }
        this.active = newNode;
        if (!this.root) {
            this.root = this.active;
        }
    }
    private popActive() {
        this.active = this.active.previousNode;
    }

    private setValue(value: JsonNode) {
        if (this.active) {
            value.previousNode = this.active;
            switch (this.active.type) {
                case JsonNodeType.Key:
                    this.active.data = value;
                    this.popActive();
                    break;
                case JsonNodeType.Array:
                    if (Array.isArray(this.active.data)) {
                        (<JsonNode[]>this.active.data).push(value);
                    }
                    break;
                default:
                    console.log(`cannot set value invalid active object type: ${this.active.type}`);
            }
        }
    }

    private onValue(sourceData: string, type: DataType, start: number, end: number, parsedValue?: any) {
        // got some value.  v is the value. can be string, double, bool, or null.
        const newValue = new JsonValueNode(this.nextId++, sourceData, start, end, parsedValue);
        this.collectNode(newValue);        
        this.setValue(newValue);
        if (this.eventCallback) {
            this.eventCallback.onValue(type, start, end);
        }
    }

    private collectNode(node: JsonNode) {
        if (this.collectNodes) {
            this.allNodes.push(node);
        }
    }

    private onKey(sourceData: string, key: any, start: number, end: number) {
        const newKey = new JsonKeyNode(this.nextId++, sourceData, start, end, key);
        this.collectNode(newKey);
        if (!this.active || this.active.type !== JsonNodeType.Object) {
            console.log("invalid type for active");
        }
        this.active.data[key] = newKey;
        this.pushActive(newKey);
        if (this.eventCallback) {
            this.eventCallback.onKey(key, start, end);
        }        
    }

    private onOpenObject(sourceData: string, start: number) {
        // opened an object. key is the first key.
        // Position will be the : after the first key
        const previous = this.active;
        const node = new JsonObjectNode(this.nextId++, sourceData, start);
        this.collectNode(node);
        this.setValue(node);

        this.pushActive(node);
        node.previousNode = previous;
        if (this.eventCallback) {
            this.eventCallback.onOpenObject(start);
        }        
    }

    private onCloseObject(end: number) {
        this.active.end = end;
        this.popActive();
        if (this.active instanceof JsonKeyNode) {
            this.popActive();
        }
        if (this.eventCallback) {
            this.eventCallback.onCloseObject(end);
        }             
    }

    private onOpenArray(sourceData: string, start: number) {
        // opened an array.
        const node = new JsonArrayNode(this.nextId++, sourceData, start);
        this.collectNode(node);
        this.setValue(node);
        this.pushActive(node);
        if (this.eventCallback) {
            this.eventCallback.onOpenArray(start);
        }             
    }

    private onCloseArray(end: number) {
        // closed an array.
        this.active.end = end;
        this.popActive();
        if (this.eventCallback) {
            this.eventCallback.onCloseObject(end);
        }             
    }



}