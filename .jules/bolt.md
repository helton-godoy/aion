## 2024-05-18 - [Optimizing Safety Protocol State Capture]
**Learning:** Sequential `fs.pathExists` followed by `fs.readFile` and `fs.stat` operations inside a loop create an I/O bottleneck in the safety protocol's rollback preparation. Handling native `ENOENT` errors avoids extra `stat` calls, and `Promise.all` allows parallel execution of independent I/O tasks.
**Action:** When performing file system operations, avoid checking for existence before reading/writing; instead, try the operation and handle `ENOENT`. Use `Promise.all` to parallelize independent file processing loops.
