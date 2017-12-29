import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { JsonTreeComponent } from './json-tree/json-tree.component';

import { TreeModule } from 'angular-tree-component';


@NgModule({
  declarations: [
    AppComponent,
    JsonTreeComponent
  ],
  imports: [
    BrowserModule,
    TreeModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
