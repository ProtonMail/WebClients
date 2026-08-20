import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { MAX_IMAGES_PER_REQUEST } from '../../llm/attachments';
import { LumoIcon } from '../LumoIcon/LumoIcon';

interface ImageLimitNoticeProps {
    /** Whether the conversation has more sendable images than the most-recent-N limit. */
    exceedsLimit: boolean;
}

/**
 * Shows a notice above the composer when a conversation has more images than can be
 * sent to the backend, including images attached to the message being composed.
 * Sidebar-excluded images are not counted. Only the most recent
 * {@link MAX_IMAGES_PER_REQUEST} included images are sent.
 */
export const ImageLimitNotice = ({ exceedsLimit }: ImageLimitNoticeProps) => {
    if (!exceedsLimit) {
        return null;
    }

    const message = c('collider_2025: Info')
        .t`This conversation contains many images. ${LUMO_SHORT_APP_NAME} will only see the most recent ${MAX_IMAGES_PER_REQUEST} images.`;

    return (
        <div className="flex flex-row flex-nowrap items-center gap-2 rounded-lg bg-weak px-3 py-2 mt-2 mb-2 text-sm color-weak">
            <LumoIcon name="Info" size={16} className="shrink-0 color-primary" />
            <span>{message}</span>
        </div>
    );
};

export default ImageLimitNotice;
