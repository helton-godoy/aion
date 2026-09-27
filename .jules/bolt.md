## 2024-10-24 - [Over-broad Error Catching in Promise.all]
**Learning:** When using `try/catch` with concurrent file operations (like `Promise.all([fs.readFile, fs.stat])`) to handle expected missing files (`ENOENT`), catching all errors silently masks genuine failures like `EACCES` (permission denied) or `EISDIR` (is a directory), which can corrupt safety module state representations.
**Action:** Always explicitly check for `error.code === 'ENOENT'` inside catch blocks when optimizing I/O. If the error is not `ENOENT`, the error must be re-thrown to avoid silent corruption.
