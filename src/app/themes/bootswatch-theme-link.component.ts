import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Get theme names from https://bootswatch.com
@Component({
  selector: 'app-bootswatch-theme-link',
  template: `<link rel="stylesheet" type="text/css" [href]="getSafeThemeUrl()">`
})
export class BootsWatchThemeLinkComponent {
  @Input() theme = '';

  constructor(private sanitizer: DomSanitizer) {}

  public getSafeThemeUrl(): SafeResourceUrl {
    if (this.theme === '') {
      return '';
    } else {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://bootswatch.com/4/${this.theme}/bootstrap.min.css`);
    }
  }
}
