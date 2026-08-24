import type { ShareId } from '..';

export type VaultTransferOwnerIntent = { shareId: string; userShareId: string };
export type VaultsVisibilityDTO = { sharesToHide: ShareId[]; sharesToUnhide: ShareId[] };
