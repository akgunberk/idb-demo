# Indexed DB [Reference MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

- IndexedDB is a low-level API for client-side storage of significant amounts of structured data, including files/blobs.
- It is async, do not block main thread. (like service workers)
- NoSQL Database
- Storage limit can be accepted as limitles. [More Info](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#storage_limits_and_eviction_criteria)

## Comparison with Local Storage

- Local Storage can only store strings / IDB can store every type including Blobs.
- LS limit is 5-10 MB / IDB up to 250MB depending on your browser implementation and your PC limitations.
- LS is sync / IDB is async

## IDB use cases

- Any kind of caching purposes
- Application with large data needs high-performant query language
- Offline support / Progressive Web Apps
  - Images and fetch requests can be cached and application will be much faster.
  - When offline, fetch requests or operations can be queued in IDB and performed when user gets online.
  - Pages can be cached and show stale data from IDB when user offline etc.

### Indexed DB Libraries

- [Dexie](https://dexie.org/docs/Tutorial/Getting-started)
  - Super detailed implementation of IDB, its experience is very close to query builder such as [Knex-js](https://knexjs.org/guide/query-builder.html#common)
- [idb-keyval](https://www.npmjs.com/package/idb-keyval)
  - smaller wrapper for basic methods such as `get`, `set`, `getMany`, `setMany` etc,

#### Opinions

- Asynchronicity makes the usage much harder but it enables its scalibility.
- Queries etc are super fast. If you get/set a row with a small key/val its nearly sync operations like LS.
  - Even composite keys can be queried with IDBKeyRange and boundaries.
  - Indexes can be created for faster read/query operations but it increases the storage ofc, so indexes should be created carefully.

---

- Security is a big issue, you can see your plain data when you open devtools and browsers does not cover your back and ensure it is secure.
  - It does not cover `encrypted-storage-middleware` by itself. Dexie has an implementation of this middleware.
  - Encrypting/Decrypting hurts scalibility/performance. These operations should be time consuming by its nature.
  - In `pera-web`, we use IDB for caching/querying purposes but we delete the DB if user locks the app or close the tab for security purposes.
    - Deleting is much faster than read/write operations.
