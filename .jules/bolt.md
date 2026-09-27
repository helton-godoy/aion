## 2025-05-25 - Promise.all Map Ordering Safety
**Learning:** When executing I/O concurrently using `Promise.all(array.map(...))` and dynamically assigning to a state object based on file path resolution order, the assignment order becomes non-deterministic based on whichever promise resolves first. This can lead to unpredictable test assertions or snapshot differences.
**Action:** Resolve the concurrent promises to an array of results first, then synchronously iterate over that array to populate the target object, preserving the original array order.
