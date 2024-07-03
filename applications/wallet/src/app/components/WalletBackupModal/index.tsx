import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { ModalOwnProps } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import accessKey from '@proton/styles/assets/img/illustrations/access-key.svg';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, ButtonLike, Modal } from '../../atoms';
import { SubTheme } from '../../utils';

export interface WalletBackupModalOwnProps {
    apiWalletData: IWasmApiWalletData;
    theme?: SubTheme;
}

type Props = ModalOwnProps & WalletBackupModalOwnProps;

export const WalletBackupModal = ({ apiWalletData, theme, ...modalProps }: Props) => {
    const [viewMnemonic, setViewMnemonic] = useState(false);

    const mnemonicWords = apiWalletData.Wallet.Mnemonic?.split(' ');

    return (
        <Modal
            size="small"
            title={viewMnemonic ? c('Wallet setup').t`Wallet seed phrase` : undefined}
            subline={
                viewMnemonic
                    ? c('Wallet setup').t`You can use the seed phrase to import your wallet on any wallet app.`
                    : undefined
            }
            className={theme}
            {...modalProps}
        >
            {viewMnemonic ? (
                <div className="flex flex-column">
                    <div className="grid gap-3 columns-1 md:columns-2 px-8">
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

                    <Button
                        className="block w-4/5 mx-auto mt-6"
                        shape="solid"
                        color="norm"
                        onClick={() => modalProps.onClose?.()}
                    >
                        {c('Wallet setup').t`Done`}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-column items-center">
                    <img className="my-3" src={accessKey} alt="" />

                    <h1 className={'text-bold text-break text-2xl mt-3'}>{c('Wallet setup')
                        .t`Your keys, your coins.`}</h1>

                    <p className="color-weak text-center text-sm my-4">
                        <span className="block my-2">{c('Wallet setup')
                            .t`Wallet seed phrases encode the private key that controls your digital assets.`}</span>
                        <span className="block my-2">{c('Wallet setup')
                            .t`These 12 words should only be used to recover the digital assets of this wallet as a last resort, such as if you lose access to your ${BRAND_NAME} account.`}</span>
                        <span className="block my-2">{c('Wallet setup')
                            .t`Never give them to anyone else. ${BRAND_NAME} will never ask for them. Write them down carefully and hide it in a safe place.`}</span>
                    </p>

                    <div className="flex flex-column w-full px-2 items-center mt-4 gap-2">
                        <Button fullWidth shape="solid" color="norm" onClick={() => setViewMnemonic(true)}>
                            {c('Wallet setup').t`View wallet seed phrase`}
                        </Button>

                        <ButtonLike
                            as={Href}
                            fullWidth
                            href={getKnowledgeBaseUrl('/proton-wallet-seed-phrase')}
                            target="_blank"
                            className="text-semibold"
                            shape="underline"
                            color="weak"
                        >{c('Wallet setup').t`Learn more`}</ButtonLike>
                    </div>
                </div>
            )}
        </Modal>
    );
};
