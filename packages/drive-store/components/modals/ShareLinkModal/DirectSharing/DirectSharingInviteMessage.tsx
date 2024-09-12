import { c } from 'ttag';

import { Checkbox, Icon, InputFieldTwo, TextAreaTwo, Tooltip } from '@proton/components';
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
                <span className="absolute right-0 bottom-0 text-sm color-weak">
                    {inviteMessage.length}/{SHARE_INVITE_MESSAGE_MAX_LENGTH}
                </span>
            </div>
        )}

        <div className="w-full flex items-center">
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
                <Icon name="info-circle-filled" className="color-disabled ml-2" size={5} />
            </Tooltip>
        </div>
    </>
);
