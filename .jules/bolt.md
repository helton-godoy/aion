## 2025-06-03 - [Parallelized Disk I/O with ENOENT Catching for captureCurrentState]
**Learning:** Checking `fs.pathExists` sequentially before performing read operations creates a major bottleneck in state capturing. Parallel chunking with try/catch (`ENOENT`) avoids race conditions and doubles speed while respecting OS file handle limits.
**Action:** Use chunked `Promise.all` with optimistic reads (handling ENOENT) instead of pessimistic `pathExists` checks for bulk file operations.
