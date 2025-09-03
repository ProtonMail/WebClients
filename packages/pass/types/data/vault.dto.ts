import type { ShareId } from '@proton/pass/types';

export type VaultTransferOwnerIntent = { shareId: string; userShareId: string };
export type VaultsVisibilityDTO = { sharesToHide: ShareId[]; sharesToUnhide: ShareId[] };
