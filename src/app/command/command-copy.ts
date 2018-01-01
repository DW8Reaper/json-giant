import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandCopy extends CommandBase {

  public execute(state: AppState) {
    let node = state.activeNode;
    if (!node) {
      node = state.jsonRoot.root;
    }

    if (node) {
      const clipboard = state.requireService.electron.remote.clipboard;
      let text = clipboard.writeText(node.toJsString());
    }
  }
}