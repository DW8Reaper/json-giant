import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandOpen extends CommandBase {

  public execute(state: AppState) {
    const remote = state.requireService.electron.remote;
    const fs = state.requireService.require('fs');

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
          state.setJsonData(data, filename[0]);
        }
      }.bind(this));
    }
  }
}
