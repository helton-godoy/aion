## 2025-04-12 - MemoryManager Disk I/O Bottlenecks
**Learning:** Checking `fs.pathExists` before `fs.readFile` or `fs.stat` doubles the disk I/O operations unnecessarily and introduces race conditions. Additionally, performing sequential independent file operations when fetching status blocks the event loop synchronously.
**Action:** Always handle `ENOENT` errors natively via `try/catch` for file operations instead of preceding them with `fs.pathExists`. Use `Promise.all` to execute independent file checks and read operations concurrently to maximize I/O throughput.
