const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "audit.log");

/**
 * Append-only audit logger
 * Each entry = 1 JSON line
 */
function logAudit(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
}

module.exports = { logAudit };
