import type { SelectedItem } from '../data';

export type OtpCode = { token: string; period: number; expiry: number };
export type OtpRequest = SelectedItem & ({ type: 'item' } | { type: 'extraField'; index: number });
