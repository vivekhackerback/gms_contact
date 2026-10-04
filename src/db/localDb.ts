import AsyncStorage from '@react-native-async-storage/async-storage';
import { FullContact, DashboardStats } from '../types/contact';

const STORAGE_KEY_CONTACTS = 'gms_school_contacts_local';
const STORAGE_KEY_SETTINGS = 'gms_school_settings';

class LocalDatabase {
  private cache: FullContact[] | null = null;

  async init(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTS);
      if (!raw) {
        this.cache = [];
        await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify([]));
      } else {
        this.cache = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('LocalDatabase init error:', e);
      this.cache = [];
    }
  }

  async getAll(): Promise<FullContact[]> {
    if (!this.cache) {
      await this.init();
    }
    return this.cache ? [...this.cache] : [];
  }

  async getById(idOrLocalId: string | number): Promise<FullContact | null> {
    const contacts = await this.getAll();
    const str = String(idOrLocalId);
    return contacts.find(c => c.local_id === str || String(c.server_id) === str || String(c.id) === str) || null;
  }

  async save(contact: FullContact): Promise<FullContact> {
    const contacts = await this.getAll();
    const index = contacts.findIndex(c => c.local_id === contact.local_id || (contact.server_id && c.server_id === contact.server_id));

    if (index >= 0) {
      contacts[index] = {
        ...contacts[index],
        ...contact,
        updated_at: new Date().toISOString()
      };
    } else {
      if (!contact.local_id) {
        contact.local_id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      contact.created_at = contact.created_at || new Date().toISOString();
      contact.updated_at = new Date().toISOString();
      contacts.unshift(contact);
    }

    this.cache = contacts;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    return contact;
  }

  async delete(idOrLocalId: string | number): Promise<boolean> {
    const contacts = await this.getAll();
    const str = String(idOrLocalId);
    const filtered = contacts.filter(c => c.local_id !== str && String(c.server_id) !== str);
    this.cache = filtered;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(filtered));
    return true;
  }

  async getPendingSync(): Promise<FullContact[]> {
    const contacts = await this.getAll();
    return contacts.filter(c => c.sync_status === 'pending_sync');
  }

  async markAsSynced(localId: string, serverId: number): Promise<void> {
    const contacts = await this.getAll();
    const contact = contacts.find(c => c.local_id === localId);
    if (contact) {
      contact.server_id = serverId;
      contact.sync_status = 'synced';
      contact.sync_version = (contact.sync_version || 1) + 1;
      this.cache = contacts;
      await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    }
  }

  async replaceAll(newContacts: FullContact[]): Promise<void> {
    this.cache = newContacts;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(newContacts));
  }

  async clear(): Promise<void> {
    this.cache = [];
    await AsyncStorage.removeItem(STORAGE_KEY_CONTACTS);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const contacts = await this.getAll();
    const active = contacts.filter(c => c.status === 'Active');

    const byType = {
      student: 0,
      parent: 0,
      teacher: 0,
      staff: 0,
      driver: 0,
      management: 0,
      other: 0
    };

    active.forEach(c => {
      if (byType[c.contact_type] !== undefined) {
        byType[c.contact_type]++;
      } else {
        byType.other++;
      }
    });

    const pending = contacts.filter(c => c.sync_status === 'pending_sync').length;
    const synced = contacts.filter(c => c.sync_status === 'synced').length;

    return {
      total_contacts: active.length,
      by_type: byType,
      pending_sync: pending,
      synced: synced
    };
  }
}

export const localDb = new LocalDatabase();
