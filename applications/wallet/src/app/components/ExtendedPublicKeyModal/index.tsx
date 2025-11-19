import { useEffect, useState } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    type ModalOwnProps,
    Prompt,
    useNotifications,
} from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { Button } from '../../atoms';
import { getThemeByIndex } from '../../utils';

export interface ExtendedPublicKeyModalOwnProps {
    accountLabel: string;
    xpub: string;
    descriptor: string;
    index: number;
}

type Props = ModalOwnProps & ExtendedPublicKeyModalOwnProps;

export const ExtendedPublicKeyModal = ({ accountLabel, xpub, descriptor, index, ...modalProps }: Props) => {
    const { createNotification } = useNotifications();
    const [isXPub, setIsXpub] = useState<boolean>(false);

    useEffect(() => {
        if (modalProps.open) {
            setIsXpub(false);
        }
    }, [modalProps.open]);

    const prefix = xpub.slice(0, 4);
    // translator: prefix is always a 4-character string like XPUB, YPUB, or ZPUB
    const copyXpubLabel = c('Action').t`Copy public key (${prefix})`;
    // translator: prefix is always a 4-character string like XPUB, YPUB, or ZPUB
    const copyXpubNotification = c('Extended public key').t`Public key (${prefix}) copied to clipboard`;
    const copyDescriptorLabel = c('Action').t`Copy descriptor`;
    const copyDescriptorNotification = c('Extended public key').t`Descriptor copied to clipboard`;

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <Button
                    onClick={async () => {
                        await navigator.clipboard.writeText(isXPub ? xpub : descriptor);
                        createNotification({ text: isXPub ? copyXpubNotification : copyDescriptorNotification });
                    }}
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                >
                    {isXPub ? copyXpubLabel : copyDescriptorLabel}
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

                <div className="mb-4">
                    <p className="text-center color-weak my-0">{c('Extended public key')
                        .t`Import this descriptor into other wallet software to monitor your balance and generate receiving addresses without exposing your private keys.`}</p>
                    <p className="text-center color-weak my-0 mt-2">{c('Extended public key')
                        .t`Verify the first few derived addresses match those in ${WALLET_APP_NAME} before proceeding.`}</p>
                    <p className="text-center color-norm my-0 mt-4 text-break">{descriptor}</p>
                </div>
            </div>

            <Collapsible>
                <CollapsibleHeader
                    className="color-weak"
                    suffix={
                        <CollapsibleHeaderIconButton className="color-weak" onClick={() => setIsXpub(!isXPub)}>
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    {
                        // Translator: prefix is always a 4-character string like XPUB, YPUB, or ZPUB
                        c('Extended public key').t`I want the ${prefix} instead`
                    }
                </CollapsibleHeader>
                <CollapsibleContent>
                    <div className="flex flex-column items-center mt-6">
                        <p className="text-center color-weak my-0">{c('Extended public key')
                            .t`We strongly recommend using the descriptor above instead, as it contains all necessary information to ensure correct address generation. xpub, ypub, and zpub are not part of standard BIPs and should only be used with caution.`}</p>
                        <p className="text-center color-norm my-0 mt-4 text-break">{xpub}</p>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Prompt>
    );
};
