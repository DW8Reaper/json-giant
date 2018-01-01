import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandPaste extends CommandBase {

  public execute(state: AppState) {
    const clipboard = state.requireService.electron.remote.clipboard;
      const text = clipboard.readText();
      if (text && text.length > 0) {
          state.setJsonData(text, 'Clipboard Data');
      } else {
          state.requireService.electron.remote.dialog.showErrorBox('Paste error', 'There is no text in the clipboard');
      }
  }
}