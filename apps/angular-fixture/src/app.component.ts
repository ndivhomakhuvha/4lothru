import { Component, OnInit, computed, signal } from "@angular/core";
import { Trail } from "4lothru";

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <div class="shell">
      <h1>Angular Payments</h1>
      <p class="hint">SDK compatibility fixture — same &#64;trail/sdk package as the React demo app.</p>

      <div class="panel">
        <label for="amount">Amount</label>
        <input id="amount" type="text" (input)="onAmountInput($event)" />
      </div>

      <div class="panel">
        <button type="button" (click)="selectBeneficiary()">Beneficiary</button>
        @if (beneficiary()) {
          <p class="hint">Selected: {{ beneficiary() }}</p>
        }
      </div>

      <div class="panel">
        <button type="button" [disabled]="!canSubmit()" (click)="submit()">Submit Payment</button>
      </div>

      @if (submitted()) {
        <h2>Payment successful</h2>
      }
    </div>
  `,
})
export class AppComponent implements OnInit {
  amount = signal("");
  beneficiary = signal<string | null>(null);
  submitted = signal(false);
  canSubmit = computed(() => this.amount().trim().length > 0 && !!this.beneficiary());

  onAmountInput(event: Event): void {
    this.amount.set((event.target as HTMLInputElement).value);
  }

  selectBeneficiary(): void {
    this.beneficiary.set("Jane Doe");
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitted.set(true);
  }

  ngOnInit(): void {
    // No-op unless the page was opened with ?trail=&release= (see spec #14/#34).
    void Trail.init();
  }
}
