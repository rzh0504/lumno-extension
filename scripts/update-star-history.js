const fs = require("node:fs");
const path = require("node:path");

const repository = process.env.GITHUB_REPOSITORY || "kubai087/lumno-extension";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
const dataPath = path.join(__dirname, "..", "assets", "star-history-data.json");
const outputPath = path.join(__dirname, "..", "assets", "star-history.svg");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function niceStep(value) {
  if (value <= 0) return 1;

  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction;

  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * 10 ** exponent;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function isValidUtcDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateHistory(data) {
  if (!data || data.repository !== repository || !Array.isArray(data.snapshots)) {
    throw new Error(`Invalid star history data for ${repository}.`);
  }

  let previousDate = "";
  for (const snapshot of data.snapshots) {
    const validDate = isValidUtcDate(snapshot?.date);
    const validTotal = Number.isInteger(snapshot?.total) && snapshot.total >= 0;

    if (!validDate || !validTotal || snapshot.date <= previousDate) {
      throw new Error(`Invalid star history snapshot after ${previousDate || "the beginning"}.`);
    }
    previousDate = snapshot.date;
  }

  return data;
}

function updateSnapshots(snapshots, total, date) {
  if (
    !Number.isInteger(total) ||
    total < 0 ||
    !isValidUtcDate(date)
  ) {
    throw new Error("A non-negative star total and UTC date are required.");
  }

  const nextSnapshots = snapshots.map((snapshot) => ({ ...snapshot }));
  const latest = nextSnapshots.at(-1);

  if (latest?.date > date) {
    throw new Error(`Cannot record ${date} after the existing ${latest.date} snapshot.`);
  }

  if (latest?.date === date) {
    latest.total = total;
  } else if (!latest || latest.total !== total) {
    nextSnapshots.push({ date, total });
  }

  return nextSnapshots;
}

async function fetchCurrentStarCount(fetchImpl = fetch) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "lumno-star-history-workflow",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchImpl(`${apiUrl}/repos/${repository}`, { headers });
  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      if (payload?.message) detail = `: ${payload.message}`;
    } catch {
      // The status code still provides a useful failure when the body is not JSON.
    }
    throw new Error(`GitHub repository request failed with HTTP ${response.status}${detail}.`);
  }

  const payload = await response.json();
  if (!Number.isInteger(payload.stargazers_count) || payload.stargazers_count < 0) {
    throw new Error("GitHub repository response did not include a valid stargazers_count.");
  }

  return payload.stargazers_count;
}

function renderChart(snapshots) {
  const width = 960;
  const height = 500;
  const plot = { left: 86, right: 916, top: 116, bottom: 414 };
  const safeRepository = escapeXml(repository);
  const dailyTotals = snapshots.map(({ date, total }) => ({ day: date, total }));

  const fallbackDay = new Date().toISOString().slice(0, 10);
  const firstDay = dailyTotals[0]?.day || fallbackDay;
  const lastDay = dailyTotals.at(-1)?.day || fallbackDay;
  const firstTime = Date.parse(`${firstDay}T00:00:00Z`);
  const rawLastTime = Date.parse(`${lastDay}T00:00:00Z`);
  const lastTime = rawLastTime === firstTime ? firstTime + 86_400_000 : rawLastTime;
  const totalStars = dailyTotals.at(-1)?.total || 0;
  const maximumStars = Math.max(1, ...dailyTotals.map(({ total }) => total));
  const yStep = niceStep(maximumStars / 5);
  const yMax = Math.max(yStep, Math.ceil(maximumStars / yStep) * yStep);
  const xScale = (timestamp) =>
    plot.left + ((timestamp - firstTime) / (lastTime - firstTime)) * (plot.right - plot.left);
  const yScale = (value) =>
    plot.bottom - (value / yMax) * (plot.bottom - plot.top);

  const points = dailyTotals.map(({ day, total }) => ({
    x: xScale(Date.parse(`${day}T00:00:00Z`)),
    y: yScale(total),
  }));

  let linePath = "";
  let areaPath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x.toFixed(2)} ${plot.bottom} L ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let index = 1; index < points.length; index += 1) {
      linePath += ` L ${points[index].x.toFixed(2)} ${points[index - 1].y.toFixed(2)}`;
      linePath += ` L ${points[index].x.toFixed(2)} ${points[index].y.toFixed(2)}`;
    }
    areaPath = `${linePath} L ${points.at(-1).x.toFixed(2)} ${plot.bottom} Z`;
  }

  const yTicks = [];
  for (let value = 0; value <= yMax; value += yStep) {
    const y = yScale(value).toFixed(2);
    yTicks.push(
      `  <line class="grid" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}" />\n` +
        `  <text class="axis-label" x="${plot.left - 18}" y="${Number(y) + 5}" text-anchor="end">${value}</text>`
    );
  }

  const xTicks = [];
  const xTickCount = 5;
  for (let index = 0; index < xTickCount; index += 1) {
    const ratio = index / (xTickCount - 1);
    const timestamp = firstTime + (lastTime - firstTime) * ratio;
    const x = xScale(timestamp).toFixed(2);
    xTicks.push(
      `  <line class="tick" x1="${x}" y1="${plot.bottom}" x2="${x}" y2="${plot.bottom + 7}" />\n` +
        `  <text class="axis-label" x="${x}" y="${plot.bottom + 31}" text-anchor="middle">${escapeXml(formatDate(timestamp))}</text>`
    );
  }

  const latestPoint = points.at(-1);
  const latestMarker = latestPoint
    ? `<circle class="marker-ring" cx="${latestPoint.x.toFixed(2)}" cy="${latestPoint.y.toFixed(2)}" r="8" />
    <circle class="marker" cx="${latestPoint.x.toFixed(2)}" cy="${latestPoint.y.toFixed(2)}" r="4" />`
    : "";
  const statusText = totalStars
    ? `Latest snapshot ${formatDate(rawLastTime)}`
    : "No star snapshots recorded yet";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="500" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${safeRepository} GitHub star growth</title>
  <desc id="description">Daily aggregate GitHub star snapshots. Current total: ${totalStars}.</desc>
  <defs>
    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c5cff" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#7c5cff" stop-opacity="0.03" />
    </linearGradient>
  </defs>
  <style>
    .background { fill: #ffffff; stroke: #d8dee4; }
    .title { fill: #1f2328; font: 700 22px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .subtitle { fill: #656d76; font: 13px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .total { fill: #1f2328; font: 700 28px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .total-label { fill: #656d76; font: 12px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0.08em; }
    .grid { stroke: #d8dee4; stroke-width: 1; }
    .tick { stroke: #8c959f; stroke-width: 1; }
    .axis-label { fill: #656d76; font: 12px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .area { fill: url(#area-gradient); }
    .line { fill: none; stroke: #6e40ff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }
    .marker-ring { fill: #ffffff; stroke: #6e40ff; stroke-width: 2; }
    .marker { fill: #6e40ff; }
  </style>
  <rect class="background" x="0.5" y="0.5" width="959" height="499" rx="16" />
  <text class="title" x="44" y="52">GitHub Star Growth</text>
  <text class="subtitle" x="44" y="77">${safeRepository} · ${escapeXml(statusText)}</text>
  <text class="total" x="916" y="52" text-anchor="end">${totalStars}</text>
  <text class="total-label" x="916" y="75" text-anchor="end">TOTAL STARS</text>
${yTicks.join("\n")}
${xTicks.join("\n")}
  ${areaPath ? `<path class="area" d="${areaPath}" />` : ""}
  ${linePath ? `<path class="line" d="${linePath}" />` : ""}
  ${latestMarker}
</svg>
`;
}

async function main() {
  const data = validateHistory(JSON.parse(fs.readFileSync(dataPath, "utf8")));
  const total = await fetchCurrentStarCount();
  const date = new Date().toISOString().slice(0, 10);
  const snapshots = updateSnapshots(data.snapshots, total, date);

  fs.writeFileSync(dataPath, `${JSON.stringify({ repository, snapshots }, null, 2)}\n`);
  fs.writeFileSync(outputPath, renderChart(snapshots));
  console.log(
    `Updated ${path.relative(process.cwd(), outputPath)} and ${path.relative(
      process.cwd(),
      dataPath
    )} with ${total} stars.`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  fetchCurrentStarCount,
  niceStep,
  renderChart,
  updateSnapshots,
  validateHistory,
};
