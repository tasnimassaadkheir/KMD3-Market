// =============================================================================
// API tests: runs the Postman collection (postman/) from the command line with Newman.
// -----------------------------------------------------------------------------
// These tests call the REAL Supabase API, so they need a real login.
// The login is read from environment variables, never stored in the repository:
//
//   KMD3_EMAIL=you@example.com KMD3_PASSWORD=yourpassword npm run test:api
//
// Without those variables the run is skipped (exit code 0), so it never breaks CI.
// The collection creates a "[POSTMAN TESTE]" condo and deletes it at the end.
// =============================================================================
const path = require("node:path");
const newman = require("newman");

const email = process.env.KMD3_EMAIL;
const password = process.env.KMD3_PASSWORD;
if (!email || !password) {
  console.log("Skipping API tests: set KMD3_EMAIL and KMD3_PASSWORD to run them.");
  process.exit(0);
}

const dir = path.join(__dirname, "..", "..", "postman");
newman.run(
  {
    collection: require(path.join(dir, "KMD3_Market_API.postman_collection.json")),
    environment: require(path.join(dir, "KMD3_Market.postman_environment.json")),
    envVar: [
      { key: "user_email", value: email },
      { key: "user_password", value: password },
    ],
    reporters: ["cli"],
  },
  (err, summary) => {
    if (err) { console.error(err); process.exit(1); }
    process.exit(summary.run.failures.length ? 1 : 0);
  },
);
