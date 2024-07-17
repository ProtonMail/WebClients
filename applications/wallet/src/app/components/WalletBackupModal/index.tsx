import { useState } from 'react';

import { c } from 'ttag';

import { ModalOwnProps, Prompt } from '@proton/components/components';
import { UnlockModal } from '@proton/components/containers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import accessKey from '@proton/styles/assets/img/illustrations/access-key.svg';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { SubTheme } from '../../utils';

export interface WalletBackupModalOwnProps {
    apiWalletData: IWasmApiWalletData;
    theme?: SubTheme;
}

type Props = ModalOwnProps & WalletBackupModalOwnProps;

export const WalletBackupModal = ({ apiWalletData, theme, ...modalProps }: Props) => {
    const [viewMnemonic, setViewMnemonic] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);

    const mnemonicWords = apiWalletData.Wallet.Mnemonic?.split(' ');

    if (!apiWalletData.WalletSettings) {
        modalProps.onClose?.();
        return null;
    }

    if (!hasPassword) {
        return <UnlockModal open onSuccess={() => setHasPassword(true)} />;
    }

    if (viewMnemonic) {
        return (
            <Prompt
                size="small"
                className={theme}
                buttons={[
                    <Button
                        className="block w-4/5 mx-auto mt-6"
                        shape="solid"
                        color="norm"
                        onClick={() => modalProps.onClose?.()}
                    >
                        {c('Wallet setup').t`Done`}
                    </Button>,
                ]}
                {...modalProps}
            >
                <div className="flex flex-column items-center">
                    <h1 className={'text-bold text-break text-2xl mt-3 mb-4'}>
                        {c('Wallet setup').t`Wallet seed phrase`}
                    </h1>

                    <ModalParagraph>
                        <p>{c('Wallet setup')
                            .t`You can use the seed phrase to import your wallet on any wallet app.`}</p>
                    </ModalParagraph>

                    <div className="w-full grid gap-3 items-start columns-1 md:columns-2 px-8">
                        {mnemonicWords?.map((word, index) => {
                            const middle = Math.ceil(mnemonicWords.length / 2);
                            const gridColumn = index < middle ? 1 : 2;
                            const gridRow = index < middle ? index + 1 : index + 1 - middle;

                            return (
                                <div
                                    className={clsx(
                                        'flex flex-row text-lg items-center h-custom',
                                        gridRow > 1 && 'border-top'
                                    )}
                                    key={`${index}_${word}`}
                                    style={{ gridRow, gridColumn, '--h-custom': '2.5rem' }}
                                >
                                    <div className="color-hint">{index + 1}</div>
                                    <div className="ml-6">{word}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Prompt>
        );
    }

    return (
        <Prompt
            size="small"
            className={theme}
            buttons={[
                <Button fullWidth shape="solid" color="norm" onClick={() => setViewMnemonic(true)}>
                    {c('Wallet setup').t`View wallet seed phrase`}
                </Button>,
                <Button fullWidth shape="ghost" color="norm" onClick={() => modalProps.onClose?.()}>
                    {c('Wallet setup').t`Done`}
                </Button>,
            ]}
            {...modalProps}
        >
            <div className="flex flex-column items-center">
                <img className="my-3" src={accessKey} alt="" />

                <h1 className={'text-bold text-break text-3xl mt-3 mb-4'}>{c('Wallet setup')
                    .t`Your keys, your coins.`}</h1>

                <ModalParagraph>
                    <p>{c('Wallet setup')
                        .t`Wallet seed phrase encode the private key that controls your digital assets.`}</p>
                    <p>{c('Wallet setup')
                        .t`These 12 words should only be used to recover the assets of this wallet as a last resort, such as if you lose access to your ${BRAND_NAME} account.`}</p>
                    <p>{c('Wallet setup')
                        .t`Never give them to anyone else. ${BRAND_NAME} will never ask you for them. Write them down carefully and hide it in a safe place.`}</p>
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
