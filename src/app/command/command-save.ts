import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandSave extends CommandBase {

  public execute(state: AppState) {
    const fs = state.requireService.require('fs');

    let filename = state.requireService.electron.remote.dialog.showSaveDialog({
      title: 'Save As',
      filters: [{
        name: "JSON Files",
        extensions: ["json"]
      }]
    });
    if (filename && filename.length > 0) {
      fs.writeFile(filename, JSON.stringify(state.jsonRoot.root.toJs()), { encoding: 'utf-8' }, function (err, data) {
        if (err) {
          this.requireService.electron.remote.dialog.showErrorBox("Unabled to save file", err.message);
        }
      });
    }
  }
}