## 2024-05-15 - Redundant Path Checks Block Concurrency
**Learning:** Checking `fs.pathExists` before running `fs.readFile` and `fs.stat` introduces sequential overhead and creates a race condition. It's better to run operations concurrently with `Promise.all` and rely on native `ENOENT` error handling, especially when dealing with lists of files.
**Action:** Use `Promise.all` with `try/catch` to map across file arrays for concurrent I/O, omitting explicit existence checks where native error propagation is sufficient.
