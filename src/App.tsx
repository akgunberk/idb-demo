import "./App.css";
import { appDBManager } from "./storage/DBManager";

function App() {
  return (
    <div>
      <h1>Indexed DB Demo</h1>
      <div className="buttons">
        <button onClick={setValues}>SET</button>
        <button onClick={getValues}>GET</button>
        <button onClick={setAll}>SETALL</button>
        <button onClick={getAll}>GETALL</button>
        <button onClick={deleteAll}>DELETEALL</button>
        <button onClick={query}>QUERY</button>
      </div>
    </div>
  );

  async function setValues() {
    await appDBManager.set("sessions")({
      id: 1,
      name: "tinyman",
      dummyArray: [1, 4, 5],
      dummyObject: {
        a: 1,
        b: [12, 3, 4, 5],
        c: new Date(),
      },
    });
  }

  async function getValues() {
    const entry = await appDBManager.get("sessions")(1);

    console.log({ entry });
  }

  async function setAll() {
    await appDBManager.setAll("sessions")([
      {
        id: 1,
        name: "tinyman",
        dummyArray: [1, 2, 3],
        dummyObject: {
          a: 1,
          b: [12, 3, 4, 5],
          c: new Date(),
        },
      },
      {
        id: 2,
        name: "tinyman2",
        dummyArray: [3, 4, 5],
        dummyObject: {
          a: 1,
          b: [12, 3, 4, 5],
          c: new Date(),
        },
      },
      {
        id: 3,
        name: "tinyman3",
        dummyArray: [6, 7, 8],
        dummyObject: {
          a: 1,
          b: [12, 3, 4, 5],
          c: new Date(),
        },
      },

      {
        id: 4,
        name: "tinyman4",
        dummyArray: [6, 7, 8],
        dummyObject: {
          a: 1,
          b: [12, 3, 4, 5],
          c: new Date(),
        },
      },
      {
        id: 5,
        name: "tinyman5",
        dummyArray: [6, 7, 8],
        dummyObject: {
          a: 1,
          b: [12, 3, 4, 5],
          c: new Date(),
        },
      },
    ]);
  }

  async function deleteAll() {
    // uses objectStore.clear() underneath
    // const allSessions = await appDBManager.reset();

    const dbRequest = appDBManager.connectDB();

    dbRequest.onerror = (error) => console.error(error);

    dbRequest.onsuccess = (event: any) => {
      console.log({ event });

      const db = event.target.result as IDBDatabase;

      console.log({ db });

      // txn could be opened for multiple objectStores
      // db.transaction("accounts");
      // db.transaction("sessions");
      const txnRequest = db.transaction(["sessions", "accounts"], "readwrite");

      txnRequest.objectStore("sessions").clear();

      txnRequest.onerror = (error) => console.error(error);

      txnRequest.oncomplete = () => console.log("sessions cleared");
    };
  }

  async function getAll() {
    const allSessions = await appDBManager.getAllValues("sessions");

    console.log({ allSessions });
  }

  async function query() {
    console.log("");

    // const keyRangeOnly = IDBKeyRange.only(1);
    // const keyRange = keyRangeOnly;

    // lower,upper,isLowerOpen,isUpperOpen
    const keyRangeBound = IDBKeyRange.bound(2, 4, false, false);
    const keyRange = keyRangeBound;

    const queriedValues = await appDBManager.getAllValues("sessions", {
      keyRange,
      isEncrypted: false,
    });

    console.log({ queriedValues });
  }
}

export default App;
