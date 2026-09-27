## 2024-05-24 - Optimizing I/O patterns
**Learning:** Using `fs.pathExists` immediately followed by `fs.readFile` or `fs.stat` doubles disk I/O operations unnecessarily and causes TOCTOU issues.
**Action:** Handle `ENOENT` natively when reading or statting files instead of pre-checking existence. Use `Promise.all` for parallel operations on multiple files.
