## 2025-06-19 - Parallelizing I/O without fs.pathExists
**Learning:** Checking `fs.pathExists` before running `fs.readFile` and `fs.stat` introduces a redundant disk I/O operation. Moreover, processing an un-chunked unbounded number of files concurrently leads to EMFILE limits and spikes in memory.
**Action:** Use chunked array execution with `Promise.all` across mapped `fs.readFile`/`fs.stat` parallel calls and properly handle native `ENOENT` exception errors natively instead of validating with `pathExists` first.
