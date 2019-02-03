import { EventEmitter } from '@angular/core';

import { RequireService } from './services/require.service';
import { Parser, JsonNode } from './json-parser/parser';
import { JsonTreeData } from './json-tree/json-tree.component';

export enum StateChange {
  ActiveNode = 'active',
  JsonData = 'json-data',
  CurrentTheme = 'theme'
}

export class AppState {

  public activeNode: JsonNode = null;
  public jsonRoot: JsonTreeData = null;
  public theme = 'default';
  public stateChange: EventEmitter<StateChange> = new EventEmitter();

  constructor(public readonly requireService: RequireService) {
  }

  public getActiveNodePath(): string {
    return (this.activeNode) ? this.activeNode.getPath(true) : '';
  }

  public setActiveNode(newNode: JsonNode) {
    this.activeNode = newNode;
    this.stateChange.emit(StateChange.ActiveNode);
  }

  public setJsonData(data: string | Uint8Array | Buffer, title: string) {
    const parser = new Parser(null, false, false);
    this.jsonRoot = new JsonTreeData();
    try {
      // console.profile(`parsing ${heading}`);
      this.jsonRoot.root = parser.parse(data);
      // console.profileEnd();
    } catch (e) {
      this.requireService.electron.remote.dialog.showErrorBox('Invalid json data', e.message);
    }

    window.document.title = `JSON Giant - "${title}"`;

    // notify state changed
    this.activeNode = null;
    this.stateChange.emit(StateChange.JsonData);
  }

  public getTheme(): string {
    return this.theme;
  }

  public setTheme(themeUrl: string) {
    this.theme = themeUrl;
    this.stateChange.emit(StateChange.CurrentTheme);
  }
}
