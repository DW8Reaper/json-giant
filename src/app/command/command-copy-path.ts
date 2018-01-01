import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandCopyPath extends CommandBase {

  public execute(state: AppState) {
    const clipboard = state.requireService.electron.remote.clipboard;
    if (state.activeNode) {
      clipboard.writeText(state.activeNode.getPath(true));
    } else {
      clipboard.writeText('$');
    }
  }
}