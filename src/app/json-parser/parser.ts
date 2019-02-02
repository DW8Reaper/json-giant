import { isString, isNumber, isUndefined, forOwn } from 'lodash';
import { Buffer } from 'buffer';
import { forEach } from 'lodash';
import { transition } from '@angular/animations';

const ENCODING = 'utf-8';

/**
 * Enumeration of the valid states the parser can be in
 */
enum State {
    Start = '*-start',
    End = '*-end',
    ObjectStart = '{-objectStart',
    ObjectEnd = '}-objectEnd',
    ArrayStart = '[-arrayStart',
    ArrayEnd = ']-arrayEnd',
    ValueStart = 'V-valueStart',
    ValueEnd = '*-valueEnd',
    ObjectValueStart = '*-objValueStart',
    ObjectValueEnd = '*-objValueEnd',
    ArrayFirstValueStart = '*-arrayFirstValueStart',
    ArrayValueStart = '*-arrayValueStart',
    ArrayValueEnd = '*-arrayValueEnd',
    KeyStart = '"-keyStart',
    KeyEnd = '*-keyEnd',
    Colon = ':-colon',
    ObjectComma = ',-objectComma',
    ArrayComma = ',-arrayComma'
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
    public readonly sourceBuffer: Buffer;

    public constructor(id: number, sourceBuffer: Buffer, type: JsonNodeType, start: number, end: number = -1) {
        this.id = id;
        this.sourceBuffer = sourceBuffer;
        this.type = type;
        this.start = start;
        this.end = end;
        this.previousNode = null;
    }

    public abstract toJs(): any;
    public toJsString(): string {
        return JSON.stringify(this.toJs());
    }

    public abstract get hasChildren();

    public get name(): string {
        return this.getSourceText();
    }

    public getSourceText(): string {
        return this.sourceBuffer.toString(ENCODING, this.start, this.end + 1);
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
    public constructor(id: number, sourceBuffer: Buffer, start: number, end: number = -1) {
        super(id, sourceBuffer, JsonNodeType.Object, start, end);
        this.data = {};
    }

    public toJs(): any {
        let result = {};
        forOwn(this.data, (value: JsonNode, key: string) => {
            result[key] = value.toJs();
        });
        return result;
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
    public constructor(id: number, sourceBuffer: Buffer, start: number, end: number = -1) {
        super(id, sourceBuffer, JsonNodeType.Array, start, end);
        this.data = [];
    }
    public toJs(): any {
        return this.data.map((v: JsonNode) => v.toJs());
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

    public constructor(id: number, sourceBuffer: Buffer, start: number, end: number = -1, key: string) {
        super(id, sourceBuffer, JsonNodeType.Key, start, end);
        this.key = key;
    }

    public toJs(): any {
        return this.data.toJs();
    }

    public getPath(humanReadable: boolean): string {
        if (!this.previousNode) {
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
    private valueSet: boolean = false;

    public constructor(id: number, sourceBuffer: Buffer, start: number, end: number = -1, value?: any) {
        super(id, sourceBuffer, JsonNodeType.Value, start, end);
        if (!isUndefined(value)) {
            this.valueSet = true;
            this.data = value;
        } else {
            this.valueSet = false;
        }
    }

    public getValue() {
        if (!this.valueSet) {
            this.data = JSON.parse(this.getSourceText());
        }
        return this.data;
    }
    public toJs(): any {
        return this.getValue();
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

const CODE_STRING_DELIMITER = 34;  // 34 = " 
const CODE_BACKSLASH = 92; // 92 = \

class StateTransition {
    public static readonly CODE_NO_OP = 0;
    public static readonly CODE_READ_VALUE = -1;
    public static readonly VALUE_INTRO_CODES = []

    public readonly code: number;
    public readonly state: State;
    public readonly next: Array<State>;
    public readonly nextTransitions: Array<StateTransition> = new Array<StateTransition>();
    public readonly nextCodedTransitions: Array<StateTransition> = new Array<StateTransition>();
    public readonly nextNoOpTransitions: Array<StateTransition> = new Array<StateTransition>();
    public pop: StateTransition;
    public readonly gotoNext: boolean;
    public readonly popOnCompletion: number;
    public readonly canEnd: boolean;

    private popTo: State;

    public constructor(state: State, next: Array<State>, gotoNext: boolean, popOnCompletion: number, popTo?: State) {
        this.state = state;
        this.popOnCompletion = popOnCompletion;
        if (this.state[0] == '*') {
            this.code = StateTransition.CODE_NO_OP;
        } else if (this.state[0] == 'V') {
            this.code = StateTransition.CODE_READ_VALUE;
        } else {
            this.code = this.state.charCodeAt(0);
        }
        this.next = next;
        this.gotoNext = gotoNext;

        if (this.next.indexOf(State.End) >= 0) {
            this.canEnd = true;
        } else {
            this.canEnd = false;
        }
        
        this.popTo = popTo;

        if (this.gotoNext && this.next.length !== 1) {
            throw new Error('Invalid state configuration. For states that automatically go to the next state there must be exactly 1 next state to go to');
        }        
    }

    public static isNumberIntro(charCode: number) {
        return ((charCode === 45) || (charCode >= 48 && charCode <= 57));  // any of -0123456789
    }

    public static isStringIntro(charCode: number) {
        return (charCode === CODE_STRING_DELIMITER);
    }

    public static isNullIntro(charCode: number) {
        return (charCode === 110);  // 110 = n
    }

    public static isTrueIntro(charCode: number) {
        return (charCode === 116);  // 116 = t
    }

    public static isFalseIntro(charCode: number) {
        return (charCode === 102);  // 102 = f
    }

    public isCodedTransition(): boolean {
        return (this.code !== StateTransition.CODE_NO_OP);
    }

    public isMatch(charCode: number): boolean {
        if (this.code > 0) {
            return this.code === charCode;
        } else if (this.code === StateTransition.CODE_READ_VALUE) {
            return StateTransition.isStringIntro(charCode) ||
                StateTransition.isNumberIntro(charCode) ||
                StateTransition.isTrueIntro(charCode) ||
                StateTransition.isFalseIntro(charCode) ||
                StateTransition.isNullIntro(charCode);
        }
        return false;
    }

    public stateName() {
        return this.state.substr(2);
    }

    public fillTransitions(transitions: any) {
        if (this.popTo) {
            if (transitions[this.popTo]) {
                this.pop = transitions[this.popTo];
            } else {
                throw new Error(`Unknown transition "${this.popTo}" specified as pop transition for state ${this.state}.`);
            }
        }

        for (let next of this.next) {
            if (transitions[next]) {
                this.nextTransitions.push(transitions[next]);
                if (transitions[next].isCodedTransition()) {
                    this.nextCodedTransitions.push(transitions[next]);
                } else {
                    this.nextNoOpTransitions.push(transitions[next]);
                }
            } else {
                throw new Error(`Unknown transition "${next}" specified for state ${this.state}.`);
            }
        }

    }
}
/**
 * Class to implement a Json parser that provides additional details about each node parse like the location in the original file
 * and the JSON path to access the node
 */
export class Parser {

    private DEBUG_CONSOLE_MESSAGES: boolean = false;
    private static numberMatcher = RegExp(/^(?:-?(?:0\.\d+|[1-9]\d*(?:\.\d+)?)(?:e[\-+]{0,1}\d+){0,1})(?=,|\}|\]|\s|$)/);
    private static stateTransitions: any = null;
    private static codedTransitions: Array<StateTransition> = [];

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

        if (!Parser.stateTransitions) {
            Parser.stateTransitions = {};

            Parser.addTransition(State.Start, [State.ArrayStart, State.ObjectStart, State.ValueStart], false, 0, State.End);
            Parser.addTransition(State.End, [], false, 0);

            // Value states
            Parser.addTransition(State.ValueStart, [State.ValueEnd], false, 0);
            Parser.addTransition(State.ValueEnd, [], false, 2);

            // Object states
            Parser.addTransition(State.ObjectStart, [State.ObjectEnd, State.KeyStart], false, 0);
            Parser.addTransition(State.KeyStart, [State.KeyEnd], false, 0);
            Parser.addTransition(State.KeyEnd, [State.Colon], false, 2);
            Parser.addTransition(State.Colon,  [State.ValueStart, State.ObjectStart, State.ArrayStart], false, 0, State.ObjectValueEnd);
            Parser.addTransition(State.ObjectValueEnd, [State.ObjectEnd, State.ObjectComma], false, 1);
            Parser.addTransition(State.ObjectComma, [State.KeyStart], false, 1);
            Parser.addTransition(State.ObjectEnd, [], false, 2);

            // Array states
            Parser.addTransition(State.ArrayStart, [State.ArrayEnd, State.ArrayValueStart], false, 1);
            Parser.addTransition(State.ArrayValueStart, [State.ValueStart, State.ObjectStart, State.ArrayStart], 
                false, 0, State.ArrayValueEnd);
            Parser.addTransition(State.ArrayValueEnd, [State.ArrayComma, State.ArrayEnd], false, 1);
            Parser.addTransition(State.ArrayComma, [State.ArrayValueStart], false, 1);
            Parser.addTransition(State.ArrayEnd, [], false, 1);

            forEach(Parser.stateTransitions, transition => {
                transition.fillTransitions(Parser.stateTransitions);
            });
        }
    }

    private static addTransition(state: State, next: Array<State>, autoNext: boolean, popOnCompletion: number, pop?: State) {
        const transition = new StateTransition(state, next, autoNext, popOnCompletion, pop);
        if (transition.code != StateTransition.CODE_NO_OP) {
            Parser.codedTransitions.push(transition);
        }
        Parser.stateTransitions[state] = transition;
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

    private stateTransition(currentState: State, newState: State, index: number) {
        const trans = <StateTransition>Parser.stateTransitions[currentState];

        if (newState) {
            if (trans.next.indexOf(newState) < 0) {
                throw new Error(`Invalid state, found state "${newState}" at index ${index}. Expected one of ${trans.next}`);
            } else {
                return this.pushState(newState);
            }
        } else if (trans.pop) {
            const resultState = this.popState();
            if (trans.pop[resultState]) {
                this.popState();
                this.pushState(trans.pop[resultState]);
                return trans.pop[resultState];
            } else {
                throw new Error(`Invalid state, expected ${Object.getOwnPropertyNames(resultState)} after state "${newState}" at index ${index}`);
            }
        } else {

            return 'oops';
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

    private readValue(buffer: Buffer, index: number, char: number): number {
        let end = -1;
        let dataType: DataType = null;
        if (StateTransition.isStringIntro(char)) {
            end = this.findStringEnd(buffer, index);
            dataType = DataType.String;
            if (end === -1) {
                throw new Error(`Invalid value at index ${index}, could not interpret the value as a string!`);
            }
        } else if (StateTransition.isNumberIntro(char)) {
            end = this.findNumberEnd(buffer, index);
            dataType = DataType.Number;
            if (end === -1) {
                throw new Error(`Invalid value at index ${index}, could not interpret the value as a number!`);
            }
        } else if (StateTransition.isTrueIntro(char)) {
            dataType = DataType.Boolean;
            end = this.findLiteralEnd(buffer, index + 1, [0x72, 0x75, 0x65]);
            if (end === -1) {
                throw new Error(`Invalid value at index ${index}, could not interpret the value as true!`);
            }
        } else if (StateTransition.isFalseIntro(char)) {
            dataType = DataType.Boolean;
            end = this.findLiteralEnd(buffer, index + 1, [0x61, 0x6C, 0x73, 0x65]);
            if (end === -1) {
                throw new Error(`Invalid value at index ${index}, could not interpret the value as false!`);
            }
        } else if (StateTransition.isNullIntro(char)) {
            dataType = DataType.Null;
            end = this.findLiteralEnd(buffer, index + 1, [0x75, 0x6C, 0x6C]);
            if (end === -1) {
                throw new Error(`Invalid value at index ${index}, could not interpret the value as null!`);
            }
        }

        this.onValue(buffer, dataType, index, end);
        return end;
    }

    private findLiteralEnd(buffer: Buffer, index: number, literal: Array<number>) {
        for (let i = 0; i < literal.length; i++) {
            if (i >= buffer.byteLength) {
                return -1;
            } else if (buffer.readUInt8(index + i) !== literal[i]) {
                return -1;
            }
        }
        return index + literal.length - 1;
    }

    private printStack(stack: Array<StateTransition>) {
        if (!this.DEBUG_CONSOLE_MESSAGES) {
            return;
        }
        let stackString = '';
        for (let state of stack) {
            if (stackString) {
                stackString += '->' + state.stateName();
            } else {
                stackString = state.stateName();
            }
        }
        console.log(stackString);
    }

    private doIt = false;
    public parse(data: string | Uint8Array | Buffer): JsonNode {

        let char = null;
        let index = -1;
        let state: StateTransition = Parser.stateTransitions[State.Start];
        let stateStack: Array<StateTransition> = [state];

        this.reset();

        let buffer: Buffer = null;
        if (data instanceof Uint8Array) {
            buffer = new Buffer(data);
        } else if (Buffer.isBuffer(data)) {
            buffer = data;
        } else {
            buffer = Buffer.from(data);
        }
        let setState: StateTransition = null;
        this.printStack(stateStack);
       
        let popStack = function(checkParentPopState: boolean = true) {
            if (state.popOnCompletion === 0) {
                return;
            }

            for (let i = 0; i < state.popOnCompletion; i++) {
                stateStack.pop();
            }

            state = stateStack[stateStack.length - 1];  // TODO check offset
            if (checkParentPopState && state.pop) {
                this.printStack(stateStack);
                if (this.DEBUG_CONSOLE_MESSAGES) {
                    console.log(`         -> replace top of stack ${state.state} with ${state.pop.state}`);
                }
                stateStack.pop();
                state = state.pop;
                stateStack.push(state);
                this.printStack(stateStack);
            } else {
                this.printStack(stateStack);
            }
        }.bind(this);

        const endCheckIndex = buffer.byteLength - 2;
        while (state.state !== State.End) {

            if (state.nextTransitions.length === 0 ) {
                // state autocompletes
                popStack();

            } else {
                index++;
                if (index === buffer.byteLength) {
                    throw new Error(`Unexpected end of json data at index ${index} in state "${state.state}". ` +
                        `The following states remain to be completed: [${this.states}]`);
                }

                char = buffer.readUInt8(index);
                if (char === 13 || char === 10 || char === 9 || char === 32) { // skip all whitespace
                    continue;
                }

                // match current char
                let newState = null;
                for (let coded of state.nextCodedTransitions) {
                    if (coded.isMatch(char)) {
                        newState = coded;
                        break;
                    }
                }
                if (!newState && state.nextNoOpTransitions.length === 1) {
                    // use first non-coded transition
                    newState = state.nextNoOpTransitions[0];
                    index--;  // reprocess this character
                }

                if (newState) {
                    popStack();
                    state = newState;
                    stateStack.push(state);
                    this.printStack(stateStack);

                    if (state.code === StateTransition.CODE_READ_VALUE) {
                        index = this.readValue(buffer, index, char);
                    } else if (state.state === State.KeyStart) {
                        const end = this.findStringEnd(buffer, index);
                        if (end === -1) {
                            throw new Error(`Invalid key at index ${index}, could not find the end of the string!`);
                        }
                        this.onKey(buffer, index, end);
                        index = end;
                    } else if (state.state === State.ObjectStart) {
                        this.onOpenObject(buffer, index);
                    } else if (state.state === State.ObjectEnd) {
                        this.onCloseObject(index);
                    } else if (state.state === State.ArrayStart) {
                        this.onOpenArray(buffer, index);
                    } else if (state.state === State.ArrayEnd) {
                        this.onCloseArray(index);
                    }

                } else {
                    throw new Error('No next :(');
                }

            }
        }

        return this.root;
    }

    public findNumberEnd(text: Buffer, numberStart: number) {
        let possibleEnd = numberStart+1;
        while (possibleEnd < text.length) {
            const char = text.readUInt8(possibleEnd);
            if (char == 101 || // 101 = e
                char == 69 ||  // 69 = E
                char == 43 || // 43 = + 
                char == 46 || // 46 = . 
                StateTransition.isNumberIntro(char)) {
            } else {
                break;
            }
            possibleEnd++;
        }

        let numberText = text.toString(ENCODING, numberStart, possibleEnd);
        if (Parser.numberMatcher.test(numberText)) {
            return possibleEnd - 1;  // remove the end char that wasn't part of the number
        } else {
            return -1;
        }
    }

    public findStringEnd(text: Buffer, stringStart: number) {
        const foundIndex = text.indexOf(CODE_STRING_DELIMITER, stringStart + 1);
        if (foundIndex === -1) {
            return foundIndex; // invalid string could not find a closing "
        }

        // Check if this string is escaped
        let i = foundIndex;
        let escapes = 0;
        while (text.readUInt8(--i) === CODE_BACKSLASH) {
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

    private onValue(sourceData: Buffer, type: DataType, start: number, end: number, parsedValue?: any) {
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

    private onKey(sourceData: Buffer, start: number, end: number) {
        const key = JSON.parse(sourceData.toString(ENCODING, start, end+1));
        const newKey = new JsonKeyNode(this.nextId++, sourceData, start, end, key);
        this.collectNode(newKey);
        if (!this.active || this.active.type !== JsonNodeType.Object) {
            throw new Error(`Invalid state found a key outside and object`);
        }
        this.active.data[key] = newKey;
        this.pushActive(newKey);
        if (this.eventCallback) {
            this.eventCallback.onKey(key, start, end);
        }
    }

    private onOpenObject(sourceData: Buffer, start: number) {
        // opened an object. key is the first key.
        // Position will be the : after the first key
        const node = new JsonObjectNode(this.nextId++, sourceData, start);
        this.collectNode(node);
        const previous = this.active;
        this.setValue(node);
        this.pushActive(node);
        node.previousNode = previous;  // restore previous that was overriden in setValue
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

    private onOpenArray(sourceData: Buffer, start: number) {
        // opened an array.
        const node = new JsonArrayNode(this.nextId++, sourceData, start);
        this.collectNode(node);
        const previous = this.active;
        this.setValue(node);
        this.pushActive(node);
        node.previousNode = previous;  // restore previous that was overriden in setValue
        if (this.eventCallback) {
            this.eventCallback.onOpenArray(start);
        }
    }

    private onCloseArray(end: number) {
        // closed an array.
        this.active.end = end;
        this.popActive();
        if ( this.active instanceof JsonKeyNode ) {
            this.popActive();
        }
        if (this.eventCallback) {
            this.eventCallback.onCloseArray(end);
        }
    }



}