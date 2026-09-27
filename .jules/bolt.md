## 2024-03-31 - [I/O Optimization Pattern]
**Learning:** Found a common anti-pattern where file existence is checked sequentially (`fs.pathExists`) right before file access (`fs.stat` or `fs.readFile`). This results in unnecessary, doubled I/O calls which hurt performance and introduces a minor race condition risk.
**Action:** Consistently replaced the redundant `fs.pathExists` and `fs.stat`/`fs.readFile` with a single `try/catch` block handling the `ENOENT` error. This pattern optimizes fs-extra usage by leveraging native error handling and avoids duplicated I/O interactions.
