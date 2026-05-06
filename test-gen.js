const { spawnSync } = require('child_process');

console.log("Generating users resource...");
const res = spawnSync('bunx', ['nest', 'g', 'resource', 'assigment', '--no-spec'], {
  input: "\ny\n", // New line for "REST API", "y" for "Generate CRUD entry points"
  stdio: ['pipe', 'inherit', 'inherit']
});
console.log("Done. Exit code:", res.status);
