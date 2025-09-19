import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
} from '@proton/components';

type Props = {
    onSubmit: (password?: string) => void;
    onClose: () => void;
    title: string;
    unsafeCTA?: string;
};

const isValidPassword = (password: string, confirmation: string): boolean =>
    password.trim().length > 0 && password === confirmation;

export const ExportModal: FC<Props> = ({ onSubmit, onClose, title, unsafeCTA }) => {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const valid = isValidPassword(password, passwordConfirmation);

    return (
        <ModalTwo
            as={Form}
            onClose={onClose}
            onReset={onClose}
            onSubmit={() => valid && onSubmit(password)}
            open
            size="small"
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent className="my-2 flex gap-2">
                <InputFieldTwo
                    as={PasswordInputTwo}
                    autoFocus
                    dense
                    onValue={setPassword}
                    placeholder={c('Placeholder').t`Password`}
                    required
                    value={password}
                />
                <InputFieldTwo
                    as={PasswordInputTwo}
                    dense
                    onValue={setPasswordConfirmation}
                    placeholder={c('Placeholder').t`Confirm password`}
                    required
                    value={passwordConfirmation}
                />
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch text-center gap-1">
                <Button className="cta-button" type="submit" color="norm" disabled={!valid}>
                    {c('Action').t`Use this password`}
                </Button>
                {unsafeCTA && (
                    <Button onClick={() => onSubmit()} color="danger" pill>
                        {unsafeCTA}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
