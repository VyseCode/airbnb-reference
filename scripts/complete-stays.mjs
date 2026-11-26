const BASE_URL = process.env.APP_URL || "http://127.0.0.1:3206";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("Set CRON_SECRET before running the stay-completion job.");
  process.exit(1);
}

const response = await fetch(`${BASE_URL}/api/cron/complete-stays`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const data = await response.json();
console.log(JSON.stringify(data));
if (!response.ok) process.exit(1);
