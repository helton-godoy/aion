## 2025-03-05 - File I/O Concurrency Pattern in RollbackManager
**Learning:** Rollback generation involves heavy file reading. Sequential loops block the main thread and slow down state capturing significantly for large change sets. `fs.pathExists` is an unnecessary overhead before reading files.
**Action:** Always prefer chunked `Promise.all` (e.g., chunk size 20 to avoid EMFILE) to read and stat files concurrently. Handle existence checks by catching `ENOENT` during the `readFile` call to eliminate TOCTOU (Time of check to time of use) race conditions and reduce disk operations.
