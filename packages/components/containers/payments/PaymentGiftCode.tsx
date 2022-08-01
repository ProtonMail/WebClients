import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { Icon, Info, InputTwo, UnderlineButton } from '../../components';
import { useToggle } from '../../hooks';

interface Props {
    loading?: boolean;
    giftCode?: string;
    onApply: (value: string) => void;
}

const getFormattedGiftCode = (giftCode: string) => {
    const splittedGiftCode = giftCode.replace(/-/g, '').match(/.{1,4}/g) || [''];
    return splittedGiftCode.join('-').toUpperCase();
};

const PaymentGiftCode = ({ giftCode = '', onApply, loading }: Props) => {
    const { state, toggle, set } = useToggle();
    const [code, setCode] = useState('');

    const handleCancel = () => {
        set(false);
        setCode('');
    };

    useEffect(() => {
        // When we remove the gift code
        if (!giftCode) {
            handleCancel();
        }
    }, [giftCode]);

    if (giftCode) {
        return (
            <div className="flex flex-align-items-center">
                <span className="flex-item-fluid flex-nowrap flex-align-items-center">
                    <Icon name="gift" className="mr0-5 mb0-25 flex-item-noshrink" />
                    <code>{getFormattedGiftCode(giftCode)}</code>
                </span>
                <Button
                    icon
                    shape="ghost"
                    className="flex flex-align-items-center ml0-25"
                    onClick={() => onApply('')}
                    title={c('Action').t`Remove gift code`}
                >
                    <Icon name="trash" alt={c('Action').t`Remove gift code`} />
                </Button>
            </div>
        );
    }

    if (state) {
        const handleSubmit = () => {
            if (!code) {
                return;
            }
            onApply(code);
        };

        return (
            <div className="flex flex-nowrap flex-align-items-center flex-align-items-start">
                <div className="pr0-5 flex-item-fluid">
                    <InputTwo
                        value={code}
                        placeholder={c('Placeholder').t`Gift code`}
                        onValue={setCode}
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
                    onClick={handleSubmit}
                >{c('Action').t`Apply`}</Button>
            </div>
        );
    }

    return (
        <>
            <UnderlineButton className="mr0-5" onClick={toggle}>{c('Link').t`Add a gift code`}</UnderlineButton>
            <Info
                title={c('Tooltip')
                    .t`If you purchased a gift code or received one from our support team, you can enter it here.`}
            />
        </>
    );
};

export default PaymentGiftCode;
