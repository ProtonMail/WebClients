import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useLoading } from '@proton/hooks';
import { IcEye, IcEyeSlash } from '@proton/icons';

import './PasswordPrompt.scss';

interface PasswordPromptProps {
    password: string;
    setPassword: (password: string) => void;
    onPasswordSubmit: () => Promise<boolean>;
    invalidPassphrase: boolean;
}

export const PasswordPrompt = ({ password, setPassword, onPasswordSubmit, invalidPassphrase }: PasswordPromptProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [loading, withLoading] = useLoading();

    return (
        <ModalTwo
            open={true}
            className="shadow-none w-custom h-custom"
            rootClassName="blurry-backdrop"
            style={{ '--w-custom': '24.5rem', '--h-custom': '24.5rem' }}
        >
            <ModalTwoContent className="py-4">
                <div className="flex flex-column items-center">
                    <div className="text-3xl text-semibold text-center mb-4 mt-4">{c('Info')
                        .t`This meeting is password protected`}</div>
                    <div className="my-4 color-weak text-center">{c('Info')
                        .t`Please enter the passphrase to decrypt and view this meeting`}</div>

                    <div className="relative w-full my-1">
                        <InputFieldStackedGroup classname="w-full relative">
                            <InputFieldStacked isGroupElement>
                                <InputFieldTwo
                                    id="password-prompt-password-input"
                                    name="password p-4"
                                    label={c('Label').t`Passphrase`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordChanged(true);
                                    }}
                                    unstyled={true}
                                    placeholder={c('Placeholder').t`Enter passphrase`}
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
                            aria-label={c('Alt').t`Show passphrase`}
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

                    {!passwordChanged && invalidPassphrase && (
                        <div className="color-danger w-full text-center mt-2">{c('Error').t`Invalid passphrase`}</div>
                    )}

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
                            onClick={() => {
                                void withLoading(onPasswordSubmit());
                                setPasswordChanged(false);
                            }}
                            loading={loading}
                            disabled={!password || loading}
                        >
                            {c('Action').t`Continue`}
                        </Button>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
