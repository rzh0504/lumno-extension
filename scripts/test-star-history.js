const assert = require("node:assert/strict");

const {
  fetchCurrentStarCount,
  renderChart,
  updateSnapshots,
  validateHistory,
} = require("./update-star-history.js");

const repository = "kubai087/lumno-extension";

const original = [
  { date: "2026-07-22", total: 144 },
  { date: "2026-07-23", total: 145 },
];

const sameDay = updateSnapshots(original, 146, "2026-07-23");
assert.deepEqual(sameDay, [
  { date: "2026-07-22", total: 144 },
  { date: "2026-07-23", total: 146 },
]);
assert.deepEqual(original, [
  { date: "2026-07-22", total: 144 },
  { date: "2026-07-23", total: 145 },
]);

const nextDay = updateSnapshots(sameDay, 145, "2026-07-24");
assert.deepEqual(nextDay.at(-1), { date: "2026-07-24", total: 145 });
assert.deepEqual(updateSnapshots(nextDay, 145, "2026-07-25"), nextDay);
assert.throws(
  () => updateSnapshots(nextDay, 147, "2026-07-20"),
  /Cannot record 2026-07-20/
);

assert.doesNotThrow(() => validateHistory({ repository, snapshots: nextDay }));
assert.throws(
  () =>
    validateHistory({
      repository,
      snapshots: [
        { date: "2026-07-23", total: 145 },
        { date: "2026-07-23", total: 146 },
      ],
    }),
  /Invalid star history snapshot/
);
assert.throws(
  () =>
    validateHistory({
      repository,
      snapshots: [{ date: "2026-02-31", total: 145 }],
    }),
  /Invalid star history snapshot/
);

const svg = renderChart(nextDay);
assert.match(svg, /Daily aggregate GitHub star snapshots/);
assert.match(svg, />145<\/text>/);
assert.match(svg, /Latest snapshot Jul 2026/);

(async () => {
  const total = await fetchCurrentStarCount(async (url, options) => {
    assert.equal(url, "https://api.github.com/repos/kubai087/lumno-extension");
    assert.equal(options.headers.Accept, "application/vnd.github+json");
    return {
      ok: true,
      async json() {
        return { stargazers_count: 147 };
      },
    };
  });
  assert.equal(total, 147);

  await assert.rejects(
    () =>
      fetchCurrentStarCount(async () => ({
        ok: false,
        status: 403,
        async json() {
          return { message: "Forbidden" };
        },
      })),
    /HTTP 403: Forbidden/
  );

  console.log("Star history snapshot tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
