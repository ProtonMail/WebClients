import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    InputFieldStacked,
    InputFieldStackedGroup,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
} from '@proton/components';
import { IcEye, IcEyeSlash } from '@proton/icons';

import './PasswordPrompt.scss';

interface PasswordPromptProps {
    onPasswordSubmit: (password: string) => Promise<boolean>;
}

export const PasswordPrompt = ({ onPasswordSubmit }: PasswordPromptProps) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async () => {
        const result = await onPasswordSubmit(password);

        if (result) {
            setPassword('');
        }
    };

    return (
        <div className="password-prompt-wrapper text-center">
            <ModalTwo
                open={true}
                className="shadow-none w-custom h-custom"
                rootClassName="blurry-backdrop"
                style={{ '--w-custom': '24.5rem', '--h-custom': '24.5rem' }}
            >
                <ModalTwoContent className="py-4">
                    <div className="flex flex-column items-center">
                        <div className="text-3xl text-semibold text-center mb-4 mt-4">{c('l10n_nightly Info')
                            .t`This meeting is password protected`}</div>
                        <div className="my-4 color-weak text-center">{c('l10n_nightly Info')
                            .t`Please enter the password to decrypt and view this meeting`}</div>

                        <div className="relative w-full my-4">
                            <InputFieldStackedGroup classname="w-full relative">
                                <InputFieldStacked isGroupElement>
                                    <InputFieldTwo
                                        id="password-prompt-password-input"
                                        name="password p-4"
                                        label={c('l10n_nightly Label').t`Password`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        unstyled={true}
                                        placeholder={c('l10n_nightly Placeholder').t`Enter password`}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="off"
                                    />
                                </InputFieldStacked>
                            </InputFieldStackedGroup>
                            <Button
                                className="password-prompt-button absolute top-custom right-custom w-custom h-custom rounded-full flex items-center justify-center border-none p-0"
                                color="norm"
                                size="small"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-pressed={showPassword}
                                aria-label={c('l10n_nightly Alt').t`Show password`}
                                style={{
                                    '--top-custom': '50%',
                                    '--right-custom': '1rem',
                                    '--w-custom': '2rem',
                                    '--h-custom': '2rem',
                                    transform: 'translateY(-50%)',
                                }}
                            >
                                {showPassword ? <IcEye size={4} /> : <IcEyeSlash size={4} />}
                            </Button>
                        </div>

                        <div
                            className="w-full absolute flex justify-center items-center bottom-custom px-8"
                            style={{
                                '--bottom-custom': '1.5rem',
                            }}
                        >
                            <Button
                                className="continue-button rounded-full py-4 color-invert w-full text-semibold"
                                color="norm"
                                size="large"
                                onClick={handleSubmit}
                            >
                                {c('l10n_nightly Action').t`Continue`}
                            </Button>
                        </div>
                    </div>
                </ModalTwoContent>
            </ModalTwo>
        </div>
    );
};
