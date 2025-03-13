import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt, useNotifications } from '@proton/components';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { Button } from '../../atoms';
import { getThemeByIndex } from '../../utils';

export interface ExtendedPublicKeyModalOwnProps {
    accountLabel: string;
    xpub: string;
    index: number;
}

type Props = ModalOwnProps & ExtendedPublicKeyModalOwnProps;

export const ExtendedPublicKeyModal = ({ accountLabel, xpub, index, ...modalProps }: Props) => {
    const { createNotification } = useNotifications();

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <Button
                    onClick={async () => {
                        await navigator.clipboard.writeText(xpub);
                        createNotification({ text: c('Extended public key').t`Public key (XPUB) copied to clipboard` });
                    }}
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                >
                    {c('Action').t`Copy public key (XPUB)`}
                </Button>,
                <Button fullWidth size="large" shape="solid" color="weak" onClick={modalProps.onClose}>{c('Action')
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
                    {getInitials(accountLabel)}
                </div>

                <h1 className="text-semibold text-break text-xl mb-2">{accountLabel}</h1>

                <div className="flex flex-column items-start mt-12 mb-6">
                    <div className="text-xl color-hint mb-1">{c('Recipient details').t`Public key (XPUB)`}</div>
                    <div className="text-lg text-break">{xpub}</div>
                </div>
            </div>
        </Prompt>
    );
};
