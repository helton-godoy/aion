## 2024-07-07 - Optimize captureCurrentState in RollbackManager
**Learning:** Checking for file existence before reading/stating is a redundant operation and causes unnecessary IO. In Node.js it's more performant to just do the read/stat and catch ENOENT. Furthermore, multiple read/stats inside a loop are sequential I/O which can be very slow.
**Action:** Use chunked Promise.all to load state files concurrently, and use try/catch to handle ENOENT.
