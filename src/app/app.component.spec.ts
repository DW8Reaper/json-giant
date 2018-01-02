import { TestBed, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { TreeModule } from 'angular-tree-component';
import { JsonTreeComponent } from './json-tree/json-tree.component';
import { RequireService } from './services/require.service';


describe('AppComponent', () => {

  let requireService = {
    require: function () { },
    electron: {
      ipcRenderer: {
        on: function () {
          return 1;
        }
      }
    }
  };

  beforeEach(async(() => {
    spyOn(requireService.electron.ipcRenderer, 'on');

    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        JsonTreeComponent
      ],
      providers: [
        { provide: RequireService, useValue: requireService }
      ],
      imports: [
        FormsModule,
        TreeModule
      ]
    }).compileComponents();

  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it('should register commands and listen to them from the main process', async(() => {

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.commands.length).toBeGreaterThan(1);
    expect(requireService.electron.ipcRenderer.on).toHaveBeenCalled();
  }));

});
