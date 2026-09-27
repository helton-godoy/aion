## 2024-05-24 - Efficient file system checks
**Learning:** Checking `fs.pathExists` before `fs.readJSON`, `fs.readFile`, or `fs.stat` is an I/O performance anti-pattern. Node.js native `fs` methods throw `ENOENT` errors when a file doesn't exist.
**Action:** Instead of calling `fs.pathExists` and then `fs.readJSON`/`fs.readFile`, use a `try/catch` block and check for `error.code === 'ENOENT'` to handle the missing file case.

## 2024-05-24 - Parallelized chunking and key ordering
**Learning:** Using chunked `Promise.all` can parallelize `fs.readFile` and `fs.stat` without causing EMFILE limits. However, returning asynchronous results and directly applying them to state objects can result in out-of-order keys compared to synchronous processing.
**Action:** When using chunked `Promise.all` to fetch file statistics concurrently, collect the promise results into a temporary array in the original order before synchronously iterating to apply them to deterministic objects like `state.files`.
