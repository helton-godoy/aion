## 2024-06-05 - Avoid Redundant `fs.pathExists` Checks

**Learning:** When reading files, checking if they exist via `fs.pathExists` before `fs.readJSON` or `fs.readFile` introduces an extra, unnecessary I/O operation. In `SafetyProtocol` and `MemoryManager`, these redundant checks were removed in favor of `try/catch` logic that handles `ENOENT` natively, optimizing file state captures by a significant amount.

**Action:** Consistently use `try/catch` and target the `ENOENT` error code specifically rather than doing explicit existence checks. Parallelize multiple `fs` operations using `Promise.all` instead of executing them sequentially (like reading a file while also stating it).
