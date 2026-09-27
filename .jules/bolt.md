## 2025-03-01 - Avoid Double I/O and EMFILE in Bulk File Operations
**Learning:** Checking `fs.pathExists` before `fs.readFile` and `fs.stat` doubles disk I/O. Bulk processing without concurrency controls risks EMFILE errors.
**Action:** Use chunked `Promise.all` (e.g., limit 20) and `try/catch` `ENOENT` to optimize bulk concurrent file reading.
