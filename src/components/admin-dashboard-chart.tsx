"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatChartDay } from "@/lib/admin-dashboard";
import { formatPrice, plural } from "@/lib/format";

export interface DashboardChartDay {
  day: string;
  orders: number;
  revenue: number;
  isToday: boolean;
}

interface Props {
  locale: Locale;
  currency: string;
  days: DashboardChartDay[];
  labels: Dictionary["admin"]["dashboard"];
}

/**
 * Daily sales as bars, oldest first, so time runs in the reading direction (right to left in Arabic). Each bar is
 * focusable and names its own day, orders and sales; the same figures are also a table for screen readers.
 */
export function AdminDashboardChart({ locale, currency, days, labels }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);
  const allZero = days.every((d) => d.orders === 0 && d.revenue === 0);

  return (
    <div className="flex flex-col gap-4">
      {/* A group, not role="img": an image's children are hidden from assistive tech, but these bars take focus. */}
      <div role="group" aria-label={labels.salesChart} className="relative flex h-44 items-end gap-1 sm:gap-1.5">
        {days.map((day, index) => {
          const height = allZero ? 4 : Math.max(4, Math.round((day.revenue / maxRevenue) * 100));
          const dateLabel = formatChartDay(day.day, locale);
          const tooltip = `${dateLabel} · ${plural(labels.chartOrders, day.orders, locale)} · ${formatPrice(day.revenue, currency, locale)}`;

          return (
            <div key={day.day} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              {active === index && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-[10rem] rounded-xl border border-border bg-surface px-2.5 py-1.5 text-center text-xs shadow-lift">
                  {tooltip}
                </div>
              )}
              <button
                type="button"
                className={`w-full rounded-t-md transition-colors ${day.isToday ? "bg-brand" : "bg-brand/35 hover:bg-brand/55"}`}
                style={{ height: `${height}%` }}
                aria-label={tooltip}
                onFocus={() => setActive(index)}
                onBlur={() => setActive((current) => (current === index ? null : current))}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive((current) => (current === index ? null : current))}
              />
              <span aria-hidden className="hidden text-[10px] text-muted sm:block">
                {dateLabel}
              </span>
            </div>
          );
        })}
      </div>

      {allZero && <p className="text-sm text-muted">{labels.chartEmpty}</p>}

      <table className="sr-only">
        <caption>{labels.salesChart}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.dayColumn}</th>
            <th scope="col">{labels.ordersColumn}</th>
            <th scope="col">{labels.salesColumn}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.day}>
              <th scope="row">{formatChartDay(day.day, locale)}</th>
              <td>{day.orders}</td>
              <td>{formatPrice(day.revenue, currency, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
