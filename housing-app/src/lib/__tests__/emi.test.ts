import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEmi } from "../emi";

test("calculateEmi matches a known reference value (₹95L @ 8.35% / 20yr)", () => {
  const result = calculateEmi({ principal: 9_500_000, annualRatePercent: 8.35, tenureYears: 20 });
  assert.equal(result.monthlyEmi, 81543.53);
  assert.equal(result.totalPayment, 19570447.54);
});

test("calculateEmi handles a zero interest rate (straight-line amortization)", () => {
  const result = calculateEmi({ principal: 1_200_000, annualRatePercent: 0, tenureYears: 10 });
  assert.equal(result.monthlyEmi, 10000);
  assert.equal(result.totalInterest, 0);
});

test("calculateEmi rejects a non-positive principal", () => {
  assert.throws(() => calculateEmi({ principal: 0, annualRatePercent: 8, tenureYears: 5 }));
  assert.throws(() => calculateEmi({ principal: -100, annualRatePercent: 8, tenureYears: 5 }));
});

test("calculateEmi rejects a non-positive tenure", () => {
  assert.throws(() => calculateEmi({ principal: 100000, annualRatePercent: 8, tenureYears: 0 }));
});

test("calculateEmi rejects a negative rate", () => {
  assert.throws(() => calculateEmi({ principal: 100000, annualRatePercent: -1, tenureYears: 5 }));
});
