import { RUNNER_FEE_RULES } from "@/lib/constants";
import type { RunnerFeeInput, RunnerFeeResult } from "@/types";

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

export function calculateRunnerFee(input: RunnerFeeInput): RunnerFeeResult {
  const zamArrival = new Date(input.zamArrivalDatetime);
  const drcExit = new Date(input.drcExitDatetime);
  const durationDays = daysBetween(zamArrival, drcExit);
  const durationHours = durationDays * 24;

  const border = input.borderName.toLowerCase();

  if (border.includes("kanyaka")) {
    const rule = RUNNER_FEE_RULES.kanyaka.find(
      (r) => durationDays >= r.daysMin && durationDays <= r.daysMax
    )!;
    return {
      ...input,
      durationDays,
      groupLabel: `Kanyaka ${input.direction}`,
      rate: rule.rate,
      amount: rule.rate,
    };
  }

  const rule = RUNNER_FEE_RULES.sakaniaKasumbalesa.find(
    (r) => durationDays >= r.daysMin && durationDays <= r.daysMax
  )!;

  return {
    ...input,
    durationDays,
    groupLabel: rule.group,
    rate: rule.rate,
    amount: rule.rate,
  };
}

export function groupRunnerFees(records: RunnerFeeResult[]) {
  const groups = new Map<string, { records: RunnerFeeResult[]; subtotal: number }>();

  for (const record of records) {
    const key = `${record.borderName}-${record.direction}-${record.groupLabel}`;
    const existing = groups.get(key) ?? { records: [], subtotal: 0 };
    existing.records.push(record);
    existing.subtotal += record.amount;
    groups.set(key, existing);
  }

  const grandTotal = records.reduce((sum, r) => sum + r.amount, 0);
  return { groups: Array.from(groups.entries()), grandTotal };
}
