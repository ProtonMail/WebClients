import { KeyboardEvent, useState } from 'react';

import { c } from 'ttag';

import { Button, InputFieldTwo, PasswordInputTwo } from '@proton/components';
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
        <form onSubmit={(e) => e.preventDefault()}>
            <h1 className="eo-layout-title mb0 on-mobile-mt0-5">{c('Info').t`Unlock message`}</h1>
            <div className="mt0-25 color-weak mb2">{MAIL_APP_NAME}</div>
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
                rootClassName="mt0-5"
                data-testid="unlock:input"
            />
            <Button size="large" color="norm" type="button" fullWidth onClick={handleSubmit}>{c('Action')
                .t`Read message`}</Button>
        </form>
    );
};

export default MessageDecryptForm;
