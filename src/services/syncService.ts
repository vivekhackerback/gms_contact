import { localDb } from '../db/localDb';
import { apiService } from './api';
import { FullContact } from '../types/contact';

export interface SyncStatusReport {
  isSyncing: boolean;
  lastSyncTime: string | null;
  serverOnline: boolean;
  pendingCount: number;
  syncedCount: number;
  lastMessage: string;
}

class SyncService {
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private serverOnline = false;
  private listeners: Array<(report: SyncStatusReport) => void> = [];

  subscribe(listener: (report: SyncStatusReport) => void) {
    this.listeners.push(listener);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(message = '') {
    localDb.getDashboardStats().then(stats => {
      const report: SyncStatusReport = {
        isSyncing: this.isSyncing,
        lastSyncTime: this.lastSyncTime,
        serverOnline: this.serverOnline,
        pendingCount: stats.pending_sync,
        syncedCount: stats.synced,
        lastMessage: message
      };
      this.listeners.forEach(fn => fn(report));
    });
  }

  async checkServer(): Promise<boolean> {
    const online = await apiService.checkServerHealth();
    this.serverOnline = online;
    this.notify(online ? 'Server is connected' : 'Working offline (server unreachable)');
    return online;
  }

  /**
   * Save contact with Offline-First priority:
   * 1. Save locally marked as pending_sync
   * 2. Attempt server upload in background / immediate
   * 3. If server responds, mark as synced and save server_id
   */
  async saveContact(contact: FullContact): Promise<{ contact: FullContact; synced: boolean }> {
    // 1. Mark as pending_sync & save locally first
    contact.sync_status = 'pending_sync';
    const savedLocal = await localDb.save(contact);
    this.notify('Contact saved locally (pending sync)');

    // 2. Try uploading to server
    try {
      const online = await this.checkServer();
      if (!online) {
        return { contact: savedLocal, synced: false };
      }

      if (savedLocal.server_id) {
        await apiService.updateContact(savedLocal.server_id, savedLocal);
        await localDb.markAsSynced(savedLocal.local_id, savedLocal.server_id);
      } else {
        const res = await apiService.createContact(savedLocal);
        if (res.server_id) {
          await localDb.markAsSynced(savedLocal.local_id, res.server_id);
          savedLocal.server_id = res.server_id;
          savedLocal.sync_status = 'synced';
        }
      }
      this.notify('Contact synchronized with server');
      return { contact: savedLocal, synced: true };
    } catch (err: any) {
      console.warn('Sync failed during save, remains pending:', err.message);
      this.notify('Saved offline. Will sync when server is reachable.');
      return { contact: savedLocal, synced: false };
    }
  }

  /**
   * Trigger bi-directional batch sync
   */
  async triggerSync(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Synchronization already in progress' };
    }

    this.isSyncing = true;
    this.notify('Synchronizing contacts...');

    try {
      const online = await apiService.checkServerHealth();
      this.serverOnline = online;
      if (!online) {
        this.isSyncing = false;
        this.notify('Cannot sync: server is offline');
        return { success: false, message: 'Server is currently unreachable' };
      }

      const pending = await localDb.getPendingSync();
      if (pending.length > 0) {
        const syncRes = await apiService.batchSync(pending, this.lastSyncTime || undefined);
        if (syncRes.synced_contacts) {
          for (const item of syncRes.synced_contacts) {
            if (item.status === 'synced' && item.server_id) {
              await localDb.markAsSynced(item.local_id, item.server_id);
            }
          }
        }
      }

      // Fetch fresh server contacts to ensure latest copy
      const serverContacts = await apiService.fetchContacts();
      if (serverContacts && serverContacts.length > 0) {
        const localContacts = await localDb.getAll();
        const pendingMap = new Map(localContacts.filter(c => c.sync_status === 'pending_sync').map(c => [c.local_id, c]));

        const merged: FullContact[] = serverContacts.map(sc => {
          return {
            ...sc,
            local_id: sc.local_id || `loc_srv_${sc.id}`,
            server_id: sc.id,
            sync_status: 'synced',
            sync_version: sc.sync_version || 1
          };
        });

        // Add back pending items that haven't reached server yet
        pendingMap.forEach(item => {
          if (!merged.find(m => m.local_id === item.local_id || (item.server_id && m.server_id === item.server_id))) {
            merged.unshift(item);
          }
        });

        await localDb.replaceAll(merged);
      }

      this.lastSyncTime = new Date().toISOString();
      this.isSyncing = false;
      this.notify('All contacts synchronized successfully');
      return { success: true, message: 'All contacts synchronized successfully' };
    } catch (err: any) {
      this.isSyncing = false;
      this.notify(`Sync failed: ${err.message}`);
      return { success: false, message: err.message || 'Sync failed' };
    }
  }
}

export const syncService = new SyncService();
