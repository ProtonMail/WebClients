import { c } from 'ttag';

import { useDisconnectBYOEAddress } from '@proton/activation/src/byoe/useDisconnectBYOEAddress';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

interface Props extends Pick<PromptProps, 'open' | 'onClose' | 'onExit'> {
    address: Address;
}

export const ConfirmBYOEDisconnectionPrompt = ({ address, onClose, ...rest }: Props) => {
    const { disconnect, loading, isDisconnecting } = useDisconnectBYOEAddress(address);

    const { createNotification } = useNotifications();

    // Closing mid-request would hide the outcome from the user
    const handleClose = () => {
        if (!isDisconnecting) {
            onClose?.();
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            // The request is silent, so nothing else tells the user. The prompt stays open to try again.
            createNotification({
                type: 'error',
                text: getApiErrorMessage(error) || c('Error').t`We couldn't disconnect this address. Please try again.`,
            });
            return;
        }
        onClose?.();
    };

    const email = <strong key="email">{address.Email}</strong>;
    return (
        <Prompt
            {...rest}
            onClose={handleClose}
            disableCloseOnEscape={isDisconnecting}
            disableCloseWhenClickOutside={isDisconnecting}
            title={c('Title').t`Disconnect this address?`}
            buttons={[
                <Button color="danger" onClick={handleDisconnect} loading={loading}>{c('Action')
                    .t`Disconnect`}</Button>,
                <Button onClick={handleClose} disabled={isDisconnecting}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="mt-0 mb-3">{c('Info')
                .jt`You won't be able to send or receive as ${email} in ${BRAND_NAME} anymore.`}</p>
            <p className="m-0">{c('Info')
                .t`Messages from other ${BRAND_NAME} users also lose end-to-end encryption.`}</p>
        </Prompt>
    );
};
