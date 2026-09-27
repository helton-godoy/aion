## 2025-04-10 - Optimizing fs-extra disk I/O
**Learning:** Checking `fs.pathExists` before attempting to read or stat a file with `fs-extra` is an architectural bottleneck for file system I/O, particularly for hot code paths like `MemoryManager.getContext`. It effectively doubles disk I/O operations because the existence check does its own stat internally.
**Action:** Remove explicit `fs.pathExists` checks. Instead, use `try/catch` around `fs.readFile` or `Promise.allSettled` around `fs.stat` and explicitly catch the `ENOENT` error code to handle non-existent files.
