import { Component, EventEmitter, Input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-theme-link',
  template: `<link rel="stylesheet" type="text/css" [href]="getSafeThemeUrl()">`
})
export class ThemeLinkComponent {
  @Input() theme = 'default';

  constructor(private sanitizer: DomSanitizer) {}

  public getSafeThemeUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`node_assets/${this.theme}.theme.bootstrap.min.css`);
  }
}
