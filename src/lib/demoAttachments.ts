export interface DemoAttachmentStore {
  put(id: string, blob: Blob): Promise<void>
  get(id: string): Promise<Blob | undefined>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}

let testStore: DemoAttachmentStore | null = null
export function setDemoAttachmentStoreForTests(store: DemoAttachmentStore | null) { testStore = store }

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('IndexedDB unavailable')); return }
    const request = indexedDB.open('pet-worth-demo', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('medical-attachments')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function operation<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('medical-attachments', mode)
    const request = run(transaction.objectStore('medical-attachments'))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

const indexedDbStore: DemoAttachmentStore = {
  put: async (id, blob) => { await operation('readwrite', (store) => store.put(blob, id)) },
  get: (id) => operation('readonly', (store) => store.get(id)),
  delete: async (id) => { await operation('readwrite', (store) => store.delete(id)) },
  clear: async () => { await operation('readwrite', (store) => store.clear()) },
}

function store() { return testStore ?? indexedDbStore }
export const putDemoAttachment = (id: string, blob: Blob) => store().put(id, blob)
export const getDemoAttachment = (id: string) => store().get(id)
export const deleteDemoAttachment = (id: string) => store().delete(id)
export const clearDemoAttachments = () => !testStore && !globalThis.indexedDB ? Promise.resolve() : store().clear()
