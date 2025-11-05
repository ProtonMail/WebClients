import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, PasswordInputTwo } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    onSubmit: (password: string) => void;
}

const MessageDecryptForm = ({ onSubmit }: Props) => {
    const [password, setPassword] = useState<string>('');

    const handleSubmit = () => {
        onSubmit(password);
    };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="px-7 sm:px-0">
            <h1 className="eo-layout-title mb-0 mt-2 md:mt-0">{c('Info').t`Unlock message`}</h1>
            <div className="mt-1 color-weak mb-8">{MAIL_APP_NAME}</div>
            <InputFieldTwo
                autoFocus
                id="password"
                label={c('Label').t`Password`}
                bigger
                value={password}
                onValue={setPassword}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        handleSubmit();
                    }
                }}
                as={PasswordInputTwo}
                rootClassName="mt-2"
                data-testid="unlock:input"
            />
            <Button
                size="large"
                color="norm"
                type="button"
                data-testid="unlock:submit"
                fullWidth
                onClick={handleSubmit}
            >{c('Action').t`Read message`}</Button>
        </form>
    );
};

export default MessageDecryptForm;
