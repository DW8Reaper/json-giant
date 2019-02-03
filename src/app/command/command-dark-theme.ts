import { CommandBase } from './command-base';
import { AppState } from '../app-state';

export class CommandDarkTheme extends CommandBase {
  public execute(state: AppState) {
    state.setTheme((state.getTheme() === 'default') ? 'cyborg' : 'default');
  }
}
