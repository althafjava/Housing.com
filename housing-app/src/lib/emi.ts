export interface EmiInput {
  principal: number;
  annualRatePercent: number;
  tenureYears: number;
}

export interface EmiResult {
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
}

/**
 * Standard reducing-balance EMI formula:
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * where r = monthly rate, n = tenure in months.
 */
export function calculateEmi({
  principal,
  annualRatePercent,
  tenureYears,
}: EmiInput): EmiResult {
  if (principal <= 0 || annualRatePercent < 0 || tenureYears <= 0) {
    throw new Error("principal and tenureYears must be positive; rate must be non-negative");
  }

  const months = tenureYears * 12;
  const monthlyRate = annualRatePercent / 12 / 100;

  const monthlyEmi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = monthlyEmi * months;
  const totalInterest = totalPayment - principal;

  return {
    monthlyEmi: round2(monthlyEmi),
    totalPayment: round2(totalPayment),
    totalInterest: round2(totalInterest),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
