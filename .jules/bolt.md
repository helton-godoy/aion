## 2024-03-24 - [Avoid `fs.pathExists` anti-pattern for concurrent file loading]
**Learning:** Checking `fs.pathExists` before reading a file via `fs.readFile` or `fs.stat` creates an inherent race condition and doubles file system I/O latency by performing two sequential kernel queries instead of one.
**Action:** When trying to determine existence and load contents concurrently, execute I/O ops directly (e.g., using `fs.readFile` and `fs.stat` inside `Promise.all()`) and use `try/catch` to gracefully catch the native `ENOENT` error. Map independent IO bounds synchronously while processing asynchronously in batches for deterministic outcomes and minimal blocking.

## 2024-09-27 - [Parallelize Independent Async Validation Gates]
**Learning:** Sequential `for...of` loops over independent async validators cause cumulative latency delays equal to the sum of individual gate execution times.
**Action:** Use `Promise.all(validators.map(v => v.validate(changes)))` to execute independent validation gates concurrently, reducing latency to `max(gate_time)` rather than `sum(gate_time)`.

## 2025-02-23 - [Parallelize N+1 Async File Operations in State Restoration]
**Learning:** Sequentially awaiting file system operations (`fs.ensureDir`, `fs.writeFile`, `fs.remove`) in a `for...of` loop causes cumulative I/O latency proportional to the number of files.
**Action:** Use `Promise.all` over `Object.entries(state.files).map(async ...)` to execute independent file restoration operations concurrently, drastically reducing state restoration latency (~81.3% speedup).
