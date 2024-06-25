import { c } from 'ttag';

import { Checkbox, Icon, InputFieldTwo, TextAreaTwo, Tooltip } from '@proton/components/components';
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
        <InputFieldTwo
            as={TextAreaTwo}
            disabled={!includeInviteMessage || isAdding}
            id="direct-sharing-invite-message"
            maxLength={500}
            placeholder={c('Placeholder').t`Message`}
            className={clsx((!includeInviteMessage || isAdding) && 'opacity-40')}
            onValue={onChangeInviteMessage}
            rows={5}
            value={inviteMessage}
        />

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
