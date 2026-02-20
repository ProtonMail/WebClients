import { createAction } from '@reduxjs/toolkit';

import type { AccessDTO } from '@proton/pass/lib/access/types';
import { AccessTarget } from '@proton/pass/lib/access/types';

export const forcePollV1 = createAction<string>('channel::poll::v1');
export const forcePollV2 = createAction('channel::poll::v2');
export const syncShares = () => forcePollV1('shares');
export const syncShare = (shareID: string) => forcePollV1(`share::${shareID}`);

/** When target is vault : sync shares event route to get sharing data
 *  When target is item : sync share event route to get `UpdatedItems` */
export const syncAccess = ({ target, shareId }: AccessDTO) => (target === AccessTarget.Vault ? syncShares() : syncShare(shareId));
