## 2024-06-27 - Optimize File System Checks
**Learning:** Using `fs.pathExists` before reading/stating files is an anti-pattern as it adds unnecessary I/O overhead. Additionally, processing unbounded file arrays concurrently using `Promise.all` can lead to `EMFILE` errors.
**Action:** Use `try/catch` with `ENOENT` error handling when checking for file existence instead of `fs.pathExists`. Use chunked `Promise.all` (e.g., chunk size 20) when processing many files concurrently to prevent EMFILE errors, while maintaining a synchronous array push to preserve deterministic key insertion order.
