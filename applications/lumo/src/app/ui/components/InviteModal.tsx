import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { useApi } from '@proton/components';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import InputField from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { sendLumoInvitation } from '@proton/shared/lib/api/lumo';
import { LUMO_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import lumoInviteBox from '@proton/styles/assets/img/lumo/lumo-waitlist-box.svg';
import noop from '@proton/utils/noop';

import { LumoPrompt } from './LumoPrompt/LumoPrompt';

interface InviteModalOwnProps {
    onInviteSent: (email: string) => void;
    defaultInviterAddressID: string;
    remainingInvites: number;
}

type Props = ModalOwnProps & InviteModalOwnProps;

export const InviteModal = ({ defaultInviterAddressID, onInviteSent, remainingInvites, ...modalProps }: Props) => {
    const [email, setEmail] = useState('');
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loadingInvite, withLoadingInvite] = useLoading();

    const errorMessage = (() => {
        if (!email) {
            return c('collider_2025: Invite').t`Email address is required`;
        }

        if (!validateEmailAddress(email)) {
            return c('collider_2025: Invite').t`Email address is not valid`;
        }

        return null;
    })();

    const handleSend = async () => {
        if (!validateEmailAddress(email)) {
            return;
        }

        try {
            await api(sendLumoInvitation({ Email: email, InviterAddressID: defaultInviterAddressID }));
            onInviteSent(email);
            createNotification({ text: c('collider_2025: Invite Sent').t`Invitation sent` });
            setEmail('');
        } catch (error: any) {
            noop();
        }
    };

    const remainingInvitesText = <span className="text-bold color-primary">{remainingInvites}</span>;

    return (
        <LumoPrompt
            {...modalProps}
            buttons={[
                <Tooltip title={errorMessage}>
                    <Button
                        fullWidth
                        color="norm"
                        shape="solid"
                        disabled={!!errorMessage}
                        onClick={() => {
                            void withLoadingInvite(handleSend());
                        }}
                        loading={loadingInvite}
                    >{c('collider_2025: Invite Button').t`Send invitation`}</Button>
                </Tooltip>,
                <Button
                    fullWidth
                    color="norm"
                    shape="ghost"
                    onClick={() => {
                        modalProps.onClose?.();
                    }}
                >{c('collider_2025: Invite Button').t`Maybe later`}</Button>,
            ]}
            lumoContent={
                <div className="flex flex-row w-full">
                    <InputField
                        dense
                        // label={c('collider_2025: Invite Email Label').t`Email address`}
                        placeholder={c('collider_2025: Invite Email Placeholder').t`Your friend's email`}
                        value={email}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                            setEmail(event.target.value);
                        }}
                    />
                </div>
            }
            image={{
                src: lumoInviteBox,
            }}
            title={c('collider_2025: Invite Title').t`Invite friends to experience ${LUMO_APP_NAME}`}
            info={c('collider_2025: Invite Info')
                .jt`Know someone who'd benefit from a privacy-first AI? Invite them to join the ${LUMO_SHORT_APP_NAME} waitlist. You have ${remainingInvitesText} invitations remaining.`}
        />
    );
};
