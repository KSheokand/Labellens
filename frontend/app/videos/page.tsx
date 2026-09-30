"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getScenes,
  getVideos,
  type VideoSummary,
} from "@/lib/api";

const PAGE_SIZE = 20;

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [scene, setScene] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getScenes()
      .then(setScenes)
      .catch(() => setError("Failed to load scenes"));
  }, []);

  useEffect(() => {
  let cancelled = false;

  getVideos({
    search,
    scene,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
    .then((data) => {
      if (cancelled) return;

      setVideos(data.items);
      setTotal(data.total);
      setError("");
    })
    .catch(() => {
      if (!cancelled) {
        setError("Failed to load videos");
      }
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [search, scene, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearch(value: string) {
  setLoading(true);
  setError("");
  setSearch(value);
  setPage(0);
}

  function handleScene(value: string) {
  setLoading(true);
  setError("");
  setScene(value);
  setPage(0);
}

function handlePage(nextPage: number) {
  setLoading(true);
  setError("");
  setPage(nextPage);
}

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Video Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Search and inspect Charades video annotations.
          </p>
        </div>


        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="grid gap-4 md:grid-cols-[1fr_280px]">

            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <input
                id="search"
                value={search}
                onChange={(event) =>
                  handleSearch(event.target.value)
                }
                placeholder="Search by video ID, subject or scene..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>


            <div>
              <label
                htmlFor="scene"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Scene
              </label>

              <select
                id="scene"
                value={scene}
                onChange={(event) =>
                  handleScene(event.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              >
                <option value="">All scenes</option>

                {scenes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </section>


        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {total.toLocaleString()} videos
          </p>

          {loading && (
            <p className="text-sm text-cyan-400">
              Loading...
            </p>
          )}
        </div>


        {error && (
          <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}


        <section className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] border-b border-slate-800 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Video</span>
            <span>Scene</span>
            <span>Length</span>
            <span>Annotations</span>
            <span>Verified</span>
          </div>


          {!loading && videos.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No videos match your filters.
            </div>
          )}


          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr] items-center border-b border-slate-800 px-5 py-4 transition last:border-b-0 hover:bg-slate-800/50"
            >
              <div>
                <p className="font-medium text-slate-100">
                  {video.id}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Subject {video.subject}
                </p>
              </div>

              <p className="truncate pr-4 text-sm text-slate-300">
                {video.scene}
              </p>

              <p className="text-sm text-slate-400">
                {video.length.toFixed(2)}s
              </p>

              <p className="text-sm text-slate-400">
                {video.annotation_count}
              </p>

              <p className="text-sm">
                <span
                  className={
                    video.verified === "Yes"
                      ? "text-emerald-400"
                      : "text-slate-500"
                  }
                >
                  {video.verified ?? "Unknown"}
                </span>
              </p>
            </Link>
          ))}

        </section>


        <div className="mt-6 flex items-center justify-between">

          <button
            disabled={page === 0}
            onClick={() => handlePage(page - 1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Previous
          </button>

          <p className="text-sm text-slate-500">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </p>

          <button
            disabled={page + 1 >= totalPages}
            onClick={() => handlePage(page + 1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next →
          </button>

        </div>

      </div>
    </main>
  );
}