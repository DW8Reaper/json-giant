
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { JsonTreeComponent } from './json-tree/json-tree.component';
import { ThemeLinkComponent } from './themes/theme-link.component';

import { TreeModule, TreeDraggedElement } from 'angular-tree-component';
import { RequireService } from './services/require.service';

@NgModule({
  declarations: [
    AppComponent,
    JsonTreeComponent,
    ThemeLinkComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    TreeModule
  ],
  providers: [RequireService, TreeDraggedElement],
  bootstrap: [AppComponent],
})
export class AppModule { }
