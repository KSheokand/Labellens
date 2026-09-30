import {
  getOverviewStats,
  getQualityOverview,
  getSceneDistribution,
  getTopActions,
} from "@/lib/api";

export default async function Dashboard() {
  const [
    overview,
    quality,
    topActions,
    scenes,
  ] = await Promise.all([
    getOverviewStats(),
    getQualityOverview(),
    getTopActions(5),
    getSceneDistribution(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-cyan-400">
            DATASET INSPECTION
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            LabelLens
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Video annotation explorer & quality inspector
          </p>
        </header>


        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Videos"
            value={overview.videos.toLocaleString()}
          />

          <StatCard
            label="Annotations"
            value={overview.annotations.toLocaleString()}
          />

          <StatCard
            label="Action classes"
            value={overview.action_classes.toLocaleString()}
          />

          <StatCard
            label="Quality findings"
            value={quality.total_issues.toLocaleString()}
          />

        </section>


        <section className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Top actions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Most frequently annotated actions
              </p>
            </div>

            <div className="space-y-4">
              {topActions.map((action) => (
                <div
                  key={action.action_code}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">
                      {action.action_label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {action.action_code}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-cyan-400">
                    {action.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

          </div>


          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Scene distribution
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Videos grouped by scene
              </p>
            </div>

            <div className="space-y-3">
              {scenes.slice(0, 8).map((scene) => (
                <div
                  key={scene.scene}
                  className="flex items-center justify-between gap-4"
                >
                  <p className="truncate text-sm text-slate-300">
                    {scene.scene}
                  </p>

                  <span className="shrink-0 text-sm text-slate-400">
                    {scene.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </section>


        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <QualityCard
            label="Errors"
            value={quality.errors}
          />

          <QualityCard
            label="Warnings"
            value={quality.warnings}
          />

          <QualityCard
            label="Affected videos"
            value={quality.affected_videos}
          />

        </section>


        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold">
            Dataset summary
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            <Info
              label="Average video length"
              value={`${overview.average_video_length}s`}
            />

            <Info
              label="Annotations per video"
              value={overview.average_annotations_per_video.toString()}
            />

            <Info
              label="Object classes"
              value={overview.object_classes.toString()}
            />

            <Info
              label="Dataset"
              value="Charades training split"
            />

          </div>

        </section>

      </div>
    </main>
  );
}


function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}


function QualityCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}


function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-200">
        {value}
      </p>
    </div>
  );
}