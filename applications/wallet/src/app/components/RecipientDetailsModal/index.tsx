import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Button, Modal } from '../../atoms';
import { getThemeByIndex } from '../../utils';

export interface RecipientDetailsModalOwnProps {
    recipient: Recipient;
    btcAddress: string;
    index: number;
}

type Props = ModalOwnProps & RecipientDetailsModalOwnProps;

export const RecipientDetailsModal = ({ recipient, btcAddress, index, ...modalProps }: Props) => {
    const { createNotification } = useNotifications();
    const isOnlyBtcAddress = btcAddress === recipient.Address;

    return (
        <Modal {...modalProps}>
            <div className="flex flex-column items-center">
                <div
                    className={clsx(
                        'rounded-full w-custom h-custom mb-4 flex items-center justify-center text-xl text-semibold no-shrink',
                        getThemeByIndex(index)
                    )}
                    style={{
                        '--h-custom': '3.5rem',
                        '--w-custom': '3.5rem',
                        background: 'var(--interaction-norm-minor-1)',
                        color: 'var(--interaction-norm)',
                    }}
                >
                    {getInitials(recipient.Name || recipient.Address)}
                </div>

                {isOnlyBtcAddress ? (
                    <div>{c('Recipient details').t`External recipient`}</div>
                ) : (
                    <>
                        <h1 className="text-semibold text-break text-xl mb-2">{recipient.Name}</h1>

                        {recipient.Name !== recipient.Address && (
                            <div className="color-hint text-lg text-break">{recipient.Address}</div>
                        )}
                    </>
                )}

                <div className="flex flex-column items-start mt-12 mb-6">
                    <div className="text-xl color-hint mb-1">{c('Recipient details').t`BTC address`}</div>
                    <div className="text-lg text-break">{btcAddress}</div>
                </div>

                <div className="w-full px-8">
                    <Button
                        fullWidth
                        shape="solid"
                        color="weak"
                        onClick={async () => {
                            await navigator.clipboard.writeText(btcAddress);
                            createNotification({ text: c('Recipient details').t`Bitcoin address copied to clipboard` });
                        }}
                    >
                        {c('Recipient details').t`Copy address`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
