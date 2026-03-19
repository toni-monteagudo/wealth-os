const { execSync } = require("child_process");

try {
  execSync("docker start personal-finances-v2-mongo-1", { stdio: "ignore" });
  console.log("MongoDB started.");
} catch {
  console.log("Container not found, running docker compose...");
  execSync("docker compose up mongo -d", { stdio: "inherit" });
}
