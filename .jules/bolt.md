## 2024-05-18 - [Optimistic File I/O for State Capture]
**Learning:** Checking `fs.pathExists` before `fs.readFile` and `fs.stat` during state capture causes a double I/O tax per file. When evaluating multiple file changes, these operations were done sequentially within a loop.
**Action:** Use `Promise.all` to evaluate the file collection in parallel. For each file, omit the `fs.pathExists` check. Instead, speculatively try to fetch `fs.readFile` and `fs.stat` simultaneously using `Promise.all`. If either fails with `ENOENT`, gracefully handle the file as non-existent.
