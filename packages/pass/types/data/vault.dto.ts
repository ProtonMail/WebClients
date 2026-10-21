import type { ShareId } from '../crypto/pass-types';

export type VaultTransferOwnerIntent = { shareId: string; userShareId: string };
export type VaultsVisibilityDTO = { sharesToHide: ShareId[]; sharesToUnhide: ShareId[] };
