import { TestBed, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { TreeModule } from 'angular-tree-component';
import { JsonTreeComponent } from './json-tree/json-tree.component';
import { RequireService } from './services/require.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        JsonTreeComponent
      ],
      providers: [
        RequireService
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

});
