/**
 * Global Application & Backend Server Configuration
 * 
 * You can put your domain URL, ngrok address, or production server IP here.
 * Any change made here will instantly be used across the entire app.
 */

// Put your active domain URL here (without trailing slash):
export const DOMAIN_URL = 'https://d2eb-2402-3a80-f5d-c4ac-2991-5fa7-f1bd-fe50.ngrok-free.app';

// Full API endpoint pointing to the backend API directory:
export const DEFAULT_API_BASE_URL = `${DOMAIN_URL.replace(/\/+$/, '')}/gms_contact/api`;

export const APP_CONFIG = {
  domain: DOMAIN_URL,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  appName: 'GMS School Contacts',
  version: '1.0.0',
  syncIntervalMs: 60000 // 1 minute background sync check
};

export default APP_CONFIG;
