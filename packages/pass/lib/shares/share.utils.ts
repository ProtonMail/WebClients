import type { Share, ShareVisibilityMap } from '../../types';
import { isShareVisible } from './share.predicates';

export const intoShareVisibilityMap = (shares: Share[]): ShareVisibilityMap =>
    Object.fromEntries(shares.map((share) => [share.shareId, isShareVisible(share)]));
