import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import noop from '@proton/utils/noop';

interface Props {
    loading?: boolean;
    onApply: (value: string) => Promise<void>;
}

const SubscriptionCheckoutPlanGiftCodeInput = ({ onApply, loading }: Props) => {
    const [code, setCode] = useState('');

    const handleSubmit = () => {
        onApply(code)
            .then(() => setCode(''))
            .catch(noop);
    };
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
            }}
            className="flex flex-column"
        >
            <div className="flex flex-nowrap items-center items-start mb-2">
                <div className="pr-2 flex-1">
                    <Input
                        value={code}
                        placeholder={c('Placeholder').t`Gift code`}
                        autoFocus
                        onValue={setCode}
                        data-testid="gift-code-input"
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                </div>
                <Button
                    color="norm"
                    title={c('Title').t`Apply gift code`}
                    loading={loading}
                    disabled={!code}
                    onClick={() => handleSubmit()}
                    data-testid="apply-gift-code"
                >{c('Action').t`Apply`}</Button>
            </div>
            <p className="m-0">{c('Info')
                .t`If you purchased a gift code or received one from our support team, you can enter it here.`}</p>
        </form>
    );
};

export default SubscriptionCheckoutPlanGiftCodeInput;
