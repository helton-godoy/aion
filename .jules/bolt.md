## 2024-03-24 - I/O Optimization in fs-extra
**Learning:** Checking for file existence before reading with `fs.pathExists` followed by `fs.readFile` (or `fs.readJSON`) is an anti-pattern that doubles disk I/O.
**Action:** Instead, attempt the read operation directly within a `try/catch` block and gracefully handle the `ENOENT` error. This reduces unnecessary system calls and improves file processing performance, especially when checking many missing/default files. Also using `Promise.all` for stats/readFile avoids serial disk I/O waits.
