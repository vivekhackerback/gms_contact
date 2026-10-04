const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, 'school_contacts_db.json');

// Normalized in-memory structure with JSON persistence
const initialData = {
  contacts: [],
  students: [],
  parents: [],
  student_parent: [],
  teachers: [],
  staff: [],
  drivers: [],
  management: [],
  counters: {
    contacts: 0,
    students: 0,
    parents: 0,
    student_parent: 0,
    teachers: 0,
    staff: 0,
    drivers: 0,
    management: 0
  }
};

let store = null;

function loadStore() {
  if (store) return store;
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf8');
      store = JSON.parse(raw);
    } else {
      store = JSON.parse(JSON.stringify(initialData));
      saveStore();
    }
  } catch (err) {
    console.error('Error loading db file, resetting:', err);
    store = JSON.parse(JSON.stringify(initialData));
    saveStore();
  }
  return store;
}

function saveStore() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

function nextId(table) {
  if (!store.counters) store.counters = {};
  if (!store.counters[table]) store.counters[table] = 0;
  store.counters[table]++;
  return store.counters[table];
}

const db = {
  load: loadStore,
  save: saveStore,
  nextId,
  getStore: () => loadStore()
};

module.exports = db;
