import type { DeobfuscatedItemContent, UniqueItem } from '../data';
import type { CardType } from '../protobuf';

export type ItemPreview = UniqueItem & { name: string };
export type LoginItemPreview = ItemPreview & { userIdentifier: string; url?: string };
export type IdentityItemPreview = ItemPreview & { fullName?: string };

export type CCItemPreview = ItemPreview & { obfuscatedNumber: string; expirationDate: string; cardType: CardType };
export type CCItemData = DeobfuscatedItemContent<'creditCard'>;
