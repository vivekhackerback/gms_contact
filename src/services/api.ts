import { FullContact } from '../types/contact';

export const DEFAULT_API_BASE = 'http://localhost:4000/api';

class ApiService {
  private baseUrl = DEFAULT_API_BASE;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(`${this.baseUrl}/dashboard`, { signal: ctrl.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  async checkDuplicate(params: {
    mobile?: string;
    admission_number?: string;
    employee_id?: string;
    exclude_id?: number | string;
  }): Promise<{ exists: boolean; contact: FullContact | null }> {
    try {
      const q = new URLSearchParams();
      if (params.mobile) q.append('mobile', params.mobile);
      if (params.admission_number) q.append('admission_number', params.admission_number);
      if (params.employee_id) q.append('employee_id', params.employee_id);
      if (params.exclude_id) q.append('exclude_id', String(params.exclude_id));

      const res = await fetch(`${this.baseUrl}/contacts/check-duplicate?${q.toString()}`);
      if (!res.ok) return { exists: false, contact: null };
      return await res.json();
    } catch (e) {
      console.warn('Check duplicate network failed, skipping remote duplicate check:', e);
      return { exists: false, contact: null };
    }
  }

  async fetchContacts(query?: {
    type?: string;
    search?: string;
    class_val?: string;
    section?: string;
    subject?: string;
    department?: string;
  }): Promise<FullContact[]> {
    const q = new URLSearchParams();
    if (query?.type) q.append('type', query.type);
    if (query?.search) q.append('search', query.search);
    if (query?.class_val) q.append('class_val', query.class_val);
    if (query?.section) q.append('section', query.section);
    if (query?.subject) q.append('subject', query.subject);
    if (query?.department) q.append('department', query.department);

    const res = await fetch(`${this.baseUrl}/contacts?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const body = await res.json();
    return body.data || [];
  }

  async createContact(contact: FullContact): Promise<{ server_id: number; local_id?: string }> {
    const res = await fetch(`${this.baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error creating contact');
    }
    return await res.json();
  }

  async updateContact(id: number, contact: FullContact): Promise<void> {
    const res = await fetch(`${this.baseUrl}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error updating contact');
    }
  }

  async deleteContact(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/contacts/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error deleting contact');
    }
  }

  async batchSync(pendingContacts: FullContact[], lastSyncTime?: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/contacts/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: 'mobile_device_1',
        pending_contacts: pendingContacts,
        last_sync_time: lastSyncTime
      })
    });
    if (!res.ok) throw new Error('Sync endpoint failed');
    return await res.json();
  }
}

export const apiService = new ApiService();
