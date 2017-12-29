import { TestBed, inject } from '@angular/core/testing';

import { RequireService } from './require.service';

describe('NodeRequireService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RequireService]
    });
  });

  it('should be created', inject([RequireService], (service: RequireService) => {
    expect(service).toBeTruthy();
  }));

});
