import { Component, ApplicationRef } from '@angular/core';
//  import { remote } from 'electron';
import { Parser, JsonNode } from './json-parser/parser';
import { JsonTreeData } from './json-tree/json-tree.component';
import { Element } from '@angular/compiler';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {


  private application: ApplicationRef;
  public title = 'app';
  public jsonRoot: JsonTreeData = null;

  constructor(application: ApplicationRef) {
    this.application = application;
    const parser = new Parser(null, false, false);
    this.jsonRoot = new JsonTreeData();
    this.jsonRoot.root = parser.parse(
      `{"a": 100, "b": {"c":100, "d":{"c":[1,2,3], "e":"ddddd"}}, "m&m<m>m}": {"iggy": "some string value\\""}}`);

  }

  public openFile() {
    const require: NodeRequire = window['require'];
    const remote = require('electron').remote;
    const fs = require('fs');

    let filename = remote.dialog.showOpenDialog({
      filters: [{
        name: "JSON Files",
        extensions: ["json"]
      }], properties: ['openFile']
    });
    if (filename && filename.length > 0) {
      fs.readFile(filename[0], function (err, data) {
        if (err) {
          remote.dialog.showErrorBox("Unabled to load file", err.message);
        } else {
          const parser = new Parser(null, false, false);
          this.jsonRoot = new JsonTreeData();
          const stringData = data.toString('utf-8');
          console.profile(`parsing ${filename[0]}`);
          this.jsonRoot.root = parser.parse(stringData);
          console.profileEnd();
          this.title = filename[0];
          this.application.tick();

        }
      }.bind(this));
    }
  }
}
