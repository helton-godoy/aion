## 2024-05-19 - Concurrent File I/O Optimization
**Learning:** Sequential disk I/O using `fs.pathExists`, `fs.readFile`, and `fs.stat` is inefficient. The "Easier to Ask for Forgiveness than Permission" (EAFP) pattern utilizing native `ENOENT` handling eliminates redundant checks.
**Action:** Always prefer `try/catch` with `ENOENT` checking combined with `Promise.all` for concurrent file I/O instead of defensive `fs.pathExists` sequential checks.
