import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
} from '@proton/components';

import './PasswordPrompt.scss';

interface PasswordPromptProps {
    onPasswordSubmit: (password: string) => void;
}

export const PasswordPrompt = ({ onPasswordSubmit }: PasswordPromptProps) => {
    const [password, setPassword] = useState('');

    return (
        <div className="text-center">
            <ModalTwo open={true} rootClassName="blurry-backdrop">
                <ModalTwoHeader title={c('l10n_nightly Info').t`Password required`} hasClose={false} />
                <ModalTwoContent>
                    <InputFieldTwo
                        id="password-prompt-password-input"
                        name="password"
                        as={PasswordInputTwo}
                        label={c('l10n_nightly Label').t`Meeting password`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </ModalTwoContent>
                <ModalTwoFooter className="flex justify-end gap-2">
                    <Button className="rounded-full" color="norm" onClick={() => onPasswordSubmit(password)}>
                        {c('l10n_nightly Action').t`Submit`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
        </div>
    );
};
