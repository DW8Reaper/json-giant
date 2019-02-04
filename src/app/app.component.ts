import { Component, ApplicationRef, ChangeDetectorRef } from '@angular/core';
import { RequireService } from './services/require.service';
import { AppState, StateChange } from './app-state';
import { CommandBase  } from './command/command-base';
import { CommandOpen } from './command/command-open';
import { CommandSave } from './command/command-save';
import { CommandCopy } from './command/command-copy';
import { CommandPaste } from './command/command-paste';
import { CommandCopyPath } from './command/command-copy-path';
import { CommandType } from './command/command-type.enum';
import { CommandTheme } from './command/command-theme';

class CommandRef {
  constructor(public commandType: CommandType, public command: CommandBase) {}
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public CommandType = CommandType;
  private application: ApplicationRef;
  public title = 'app';
  public state: AppState;
  public commands: Array<CommandRef>;

  public theme = '';

  constructor(private changeDetector: ChangeDetectorRef, requireService: RequireService, application: ApplicationRef) {
    this.application = application;

    this.state = new AppState(requireService);
    this.state.setJsonData(
      `{"a": 100, "b": {"c":100, "d":{"c":[1,2,3], "e":"ddddd"}}, "m&m<m>m}": {"iggy": "some string value\\""}}`, 'Sample Data');

    this.state.stateChange.subscribe((change: StateChange) => {
      changeDetector.markForCheck();
      if (change === StateChange.CurrentTheme) {
        this.theme = this.state.getTheme();
      }
      application.tick();
    });

    // Create available commands list
    this.commands = new Array<CommandRef>();
    this.registerCommand(CommandType.Open, new CommandOpen());
    this.registerCommand(CommandType.Save, new CommandSave());
    this.registerCommand(CommandType.Copy, new CommandCopy());
    this.registerCommand(CommandType.Paste, new CommandPaste());
    this.registerCommand(CommandType.CopyActivePath, new CommandCopyPath());
    this.registerCommand(CommandType.Theme, new CommandTheme());
  }
  private registerCommand(type: CommandType, command: CommandBase) {
    // listen for this command on the main process
    this.state.requireService.electron.ipcRenderer.on(type, function() {
      command.execute(this.state);
    }.bind(this));

    // add local handler
    this.commands.push(new CommandRef(type, command));
  }

  public sendCommand(type: CommandType) {
    const commandRef = this.commands.find((ref: CommandRef) => ref.commandType === type);
    if (commandRef) {
        commandRef.command.execute(this.state);
    } else {
      this.state.requireService.electron.remote.dialog.showErrorBox("Unknown command", 
            `Command "${type}" is unknown. Unable to execute command`);
    }
  }


}
