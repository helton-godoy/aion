## 2025-03-30 - Replace redundant pathExists checks with try/catch

**Learning:** When performing file system operations with `fs-extra` (like `readFile` or `stat`), proactively checking if the path exists using `fs.pathExists` before acting on it causes two separate I/O operations. This double penalty becomes a measurable performance bottleneck in operations that iterate over many files simultaneously (like system state restoration or loading numerous rollback points).

**Action:** Prefer reacting to `ENOENT` exceptions natively. Directly invoke file system operations wrapped within a `try/catch` block, explicitly catching `error.code === 'ENOENT'` to handle the file absence. This effectively halves the number of I/O operations required when the file does exist.
