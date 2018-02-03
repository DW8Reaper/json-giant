import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RadialViewComponent } from './radial-view.component';

describe('RadialViewComponent', () => {
  let component: RadialViewComponent;
  let fixture: ComponentFixture<RadialViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RadialViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadialViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
