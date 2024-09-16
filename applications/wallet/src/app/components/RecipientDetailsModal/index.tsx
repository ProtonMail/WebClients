import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Button } from '../../atoms';
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
        <Prompt
            {...modalProps}
            buttons={[
                <Button
                    onClick={async () => {
                        await navigator.clipboard.writeText(btcAddress);
                        createNotification({ text: c('Recipient details').t`Bitcoin address copied to clipboard` });
                    }}
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                >
                    {c('Action').t`Copy address`}
                </Button>,
                <Button fullWidth size="large" shape="solid" color="weak" onClick={modalProps.onClose}>{c('Wallet')
                    .t`Close`}</Button>,
            ]}
        >
            <div className="flex flex-column items-center">
                <div
                    className={clsx(
                        'rounded-full w-custom h-custom mb-4 flex items-center justify-center text-xl text-semibold shrink-0',
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
            </div>
        </Prompt>
    );
};
