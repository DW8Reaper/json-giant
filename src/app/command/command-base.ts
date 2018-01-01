import { AppState } from '../app-state';

export abstract class CommandBase {
  
  public abstract execute(state: AppState);
}
