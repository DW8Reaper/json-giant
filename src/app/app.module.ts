import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { JsonTreeComponent } from './json-tree/json-tree.component';

import { TreeModule } from 'angular-tree-component';
import { RequireService } from './services/require.service';
import { JsonService } from './services/json.service';
import { RadialViewComponent } from './radial-view/radial-view.component';

@NgModule({
  declarations: [
    AppComponent,
    JsonTreeComponent,
    RadialViewComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    TreeModule
  ],
  providers: [RequireService, JsonService],
  bootstrap: [AppComponent],
})
export class AppModule { }
