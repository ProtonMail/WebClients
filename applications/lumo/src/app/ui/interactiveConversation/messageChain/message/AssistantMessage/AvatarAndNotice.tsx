import { clsx } from 'clsx';
import { c } from 'ttag';

import type { ToolCallName } from '../../../../../lib/toolCall/types';
import LumoAvatar from '../../../../components/LumoAvatar/LumoAvatar';

import './AvatarAndNotice.scss';

export type AvatarAndNoticeProps = {
    isFinishedGenerating: boolean;
    isGenerating: boolean;
    toolCallName?: ToolCallName;
};

export function AvatarAndNotice({ isFinishedGenerating, isGenerating, toolCallName }: AvatarAndNoticeProps) {
    // The CSS contains special styling such that the Lumo cat avatar
    // and "Conversation Encrypted" notice never overlap, even if the
    // message width is too short.
    return (
        <div className="avatar-and-notice">
            <div className={'avatar-and-notice__container'}>
                {isFinishedGenerating && (
                    <div
                        className={clsx(
                            'avatar-and-notice__notice',
                            'bottom-0 right-0 mt-2 mx-2 md:block text-right text-sm color-hint'
                        )}
                    >
                        {c('collider_2025:Info').t`Conversation encrypted`}
                    </div>
                )}
                <div className="avatar-and-notice__avatar">
                    <LumoAvatar isGenerating={isGenerating} toolCallName={toolCallName} />
                </div>
            </div>
        </div>
    );
}
