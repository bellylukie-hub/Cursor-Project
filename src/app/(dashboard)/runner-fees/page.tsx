"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { calculateRunnerFee, groupRunnerFees } from "@/lib/runner-fees";
import type { RunnerFeeInput } from "@/types";

const BORDERS = ["Kasumbalesa", "Sakania", "Mokambo", "Kanyaka"];
const OWNERS = ["Owner A", "Owner B", "Owner C"];

export default function RunnerFeesPage() {
  const [form, setForm] = useState<RunnerFeeInput>({
    owner: OWNERS[0],
    borderName: "Kasumbalesa",
    direction: "NB",
    zamArrivalDatetime: "",
    drcExitDatetime: "",
  });
  const [records, setRecords] = useState<ReturnType<typeof calculateRunnerFee>[]>([]);

  const grouped = useMemo(() => groupRunnerFees(records), [records]);

  const addRecord = () => {
    if (!form.zamArrivalDatetime || !form.drcExitDatetime) return;
    setRecords((prev) => [...prev, calculateRunnerFee(form)]);
  };

  return (
    <div>
      <PageHeader
        href="/runner-fees"
        title="Runner Fee Calculation"
        description="Calculate fees by owner, border, direction, and time spent between Zambia arrival and DRC exit."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Add entry</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Owner</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              >
                {OWNERS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Border</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.borderName}
                onChange={(e) => setForm({ ...form, borderName: e.target.value })}
              >
                {BORDERS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Direction</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as "NB" | "SB" })}
              >
                <option value="NB">NB</option>
                <option value="SB">SB</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Zambia border arrival</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.zamArrivalDatetime}
                onChange={(e) => setForm({ ...form, zamArrivalDatetime: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">DRC border exit</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={form.drcExitDatetime}
                onChange={(e) => setForm({ ...form, drcExitDatetime: e.target.value })}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={addRecord}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Calculate & Add
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Fee rules</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><strong>Sakania / Kasumbalesa:</strong> 0–2 days = $40 (Yellow), 3–4 days = $25 (Blue), 5+ days = $15 (Red)</li>
            <li><strong>Kanyaka NB/SB:</strong> 0–1 day = $5, 2+ days = $0</li>
          </ul>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            Grand total: ${grouped.grandTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {grouped.groups.length > 0 && (
        <div className="space-y-4">
          {grouped.groups.map(([key, group]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{key}</h3>
                <span className="text-sm font-medium text-slate-700">Subtotal: ${group.subtotal.toFixed(2)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Owner</th>
                      <th className="px-2 py-2">Days</th>
                      <th className="px-2 py-2">Group</th>
                      <th className="px-2 py-2">Rate</th>
                      <th className="px-2 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.records.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-2 py-2">{r.owner}</td>
                        <td className="px-2 py-2">{r.durationDays.toFixed(1)}</td>
                        <td className="px-2 py-2">{r.groupLabel}</td>
                        <td className="px-2 py-2">${r.rate}</td>
                        <td className="px-2 py-2">${r.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
