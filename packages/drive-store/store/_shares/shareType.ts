import type { Share , ShareTypeString } from './interface';
import { ShareType } from './interface';

export function getShareTypeString(share?: Share): ShareTypeString {
    if (!share) {
        return 'shared';
    }

    if (share.type === ShareType.default) {
        return 'main';
    } else if (share.type === ShareType.photos) {
        return 'photo';
    } else if (share.type === ShareType.device) {
        return 'device';
    }
    return 'shared';
}
