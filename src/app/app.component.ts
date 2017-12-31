import { Component, ApplicationRef } from '@angular/core';
//  import { remote } from 'electron';
import { Parser, JsonNode } from './json-parser/parser';
import { JsonTreeData } from './json-tree/json-tree.component';
import { RendererInterface } from 'electron';
import { RequireService } from './services/require.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public activeNode: JsonNode = null;
  private application: ApplicationRef;
  public title = 'app';
  public jsonRoot: JsonTreeData = null;

  constructor(private requireService: RequireService, application: ApplicationRef) {
    this.application = application;
    this.updateJsonData(`{"a": 100, "b": {"c":100, "d":{"c":[1,2,3], "e":"ddddd"}}, "m&m<m>m}": {"iggy": "some string value\\""}}`, 'Sample Data');
  }

  public pasteFromClipboard() {
    const clipboard = this.requireService.electron.remote.clipboard;
      let text = clipboard.readText();
      if (text && text.length > 0) {
          this.updateJsonData(text, 'Clipboard Data');
      } else {
          this.requireService.electron.remote.dialog.showErrorBox('Paste error', 'There is no text in the clipboard');
      }
  }

  public copyToClipboard() {
    let node = this.activeNode;
    if (!node) {
      node = this.jsonRoot.root;
    }

    if (node) {
      const clipboard = this.requireService.electron.remote.clipboard;
      let text = clipboard.writeText(node.toJsString());
    }
  }

  public copySelectedPath() {
    if (this.activeNode) {
      const clipboard = this.requireService.electron.remote.clipboard;
      let text = clipboard.writeText(this.activeNode.getPath(true));
    }
  }

  public saveFile() {
    const fs = this.requireService.require('fs');

    let filename = this.requireService.electron.remote.dialog.showSaveDialog({
        filters: [{
            name: "JSON Files",
            extensions: ["json"]
        }]
    });
    if (filename && filename.length > 0) {
        fs.writeFile(filename, JSON.stringify(this.jsonRoot.root.toJs()), {encoding: 'utf-8'}, function (err, data) {
            if (err) {
                this.requireService.electron.remote.dialog.showErrorBox("Unabled to save file", err.message);
            }
        });
    }
  }

  public openFile() {
    const remote = this.requireService.electron.remote;
    const fs = this.requireService.require('fs');

    let filename = remote.dialog.showOpenDialog({
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }], properties: ['openFile']
    });
    if (filename && filename.length > 0) {
      fs.readFile(filename[0], function (err, data) {
        if (err) {
          remote.dialog.showErrorBox("Unabled to load file", err.message);
        } else {
          this.updateJsonData(data, filename[0]);
        }
      }.bind(this));
    }
  }

  public getActiveNodePath(): string {
    return (this.activeNode) ? this.activeNode.getPath(true) : '';
  }

  public setActiveNode(newNode: JsonNode) {
    this.activeNode = newNode;
  }

  private updateJsonData(data: string | Uint8Array, heading: string) {
    const parser = new Parser(null, false, false);
    this.jsonRoot = new JsonTreeData();
    try {
    console.profile(`parsing ${heading}`);
    this.jsonRoot.root = parser.parse(data);
    console.profileEnd();
  } catch (e) {
    this.requireService.electron.remote.dialog.showErrorBox('Invalid json data', e.message);    
  }
       
    window.document.title = `JSON Giant - "${heading}"`;
    // electron dialogs/events don't trigger angular to digest so force a tick
    this.application.tick();
  }
}
