import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Checkbox, InputFieldTwo, TextAreaTwo } from '@proton/components';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { SHARE_INVITE_MESSAGE_MAX_LENGTH } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

interface Props {
    isAdding: boolean;
    inviteMessage: string;
    includeInviteMessage: boolean;
    onChangeInviteMessage: (inviteMessage: string) => void;
    onToggleIncludeInviteMessage: () => void;
}

export const DirectSharingInviteMessage = ({
    isAdding,
    inviteMessage,
    includeInviteMessage,
    onChangeInviteMessage,
    onToggleIncludeInviteMessage,
}: Props) => (
    // Wrapped in a div do we return a single element - important for flexbox layout
    <>
        {includeInviteMessage && (
            <div className="relative">
                <InputFieldTwo
                    as={TextAreaTwo}
                    disabled={isAdding}
                    id="direct-sharing-invite-message"
                    placeholder={c('Placeholder').t`Message`}
                    className={clsx(isAdding && 'opacity-40')}
                    onValue={onChangeInviteMessage}
                    rows={5}
                    maxLength={500}
                    value={inviteMessage}
                />
            </div>
        )}

        <div className="w-full flex justify-space-between items-center">
            <div>
                <Checkbox
                    disabled={isAdding}
                    id="direct-sharing-toggle-invite-message"
                    className="color-weak"
                    checked={includeInviteMessage}
                    onChange={onToggleIncludeInviteMessage}
                >
                    {c('Label').t`Include message and file name in invite email`}
                </Checkbox>
                <Tooltip
                    title={c('Tooltip')
                        .t`Message and file name are stored with zero access encryption when included in the email`}
                >
                    <IcInfoCircleFilled className="color-disabled ml-2" size={5} />
                </Tooltip>
            </div>

            <span className="text-sm color-weak">
                {inviteMessage.length}/{SHARE_INVITE_MESSAGE_MAX_LENGTH}
            </span>
        </div>
    </>
);
