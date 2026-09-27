## 2024-05-18 - fs.pathExists Bottleneck
**Learning:** Checking `fs.pathExists` right before `fs.readFile` or `fs.stat` is an anti-pattern causing redundant disk I/O operations and performance bottlenecks.
**Action:** Use `try/catch` and catch `ENOENT` to optimize disk I/O when reading or statting files.
