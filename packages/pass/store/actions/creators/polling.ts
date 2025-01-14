import { createAction } from '@reduxjs/toolkit';

import type { AccessDTO } from '@proton/pass/lib/access/types';
import { AccessTarget } from '@proton/pass/lib/access/types';

export const forcePoll = createAction<string>('channel::poll');
export const syncShares = () => forcePoll('shares');
export const syncShare = (shareID: string) => forcePoll(`share::${shareID}`);

/** When target is vault : sync shares event route to get sharing data
 *  When target is item : sync share event route to get `UpdatedItems` */
export const syncAccess = ({ target, shareId }: AccessDTO) =>
    target === AccessTarget.Vault ? syncShares() : syncShare(shareId);
