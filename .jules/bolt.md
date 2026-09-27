## 2026-04-24 - File I/O Optimization in Node.js
**Learning:** Node.js applications often use a sequential TOCTOU (Time-Of-Check to Time-Of-Use) pattern by calling `fs.pathExists` before `fs.readFile` or `fs.stat`. This doubles the I/O cost. Using try-catch blocks to catch `ENOENT` directly halves disk access.
**Action:** Whenever checking file existence immediately before a read or stat operation, switch to directly calling `fs.readFile` or using parallel `Promise.all([fs.stat...])` and handling the `ENOENT` error instead of explicitly checking `pathExists` beforehand.
