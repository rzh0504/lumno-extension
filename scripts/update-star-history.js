const fs = require("node:fs");
const path = require("node:path");

const repository = process.env.GITHUB_REPOSITORY || "kubai087/lumno-extension";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const outputPath = path.join(__dirname, "..", "assets", "star-history.svg");

if (!token) {
  console.error("GITHUB_TOKEN or GH_TOKEN is required to read stargazer timestamps.");
  process.exit(1);
}

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

async function fetchStargazers() {
  const timestamps = [];

  for (let page = 1; ; page += 1) {
    const url = new URL(`https://api.github.com/repos/${repository}/stargazers`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.star+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "lumno-star-history-workflow",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub stargazers request failed with HTTP ${response.status}.`);
    }

    const pageItems = await response.json();
    for (const item of pageItems) {
      if (item.starred_at) timestamps.push(item.starred_at);
    }

    if (pageItems.length < 100) break;
  }

  return timestamps.sort();
}

function renderChart(timestamps) {
  const width = 960;
  const height = 500;
  const plot = { left: 86, right: 916, top: 116, bottom: 414 };
  const safeRepository = escapeXml(repository);

  const totalsByDay = new Map();
  for (const timestamp of timestamps) {
    const day = timestamp.slice(0, 10);
    totalsByDay.set(day, (totalsByDay.get(day) || 0) + 1);
  }

  let runningTotal = 0;
  const dailyTotals = [...totalsByDay].map(([day, count]) => {
    runningTotal += count;
    return { day, total: runningTotal };
  });

  const fallbackDay = new Date().toISOString().slice(0, 10);
  const firstDay = dailyTotals[0]?.day || fallbackDay;
  const lastDay = dailyTotals.at(-1)?.day || fallbackDay;
  const firstTime = Date.parse(`${firstDay}T00:00:00Z`);
  const rawLastTime = Date.parse(`${lastDay}T00:00:00Z`);
  const lastTime = rawLastTime === firstTime ? firstTime + 86_400_000 : rawLastTime;
  const totalStars = timestamps.length;
  const yStep = niceStep(Math.max(totalStars, 1) / 5);
  const yMax = Math.max(yStep, Math.ceil(Math.max(totalStars, 1) / yStep) * yStep);
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
    ? `Latest star recorded ${formatDate(rawLastTime)}`
    : "No stars recorded yet";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="500" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${safeRepository} GitHub star growth</title>
  <desc id="description">Cumulative GitHub stars over time. Current total: ${totalStars}.</desc>
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
  const timestamps = await fetchStargazers();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderChart(timestamps));
  console.log(`Updated ${path.relative(process.cwd(), outputPath)} with ${timestamps.length} stars.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
