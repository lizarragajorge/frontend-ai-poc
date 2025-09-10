import { TestBed } from '@angular/core/testing';

import { AiFoundry } from './ai-foundry';

describe('AiFoundry', () => {
  let service: AiFoundry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiFoundry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
