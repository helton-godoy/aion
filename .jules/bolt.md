## 2024-04-11 - Optimization Learnings
**Learning:** Redundant `fs.pathExists` calls before reading files create unnecessary disk I/O in Node.js.
**Action:** Optimize file operations by removing `fs.pathExists` and handling ENOENT natively inside a `try-catch` block, taking note of special handling with mock values in Jest tests.
