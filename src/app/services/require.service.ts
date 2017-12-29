import { Injectable } from '@angular/core';
import { RendererInterface } from 'electron';

@Injectable()
export class RequireService {
  private nodeRequire: NodeRequire;

  constructor() { }

  require = <NodeRequire>window['require'];

  get electron(): RendererInterface {
    return this.require('electron');
  }
}
