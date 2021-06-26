import React from 'react';
import { c } from 'ttag';
import { PrimaryButton, Input } from '../../../components';

interface Props {
    code: string;
    loading?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

const GiftCodeForm = ({ code, loading, disabled, onChange, onSubmit }: Props) => {
    const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
        }
    };
    return (
        <div className="flex flex-nowrap flex-align-items-center flex-align-items-start">
            <div className="pr0-5 flex-item-fluid">
                <Input
                    value={code}
                    placeholder={c('Placeholder').t`Gift code`}
                    onChange={({ target }) => onChange(target.value)}
                    onKeyPress={handleEnter}
                />
            </div>
            <PrimaryButton
                title={c('Title').t`Apply gift code`}
                loading={loading}
                disabled={disabled || !code}
                onClick={onSubmit}
            >{c('Action').t`Apply`}</PrimaryButton>
        </div>
    );
};

export default GiftCodeForm;
