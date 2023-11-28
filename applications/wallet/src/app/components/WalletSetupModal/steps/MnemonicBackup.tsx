import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { WalletLogo } from '@proton/components/components';

import { BankCard } from './BankCard';

interface Props {
    onContinue: () => void;
}

export const MnemonicBackup = ({ onContinue }: Props) => {
    const [showMnemonic, setShowMnemonic] = useState(false);

    const mnemonic = [
        'desk',
        'house',
        'hungry',
        'behave',
        'prevent',
        'idle',
        'husband',
        'simple',
        'room',
        'member',
        'moment',
        'enhance',
    ];

    return (
        <div className="p-6 flex flex-column">
            {showMnemonic ? (
                <>
                    <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your Mnemonic`}</span>

                    <p className="block text-center color-weak">{c('Wallet setup')
                        .t`This is your secret recovery phrase. If you lose access to your account, this phrase will let you recover your wallet.`}</p>

                    {/* Mnemonic words */}
                    <Card rounded bordered={false} className="flex flex-row flex-justify-center">
                        {mnemonic.map((word, index) => (
                            // TODO: use Pills component here
                            <span
                                className="block m-2 p-1 px-2 rounded text-sm"
                                key={`${index}_${word}`}
                                style={{
                                    background: 'var(--signal-info-minor-1)',
                                    color: 'var(--signal-info-major-3)',
                                }}
                            >
                                {index + 1}. {word}
                            </span>
                        ))}
                    </Card>

                    <p className="block text-center color-weak">{c('Wallet setup')
                        .t`Save these 12 words securely and never share them with anyone.`}</p>

                    <Button className="mt-2" color="norm" onClick={() => onContinue()}>
                        {c('Wallet setup').t`Continue`}
                    </Button>
                </>
            ) : (
                <>
                    <span className="block h4 text-bold mx-auto">{c('Wallet setup')
                        .t`Your Bitcoin Wallet is created`}</span>

                    {/* Credit card design */}

                    <BankCard width={24}>
                        <div
                            className="w-full flex flex-column flex-justify-space-between h-custom"
                            style={{ '--h-custom': '11rem' }}
                        >
                            <WalletLogo variant="glyph-only" />

                            <div className="w-full flex flex-row flex-justify-space-between flex-align-items-end">
                                <span className="text-semibold">O BTC</span>
                                <div>
                                    <span className="block text-right color-disabled">Bitcoin Wallet</span>
                                    <span className="block text-right text-semibold">bc1p54***3297</span>
                                </div>
                            </div>
                        </div>
                    </BankCard>

                    <p className="my-0 block text-center color-weak">{c('Wallet setup')
                        .t`Your new wallet is created. Make sure you back it up`}</p>

                    <Button className="mt-8" color="norm" onClick={() => setShowMnemonic(true)}>{c('Wallet setup')
                        .t`Back up your wallet`}</Button>
                </>
            )}
        </div>
    );
};
