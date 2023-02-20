type ValueOf<T> = T[keyof T];

type DBManagerTable = {
  name: string;
  keypath?: string | string[];
  autoIncrement: boolean;
  indexes?: Parameters<IDBObjectStore["createIndex"]>[];
};
type DBManagerTables = DBManagerTable[];

// If you change the structure of the tables, you must increment this version number.
export const INDEXED_DB_VERSION = 1;

export const INDEXED_DB_NAME = "idb-demo";

class DBManager<Model extends { [x: string]: any }> {
  private databaseName: string | null = null;
  private tables: DBManagerTables | null = null;

  /**
   * Simple and minimalistic wrapper for browser's IndexedDB API
   * Details on: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
   *
   * @param database The name of the database
   * @param tables The tables to create in the objectStore
   */
  constructor(database: string, tables: DBManagerTables) {
    this.databaseName = database;
    this.tables = tables;

    this.connectDB();
  }

  connectDB(): IDBOpenDBRequest {
    if (!this.tables || !this.databaseName) {
      throw new Error(
        "Please provide a valid databaseName and database tables schema"
      );
    }

    const { tables } = this;

    const dbRequest = indexedDB.open(this.databaseName!, INDEXED_DB_VERSION);

    // If the database requires an upgrade
    dbRequest.onupgradeneeded = () => {
      tables.forEach((table) => {
        // If the table doesn't exist, create it
        if (!dbRequest.result.objectStoreNames.contains(table.name)) {
          const objectStore = dbRequest.result.createObjectStore(table.name, {
            keyPath: table.keypath,
          });

          // create  indexes
          if (table?.indexes) {
            for (const index of table.indexes) {
              const [name, keyPath, options] = index;

              objectStore.createIndex(name, keyPath, options);
            }
          }
        }
      });
    };

    return dbRequest;
  }

  public get<T extends keyof Model>(table: T) {
    const dbRequest = this.connectDB();

    return <K extends keyof Model[T] | Model[T][number]>(
      key: K
    ): Promise<Model[T][K]> =>
      new Promise((resolve, reject) => {
        dbRequest.onerror = (error) => {
          console.error(error);

          reject(error);
        };

        dbRequest.onsuccess = (event: Event) => {
          try {
            const transaction = (
              event.target as IDBRequest<IDBDatabase>
            ).result.transaction(table as string, "readwrite");
            const objectStore = transaction.objectStore(table as string);

            const tableRequest: IDBRequest<ValueOf<Model[T]>> = objectStore.get(
              key as IDBValidKey
            );

            tableRequest.onerror = (error: any) => {
              reject(error);
            };

            tableRequest.onsuccess = async () => {
              try {
                resolve(tableRequest.result);
              } catch (error) {
                console.error(error);

                reject(error);
              }
            };
          } catch (error) {
            reject(error);
          }
        };
      });
  }

  public getAllValues<T extends keyof Model, K extends boolean = true>(
    table: T,
    options?: K extends true
      ? { isEncrypted: K; indexName?: string; keyRange?: never }
      : { isEncrypted: K; indexName?: string; keyRange?: IDBKeyRange }
  ): Promise<(K extends true ? string : ValueOf<Model[T]>)[]> {
    const dbRequest = this.connectDB();

    return new Promise((resolve, reject) => {
      dbRequest.onerror = (error) => {
        console.error(error);

        reject(error);
      };

      dbRequest.onsuccess = (event: Event) => {
        try {
          const { keyRange, indexName } = options || {};

          const transaction = (
            event.target as IDBRequest<IDBDatabase>
          ).result.transaction(table as string, "readwrite");
          let objectStore: IDBObjectStore | IDBIndex = transaction.objectStore(
            table as string
          );

          if (indexName) {
            objectStore = objectStore.index(indexName);
          }

          const getAllValuesRequest = objectStore.getAll(keyRange);

          getAllValuesRequest.onsuccess = (ev: any) => {
            resolve(
              (<K extends true ? string[] : Model[T][]>(
                ev.target.result
              )) as string[]
            );
          };
          getAllValuesRequest.onerror = (error) => {
            reject(error);
          };
        } catch (error) {
          reject(error);
        }
      };
    });
  }

  public getAllKeys<T extends keyof Model>(table: T): Promise<IDBValidKey[]> {
    const dbRequest = this.connectDB();

    return new Promise((resolve, reject) => {
      dbRequest.onerror = (error) => {
        reject(error);
      };

      dbRequest.onsuccess = () => {
        const transaction = dbRequest.result.transaction(
          [table as string],
          "readwrite"
        );
        const objectStore = transaction.objectStore(table as string);

        const tableRequest = objectStore.getAllKeys();

        tableRequest.onerror = (error: any) => {
          reject(error);
        };

        tableRequest.onsuccess = () => {
          resolve(tableRequest.result);
        };
      };
    });
  }

  public set<T extends keyof Model>(table: T) {
    const dbRequest = this.connectDB();

    return <K extends keyof Model[T], V extends ValueOf<Model[T]>>(
      value: V,
      key?: K
    ): Promise<string> =>
      new Promise((resolve, reject) => {
        dbRequest.onerror = (error) => {
          console.error(error);

          reject(error);
        };

        dbRequest.onsuccess = async () => {
          try {
            const transaction = dbRequest.result.transaction(
              [table as string],
              "readwrite"
            );
            const objectStore = transaction.objectStore(table as string);

            if (value) {
              const tableRequest = key
                ? objectStore.put(value, key as IDBValidKey)
                : objectStore.put(value);

              tableRequest.onerror = (error: any) => {
                reject(error);
              };

              tableRequest.onsuccess = () => {
                resolve(tableRequest.result as string);
              };
            }
          } catch (error) {
            console.error(error);

            reject(error);
          }
        };
      });
  }

  public setAll<T extends keyof Model>(table: T) {
    const dbRequest = this.connectDB();

    return <V extends Model[T]>(entries: ValueOf<V>[]): Promise<boolean> =>
      new Promise((resolve, reject) => {
        dbRequest.onerror = (error) => {
          console.error(error);

          reject(error);
        };

        dbRequest.onsuccess = () => {
          const transaction = dbRequest.result.transaction(
            [table as string],
            "readwrite"
          );

          for (const entry of entries) {
            transaction.objectStore(table as string).put(entry);
          }

          transaction.oncomplete = () => {
            resolve(true);
          };

          transaction.onerror = (error) => {
            console.error(error);
            reject(error);
          };
        };
      });
  }

  public delete<T extends keyof Model>(table: T) {
    const dbRequest = this.connectDB();

    return (key: string): Promise<ValueOf<Model[T]>> =>
      new Promise((resolve, reject) => {
        dbRequest.onerror = (error) => {
          console.error(error);

          reject(error);
        };

        dbRequest.onsuccess = () => {
          try {
            const transaction = dbRequest.result.transaction(
              [table as string],
              "readwrite"
            );
            const objectStore = transaction.objectStore(table as string);
            const tableRequest = objectStore.delete(key);

            tableRequest.onerror = (error: any) => {
              reject(error);
            };

            tableRequest.onsuccess = () => {
              resolve(tableRequest.result);
            };
          } catch (error) {
            console.error(error);

            reject(error);
          }
        };
      });
  }

  public clearTable<T extends keyof Model>(tables: T[]) {
    const dbRequest = this.connectDB();

    return new Promise((resolve, reject) => {
      dbRequest.onerror = (error) => {
        console.error(error);

        reject(error);
      };

      dbRequest.onsuccess = () => {
        try {
          const transaction = dbRequest.result.transaction(
            tables as string[],
            "readwrite"
          );

          tables.forEach((table) => {
            transaction.objectStore(table as string).clear();
          });

          transaction.onerror = (error: any) => {
            reject(error);
          };

          transaction.oncomplete = () => {
            resolve(true);
          };
        } catch (error) {
          console.error(error);

          reject(error);
        }
      };
    });
  }

  public reset() {
    const dbRequest = this.connectDB();

    return new Promise((resolve, reject) => {
      dbRequest.onerror = (error) => {
        console.error(error);
        reject(error);
      };

      dbRequest.onsuccess = () => {
        this.tables?.forEach((table) => {
          const transaction = dbRequest.result.transaction(
            table.name,
            "readwrite"
          );
          const objectStore = transaction.objectStore(table.name);

          objectStore.clear();

          transaction.onerror = (error) => {
            console.error(error);
            reject(error);
          };
        });
        resolve(dbRequest.result);
      };
    });
  }
}

export const appDBTables: DBManagerTables = [
  { name: "accounts", autoIncrement: false },
  { name: "sessions", keypath: "id", autoIncrement: false },
];

export const appDBManager = new DBManager<{
  sessions: Record<
    string,
    {
      id: number;
      name: string;
      dummyArray: number[];
      dummyObject: Record<string, any>;
    }
  >;
  accounts: Record<string, { address: string; name: string; pk: string }>;
}>(INDEXED_DB_NAME, appDBTables);
