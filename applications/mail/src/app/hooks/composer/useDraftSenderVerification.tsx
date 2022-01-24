import { MessageChange } from '../../components/composer/Composer';
import { Alert, ConfirmModal, useAddresses, useModals } from '@proton/components';
import { MessageState } from '../../logic/messages/messagesTypes';
import { Address } from '@proton/shared/lib/interfaces';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { c } from 'ttag';
import { getAddressFromEmail, getFromAddress } from '../../helpers/addresses';

interface Props {
    onChange: MessageChange;
}

export const useDraftSenderVerification = ({ onChange }: Props) => {
    const [addresses] = useAddresses();
    const { createModal } = useModals();

    const verifyDraftSender = async (message: MessageState) => {
        const currentSender = message.data?.Sender;

        const actualAddress: Address | undefined = getAddressFromEmail(addresses, currentSender?.Address);

        if (!actualAddress || !getIsAddressActive(actualAddress)) {
            const defaultAddress = getFromAddress(addresses, '', undefined);

            if (defaultAddress) {
                onChange({
                    data: {
                        Sender: { Name: defaultAddress.DisplayName, Address: defaultAddress.Email },
                        AddressID: defaultAddress.ID,
                    },
                });

                await new Promise((resolve) => {
                    createModal(
                        <ConfirmModal
                            onConfirm={() => resolve(undefined)}
                            cancel={null}
                            onClose={() => resolve(undefined)}
                            title={c('Title').t`Sender changed`}
                            confirm={c('Action').t`OK`}
                        >
                            <Alert className="mb1">{c('Info')
                                .t`The original sender of this message is no longer valid. Your message will be sent from your default address ${defaultAddress.Email}.`}</Alert>
                        </ConfirmModal>
                    );
                });
            }
        }
    };

    return { verifyDraftSender };
};
