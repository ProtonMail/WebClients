import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { MetricShareType } from '../../../utils/type/MetricTypes';
import type { Share } from '../../_shares/interface';
import { ShareType } from '../../_shares/interface';

export function getShareType(share?: Share): MetricShareType {
    // (see above...) But if the share is not there anyway, we need to
    // still decide about share type. Own shares are always loaded by
    // default, so we can bet that its not own/device/photo and thus
    // we can set its shared one.
    if (!share) {
        return MetricShareType.Shared;
    }

    if (share.type === ShareType.default) {
        return MetricShareType.Main;
    } else if (share.type === ShareType.photos) {
        return MetricShareType.Photo;
    } else if (share.type === ShareType.device) {
        return MetricShareType.Device;
    }
    return share.linkType === LinkType.ALBUM ? MetricShareType.SharedPhoto : MetricShareType.Shared;
}
