import { Alert, Linking, Platform } from 'react-native';
import { normalizeIndianMobile } from '../utils/validation';

/**
 * Triggers phone dialer for Indian or international numbers
 */
export async function makePhoneCall(phone: string, contactName?: string) {
  const norm = normalizeIndianMobile(phone);
  if (!norm) {
    Alert.alert('Invalid Number', 'No valid phone number is available for this contact.');
    return;
  }

  const dialNumber = `+91${norm}`;
  const url = `tel:${dialNumber}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported && Platform.OS !== 'web') {
      Alert.alert('Error', `Cannot place calls on this device to ${dialNumber}`);
      return;
    }
    await Linking.openURL(url);
  } catch (err: any) {
    Alert.alert('Calling Error', err.message || 'Unable to open dialer');
  }
}

/**
 * Opens WhatsApp conversation with user's mobile number
 */
export async function openWhatsApp(phone: string, contactName?: string) {
  const norm = normalizeIndianMobile(phone);
  if (!norm) {
    Alert.alert('Invalid Number', 'No valid phone number is available for WhatsApp.');
    return;
  }

  const fullNumber = `91${norm}`;
  const appUrl = `whatsapp://send?phone=${fullNumber}`;
  const webUrl = `https://wa.me/${fullNumber}`;

  try {
    const supported = await Linking.canOpenURL(appUrl);
    if (supported) {
      await Linking.openURL(appUrl);
    } else {
      // Fallback to https://wa.me/
      const webSupported = await Linking.canOpenURL(webUrl);
      if (webSupported) {
        await Linking.openURL(webUrl);
      } else {
        Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on this device.');
      }
    }
  } catch (err) {
    Alert.alert('WhatsApp Error', 'WhatsApp is not installed or could not be opened.');
  }
}

/**
 * Opens Email client
 */
export async function sendEmail(email: string, contactName?: string) {
  if (!email) return;
  const url = `mailto:${email}`;
  try {
    await Linking.openURL(url);
  } catch (err) {
    Alert.alert('Email Error', 'Unable to open email client.');
  }
}
