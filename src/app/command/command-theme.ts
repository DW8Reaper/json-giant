import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandTheme extends CommandBase {
  public execute(state: AppState) {
    state.setTheme((state.getTheme() === 'default') ? 'solar' : 'default');
  }
}
