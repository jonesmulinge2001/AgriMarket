import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerLayoutComponent } from './farmer-layout.component';

describe('FarmerLayoutComponent', () => {
  let component: FarmerLayoutComponent;
  let fixture: ComponentFixture<FarmerLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmerLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
