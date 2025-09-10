import { TestBed } from '@angular/core/testing';

import { AzureFabric } from './azure-fabric';

describe('AzureFabric', () => {
  let service: AzureFabric;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AzureFabric);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
