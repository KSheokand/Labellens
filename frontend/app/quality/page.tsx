import Link from "next/link";
import {
  getQualityBreakdown,
  getQualityIssues,
  getQualityOverview,
} from "@/lib/api";

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{
    severity?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const severity =
    params.severity === "error" || params.severity === "warning"
      ? params.severity
      : undefined;

  const page = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1
  );

  const pageSize = 100;
  const offset = (page - 1) * pageSize;

  const [overview, issues, breakdown] = await Promise.all([
    getQualityOverview(),
    getQualityIssues({
      severity,
      limit: pageSize,
      offset,
    }),
    getQualityBreakdown(),
  ]);

  const totalPages = Math.ceil(issues.total / pageSize);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back link */}

        <Link
          href="/"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Dashboard
        </Link>

        {/* Header */}

        <header className="mt-5">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">
            Dataset inspection
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Data Quality
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Inspect annotation issues detected during dataset
            validation.
          </p>
        </header>

        {/* Summary */}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <QualityCard
            label="Total findings"
            value={overview.total_issues.toLocaleString()}
          />

          <QualityCard
            label="Errors"
            value={overview.errors.toLocaleString()}
            tone="error"
          />

          <QualityCard
            label="Warnings"
            value={overview.warnings.toLocaleString()}
            tone="warning"
          />

          <QualityCard
            label="Affected videos"
            value={overview.affected_videos.toLocaleString()}
          />
        </section>

        {/* Issue distribution */}

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Issue distribution
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Findings grouped by validation rule.
            </p>
          </div>

          <div className="space-y-4">
            {breakdown.items.map((item) => (
              <IssueRow
                key={`${item.issue_type}-${item.severity}`}
                label={item.issue_type.replaceAll("_", " ")}
                count={item.count}
                severity={item.severity}
              />
            ))}
          </div>
        </section>

        {/* Findings */}

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold">
                Findings
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Showing{" "}
                {issues.total === 0
                  ? 0
                  : `${offset + 1}-${Math.min(
                      offset + issues.items.length,
                      issues.total
                    )}`}{" "}
                of {issues.total.toLocaleString()} findings.
              </p>
            </div>

            {/* Severity filters */}

            <div className="flex gap-2 text-xs">
              <Link
                href="/quality"
                className={
                  !severity
                    ? "rounded-md border border-cyan-700 bg-cyan-950/40 px-3 py-2 text-cyan-300"
                    : "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300 hover:border-slate-600"
                }
              >
                All
              </Link>

              <Link
                href="/quality?severity=error"
                className={
                  severity === "error"
                    ? "rounded-md border border-red-700 bg-red-950/40 px-3 py-2 text-red-300"
                    : "rounded-md border border-red-900 bg-red-950/20 px-3 py-2 text-red-300 hover:bg-red-950/40"
                }
              >
                Errors
              </Link>

              <Link
                href="/quality?severity=warning"
                className={
                  severity === "warning"
                    ? "rounded-md border border-amber-700 bg-amber-950/40 px-3 py-2 text-amber-300"
                    : "rounded-md border border-amber-900 bg-amber-950/20 px-3 py-2 text-amber-300 hover:bg-amber-950/40"
                }
              >
                Warnings
              </Link>
            </div>
          </div>

          {/* Findings table */}

          <div className="mt-6 overflow-hidden rounded-lg border border-slate-800">
            <div className="grid grid-cols-[100px_110px_1fr] border-b border-slate-800 bg-slate-950 px-4 py-3 text-xs uppercase tracking-wide text-slate-500">
              <span>Video</span>
              <span>Severity</span>
              <span>Finding</span>
            </div>

            <div className="divide-y divide-slate-800">
              {issues.items.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/videos/${issue.video_id}`}
                  className="grid grid-cols-[100px_110px_1fr] gap-4 px-4 py-4 transition hover:bg-slate-950"
                >
                  <span className="font-mono text-sm text-cyan-400">
                    {issue.video_id}
                  </span>

                  <span
                    className={
                      issue.severity === "error"
                        ? "text-xs font-medium uppercase text-red-400"
                        : "text-xs font-medium uppercase text-amber-400"
                    }
                  >
                    {issue.severity}
                  </span>

                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {issue.issue_type.replaceAll("_", " ")}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {issue.message}
                    </p>
                  </div>
                </Link>
              ))}

              {issues.items.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No findings match this filter.
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}

          {issues.total > pageSize && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/quality?${new URLSearchParams({
                      ...(severity ? { severity } : {}),
                      page: String(page - 1),
                    }).toString()}`}
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-slate-600"
                  >
                    ← Previous
                  </Link>
                )}

                {page < totalPages && (
                  <Link
                    href={`/quality?${new URLSearchParams({
                      ...(severity ? { severity } : {}),
                      page: String(page + 1),
                    }).toString()}`}
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-slate-600"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QualityCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "error" | "warning";
}) {
  const valueClass =
    tone === "error"
      ? "text-red-400"
      : tone === "warning"
        ? "text-amber-400"
        : "text-slate-100";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function IssueRow({
  label,
  count,
  severity,
}: {
  label: string;
  count: number;
  severity: "error" | "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className={
            severity === "error"
              ? "h-2 w-2 rounded-full bg-red-400"
              : "h-2 w-2 rounded-full bg-amber-400"
          }
        />

        <span className="text-sm text-slate-300">
          {label}
        </span>
      </div>

      <span className="font-mono text-sm text-slate-400">
        {count.toLocaleString()}
      </span>
    </div>
  );
}