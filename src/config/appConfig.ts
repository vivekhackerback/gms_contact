/**
 * Global Application & Backend Server Configuration
 * 
 * You can change this DOMAIN_URL anytime in the future to your new server domain,
 * hosting URL, or ngrok address. All API requests across the app use this setting.
 */

// ============================================================================
// 1. CHANGE YOUR SERVER DOMAIN HERE:
// ============================================================================
export const DOMAIN_URL = 'https://gmscontact.tplpro.in';

// 2. Full API endpoint path (points to the /api folder on your server):
export const DEFAULT_API_BASE_URL = `${DOMAIN_URL.replace(/\/+$/, '')}/api`;

export const APP_CONFIG = {
  domain: DOMAIN_URL,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  appName: 'GMS School Contacts',
  version: '1.0.0',
  syncIntervalMs: 60000 // 1 minute background sync interval
};

export default APP_CONFIG;
