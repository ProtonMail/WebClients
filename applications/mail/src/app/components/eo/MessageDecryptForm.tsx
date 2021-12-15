import { KeyboardEvent, useState } from 'react';
import { c } from 'ttag';
import { Button, InputFieldTwo, PasswordInputTwo } from '@proton/components';

interface Props {
    onSubmit: (password: string) => void;
}

const MessageDecryptForm = ({ onSubmit }: Props) => {
    const [password, setPassword] = useState<string>('');

    const handleSubmit = () => {
        setPassword('');
        onSubmit(password);
    };

    return (
        <form onSubmit={(e) => e.preventDefault()}>
            <h2 className="h3 text-center">{c('Info').t`Decrypt message`}</h2>
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
            />
            <Button size="large" color="norm" type="button" fullWidth onClick={handleSubmit}>{c('Action')
                .t`Decrypt`}</Button>
        </form>
    );
};

export default MessageDecryptForm;
