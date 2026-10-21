import type { SelectedItem } from '../data/items';

export type OtpCode = { token: string; period: number; expiry: number };
export type OtpRequest = { type: 'item'; item: SelectedItem } | { type: 'uri'; totpUri?: string };
