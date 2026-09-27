## 2024-04-18 - Anti-Pattern: Redundant fs.pathExists
**Learning:** `fs.pathExists` before file operations is a slow TOCTOU anti-pattern. Native `try/catch` with ENOENT checks paired with `Promise.all` yields superior performance and safety.
**Action:** Replace `fs.pathExists` and sequential reads with `Promise.all` + ENOENT fallback whenever performing operations on potentially non-existent files.
