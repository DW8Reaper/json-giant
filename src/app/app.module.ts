import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { JsonTreeComponent } from './json-tree/json-tree.component';

import { TreeModule } from 'angular-tree-component';
import { RequireService } from './services/require.service';
import { RadialViewComponent } from './radial-view/radial-view.component';
import { TabViewComponent } from './tab-view/tab-view.component';

@NgModule({
  declarations: [
    AppComponent,
    JsonTreeComponent,
    RadialViewComponent,
    TabViewComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    TreeModule
  ],
  providers: [RequireService],
  bootstrap: [AppComponent],
})
export class AppModule { }
