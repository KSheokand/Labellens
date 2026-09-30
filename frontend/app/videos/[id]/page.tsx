import Link from "next/link";
import { getVideo } from "@/lib/api";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VideoDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  let video;

  try {
    video = await getVideo(id);
  } catch {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link
            href="/videos"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Video Explorer
          </Link>

          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-6">
            <h1 className="text-lg font-semibold">
              Video not found
            </h1>

            <p className="mt-2 text-sm text-red-300">
              No video with ID &quot;{id}&quot; could be loaded.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const qualityIssues = video.annotations.flatMap(
    (annotation, index) => {
      const issues: {
        type: string;
        severity: "error" | "warning";
        message: string;
        index: number;
      }[] = [];

      if (annotation.end_time <= annotation.start_time) {
        issues.push({
          type: "invalid_interval",
          severity: "error",
          message: `End time ${annotation.end_time.toFixed(
            2
          )}s is not greater than start time ${annotation.start_time.toFixed(
            2
          )}s`,
          index,
        });
      }

      if (annotation.start_time < 0) {
        issues.push({
          type: "negative_start_time",
          severity: "error",
          message: `Start time ${annotation.start_time.toFixed(
            2
          )}s is negative`,
          index,
        });
      }

      if (annotation.end_time > video.length) {
        issues.push({
          type: "annotation_exceeds_video",
          severity: "warning",
          message: `Annotation ends at ${annotation.end_time.toFixed(
            2
          )}s but video length is ${video.length.toFixed(2)}s`,
          index,
        });
      }

      return issues;
    }
  );

  const errorCount = qualityIssues.filter(
    (issue) => issue.severity === "error"
  ).length;

  const warningCount = qualityIssues.filter(
    (issue) => issue.severity === "warning"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">

        <Link
          href="/videos"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Video Explorer
        </Link>


        {/* Header */}

        <header className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">
              Video annotation
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {video.id}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {video.scene} · {video.length.toFixed(2)}s · Subject{" "}
              {video.subject}
            </p>
          </div>


          <div className="flex gap-2">

            {errorCount > 0 && (
              <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-xs text-red-300">
                {errorCount} error
                {errorCount !== 1 ? "s" : ""}
              </span>
            )}

            {warningCount > 0 && (
              <span className="rounded-full border border-amber-900 bg-amber-950/40 px-3 py-1 text-xs text-amber-300">
                {warningCount} warning
                {warningCount !== 1 ? "s" : ""}
              </span>
            )}

          </div>

        </header>


        {/* Metadata */}

        <section className="mt-8 grid gap-4 md:grid-cols-4">

          <MetadataCard
            label="Quality"
            value={
              video.quality !== null
                ? String(video.quality)
                : "—"
            }
          />

          <MetadataCard
            label="Relevance"
            value={
              video.relevance !== null
                ? String(video.relevance)
                : "—"
            }
          />

          <MetadataCard
            label="Verified"
            value={video.verified ?? "—"}
          />

          <MetadataCard
            label="Annotations"
            value={String(video.annotations.length)}
          />

        </section>


        {/* Description */}

        {(video.script || video.descriptions) && (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-lg font-semibold">
              Video metadata
            </h2>

            {video.script && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Script
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {video.script}
                </p>
              </div>
            )}

            {video.descriptions && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {video.descriptions}
                </p>
              </div>
            )}

          </section>
        )}


        {/* Objects */}

        {video.objects.length > 0 && (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-lg font-semibold">
              Objects
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {video.objects.map((object) => (
                <span
                  key={object}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-300"
                >
                  {object}
                </span>
              ))}
            </div>

          </section>
        )}


        {/* Timeline */}

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Annotation timeline
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Temporal action annotations across the video.
            </p>
          </div>


          {video.annotations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
              No annotations recorded for this video.
            </div>
          ) : (
            <div className="space-y-5">

              {video.annotations.map((annotation) => {
                const startPercent = Math.max(
                  0,
                  Math.min(
                    100,
                    (annotation.start_time / video.length) *
                      100
                  )
                );

                const endPercent = Math.max(
                  0,
                  Math.min(
                    100,
                    (annotation.end_time / video.length) *
                      100
                  )
                );

                const width = Math.max(
                  1,
                  endPercent - startPercent
                );

                const invalid =
                  annotation.end_time <=
                  annotation.start_time;

                const exceeds =
                  annotation.end_time > video.length;

                return (
                  <div key={annotation.id}>

                    <div className="mb-2 flex flex-col justify-between gap-1 sm:flex-row">

                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {annotation.action_label}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {annotation.action_code}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500">
                        {annotation.start_time.toFixed(2)}s →{" "}
                        {annotation.end_time.toFixed(2)}s
                      </p>

                    </div>


                    <div className="relative h-9 overflow-hidden rounded-md bg-slate-950">

                      <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />

                      <div
                        className={`absolute top-2 h-5 rounded ${
                          invalid
                            ? "bg-red-500/70"
                            : exceeds
                              ? "bg-amber-500/70"
                              : "bg-cyan-500/70"
                        }`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${width}%`,
                        }}
                      />

                    </div>


                    <div className="mt-1 flex justify-between text-[11px] text-slate-600">
                      <span>
                        {annotation.start_time.toFixed(2)}s
                      </span>

                      <span>
                        Duration{" "}
                        {annotation.duration.toFixed(2)}s
                      </span>

                      <span>
                        {annotation.end_time.toFixed(2)}s
                      </span>
                    </div>


                    {invalid && (
                      <p className="mt-2 text-xs text-red-400">
                        Error: end time is not greater than start
                        time.
                      </p>
                    )}

                    {!invalid && exceeds && (
                      <p className="mt-2 text-xs text-amber-400">
                        Warning: annotation extends beyond the
                        video length.
                      </p>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </section>


        {/* Quality */}

        {qualityIssues.length > 0 && (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Data quality
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Issues detected from the source annotations.
              </p>
            </div>


            <div className="space-y-3">

              {qualityIssues.map((issue, index) => (
                <div
                  key={`${issue.type}-${issue.index}-${index}`}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {issue.type.replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {issue.message}
                      </p>
                    </div>

                    <span
                      className={
                        issue.severity === "error"
                          ? "shrink-0 text-xs font-medium uppercase text-red-400"
                          : "shrink-0 text-xs font-medium uppercase text-amber-400"
                      }
                    >
                      {issue.severity}
                    </span>

                  </div>

                </div>
              ))}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}


function MetadataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}