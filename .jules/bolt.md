## 2024-07-06 - Optimized captureCurrentState in SafetyProtocol
**Learning:** Checking `fs.pathExists` before running `fs.readFile` / `fs.stat` introduces unnecessary double I/O and creates a minor race condition. It's more performant to handle `ENOENT` errors natively via try/catch blocks. Further, chunking concurrent `Promise.all` operations and collecting results sequentially preserves deterministic order while maximizing parallel I/O capabilities.
**Action:** Always prefer handling `ENOENT` over explicit `pathExists` checks for concurrent file access logic.
