import { map } from 'lodash';
import { Component, OnInit, ViewChild, Input, Output, OnChanges, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { TreeNode, TreeComponent } from 'angular-tree-component';
import { Parser, JsonNode, JsonNodeType, JsonKeyNode, JsonArrayNode } from '../json-parser/parser';
import { SimpleChanges } from '@angular/core/src/metadata/lifecycle_hooks';
import { has } from 'lodash';


// import * as fs from 'fs';

export class JsonTreeData {
  public root: JsonNode;
}
@Component({
  selector: 'app-json-tree',
  templateUrl: './json-tree.component.html',
  styleUrls: ['./json-tree.component.scss']
})
export class JsonTreeComponent implements OnInit, OnChanges {
  @Output()
  activeNode = new EventEmitter;

  @Input() 
  json: JsonTreeData = null;

  @ViewChild(TreeComponent)
  private tree: TreeComponent;

  public nodes: Array<JsonNode>;

  constructor() {
    this.nodes = new Array<JsonNode>();

    const parser = new Parser(null, false, false);
    // const fs = require('fs');
    // let root = parser.parse(fs.readFileSync('/Users/dewildt/Insync/Desktop/test.json').toString('UTF-8'));


    
    }
  public ngOnChanges(changes: SimpleChanges){
    if (has(changes, 'json')) {
      this.nodes = new Array<JsonNode>();
      if (this.json && this.json.root) {
        this.nodes.push(this.json.root);
      }
      this.tree.treeModel.update();
    }
  }
  public options = {
    hasChildrenField: 'hasChildren',
    // isExpandedField: 'expanded',
    nodeHeight: 24,
    useVirtualScroll: true,
    getChildren: (node: TreeNode) => {
      const jsonNode = <JsonNode>node.data;
      switch (jsonNode.type) {
        case JsonNodeType.Object:
          return map(jsonNode.data, function (keyObject) {
            return keyObject.data;
          });
        //return node.data.values();
        case JsonNodeType.Array:
          return jsonNode.data;
        default:
          return null;
      }
    }
  };

  public isContainerNode(node: JsonNode) {
    return node.type === JsonNodeType.Object || node.type === JsonNodeType.Array;
  }

  public getNodeValue(node: JsonNode): string {
    switch (node.type) {
      case JsonNodeType.Value:
        return node.getSourceText();
      default:
        return null;
    }
  }

  public getNodeIntro(node: JsonNode): string {
    let prefix = '';
    if (node.previousNode instanceof JsonKeyNode) {
      prefix = node.previousNode.getSourceText() + ' : ';
    } else if (node.previousNode instanceof JsonArrayNode ) {
      prefix = (<Array<JsonNode>>node.previousNode.data).indexOf(node) + ' : ';
    }
    switch (node.type) {
      case JsonNodeType.Object:
        return prefix + '{';
      case JsonNodeType.Array:
        return prefix + '[';
      default:
        return prefix;
    }
  }

  public getNodeOutro(node: JsonNode): string {
    switch (node.type) {
      case JsonNodeType.Object:
        return '}';
      case JsonNodeType.Array:
        return ']';
      default:
        return null;
    }
  }

  onNodeActive($event) {
    this.activeNode.emit($event.node.data);
  } 
  onNodeDeactive($event) {
    this.activeNode.emit(null);
  }

  ngOnInit() {
  }

}
