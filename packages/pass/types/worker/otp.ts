import type { SelectedItem } from '../data';

export type OtpCode = { token: string; period: number; expiry: number };
export type OtpRequest = { type: 'item'; item: SelectedItem } | { type: 'uri'; totpUri?: string };
