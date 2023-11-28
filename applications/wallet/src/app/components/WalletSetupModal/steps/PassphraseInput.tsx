import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Alert, InputFieldTwo, PasswordInputTwo } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import passphraseSvg from '@proton/styles/assets/img/illustrations/wallet-passphrase-input.svg';

interface Props {
    onContinue: (passphrase: string) => void;
}

export const PassphraseInput = ({ onContinue }: Props) => {
    const [showPassphraseInput, setShowPassphraseInput] = useState(false);
    const [passphrase, setPassphrase] = useState('');

    return (
        <div className="p-6 flex flex-column">
            <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your passphrase (optional)`}</span>

            <p className="block text-center color-weak">{c('Wallet setup')
                .t`For additional security you can use a passphrase. Not that you will need this passphrase to access your wallet, it won't be stored in your ${BRAND_NAME} account.`}</p>

            {showPassphraseInput ? (
                <>
                    <Alert type="warning" className="mb-6">{c('Wallet setup')
                        .t`Store your passphrase at a safe location. Without the passphrase, even ${BRAND_NAME} cannot recover your funds`}</Alert>

                    <InputFieldTwo
                        autoFocus
                        id="passphrase"
                        as={PasswordInputTwo}
                        value={passphrase}
                        onValue={setPassphrase}
                        label={c('Wallet setup').t`Passphrase`}
                        placeholder={c('Placeholder').t`Passphrase`}
                        assistiveText={c('Placeholder').t`Use a strong passphrase with special characters and numbers`}
                    />

                    <Button className="mt-6 mb-3" color="norm" onClick={() => onContinue(passphrase)}>{c('Wallet setup')
                        .t`Save passphrase`}</Button>
                </>
            ) : (
                <>
                    {/* Image */}
                    <Card bordered={false} rounded className="flex py-12 my-3">
                        <img
                            className="h-custom m-auto"
                            style={{ '--h-custom': '6rem' }}
                            src={passphraseSvg}
                            alt={c('Description')
                                .t`Laptop screen with a sign lock sign and password input with hidden value`}
                        />
                    </Card>

                    <div className="flex flex-column">
                        <Button className="my-3" color="norm" onClick={() => onContinue(passphrase)}>{c('Wallet setup')
                            .t`Continue without Passphrase`}</Button>
                        <Button onClick={() => setShowPassphraseInput(true)}>{c('Wallet setup')
                            .t`Yes, I want to use a Passphrase`}</Button>
                    </div>
                </>
            )}
        </div>
    );
};
