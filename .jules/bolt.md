## 2025-02-20 - Optimizing file system checks
**Learning:** Checking `fs.pathExists` before running file operations like `fs.readJSON` or `fs.readFile` introduces a race condition and adds unnecessary disk I/O latency. Node APIs like `fs-extra` throw an error with `code: 'ENOENT'` natively when a file is missing.
**Action:** When working with file system operations, avoid pre-checks with `fs.pathExists`. Instead, use `try/catch` and gracefully handle the `ENOENT` error to avoid unnecessary disk operations, saving IO cycles.
