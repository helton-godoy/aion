
## 2025-06-07 - [Concurrent fs-extra File State Capture]
**Learning:** Sequential file iteration checking `fs.pathExists` followed by `fs.readFile` and `fs.stat` causes severe I/O bottlenecks in operations over arrays like git commits.
**Action:** When capturing multiple file states, execute concurrent promises in chunks using `Promise.all` while catching `ENOENT` natively to avoid explicit existence checks. Ensure the resulting promises are iterated synchronously after resolution to maintain deterministic map/object key ordering required for hash consistency.
