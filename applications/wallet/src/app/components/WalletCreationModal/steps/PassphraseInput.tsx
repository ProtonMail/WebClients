import { useState } from 'react';

import { c } from 'ttag';

import { Alert, PasswordInputTwo } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Button, Input } from '../../../atoms';

interface Props {
    onContinue: (passphrase: string) => void;
}

export const PassphraseInput = ({ onContinue }: Props) => {
    const [passphrase, setPassphrase] = useState('');

    return (
        <div className="flex flex-column">
            <Alert type="warning" className="mb-6">{c('Wallet setup')
                .t`Store your passphrase at a safe location. Without the passphrase, even ${BRAND_NAME} cannot recover your funds`}</Alert>

            <div className="mb-3">
                <Input
                    autoFocus
                    id="passphrase"
                    as={PasswordInputTwo}
                    value={passphrase}
                    onValue={setPassphrase}
                    label={c('Wallet setup').t`Passphrase`}
                    assistiveText={c('Placeholder').t`Leave empty if you don't want to add passphrase`}
                />
            </div>

            <Button
                pill
                className="block w-4/5 mx-auto mt-4 mb-2"
                shape="solid"
                color="norm"
                onClick={() => onContinue(passphrase)}
            >
                {passphrase ? c('Wallet setup').t`Save passphrase` : c('Wallet setup').t`Continue without passphrase`}
            </Button>
        </div>
    );
};
