## 2024-06-21 - [fs.pathExists Redundancy]
**Learning:** Checking `fs.pathExists` before `fs.readFile` or `fs.stat` is an anti-pattern that doubles file system I/O.
**Action:** Instead, try the operation directly (`fs.readFile` or `fs.stat`) and catch the `ENOENT` error. If you need both contents and stats, `Promise.all` can parallelize them, but if you don't even know if the file exists, you can just parallelize `fs.readFile` and `fs.stat`, both of which will fail efficiently if the file doesn't exist. Alternatively, you can restructure file state checks to avoid `pathExists` loops.
## 2024-06-21 - [fs.pathExists Redundancy in RollbackManager]
**Learning:** Sequential `fs.pathExists` checks in large file arrays (like RollbackManager's state capture) double I/O and block execution unnecessarily. Bounding concurrent file operations with chunks prevents EMFILE exhaustion while heavily parallelizing disk access.
**Action:** Replace `fs.pathExists` followed by `fs.readFile`/`fs.stat` loops with chunked `Promise.all` arrays that directly attempt the read/stat and natively handle `ENOENT` rejections.
