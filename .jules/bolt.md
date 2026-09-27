## 2024-05-24 - fs.pathExists Bottleneck
**Learning:** Checking `fs.pathExists` right before `fs.readFile` and `fs.stat` adds unnecessary sequential I/O overhead. Node.js native errors already catch `ENOENT` (file not found).
**Action:** Remove `fs.pathExists` checks before `fs.readFile`/`fs.stat` and use try/catch on `ENOENT` natively to boost performance.
