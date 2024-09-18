import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';

import { UnderlineButton } from '../../components';
import { useToggle } from '../../hooks';

interface Props {
    loading?: boolean;
    giftCode?: string;
    onApply: (value: string) => void;
    giftCodeRef: RefObject<HTMLInputElement>;
}

const getFormattedGiftCode = (giftCode: string) => {
    const splittedGiftCode = giftCode.replace(/-/g, '').match(/.{1,4}/g) || [''];
    return splittedGiftCode.join('-').toUpperCase();
};

const PaymentGiftCode = ({ giftCodeRef, giftCode = '', onApply, loading }: Props) => {
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
            <div className="flex items-center">
                <span className="flex-1 flex-nowrap items-center">
                    <Icon name="gift" className="mr-2 mb-1 shrink-0" />
                    <code>{getFormattedGiftCode(giftCode)}</code>
                </span>
                <Button
                    icon
                    shape="ghost"
                    className="flex items-center ml-1"
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
            <div className="flex flex-nowrap items-center items-start mb-2">
                <div className="pr-2 flex-1">
                    <Input
                        value={code}
                        ref={giftCodeRef}
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
                    onClick={handleSubmit}
                    data-testid="apply-gift-code"
                >{c('Action').t`Apply`}</Button>
            </div>
        );
    }

    return (
        <>
            <UnderlineButton className="mr-2" onClick={toggle} data-testid="add-gift-code">{c('Link')
                .t`Add a gift code`}</UnderlineButton>
            <Info
                title={c('Tooltip')
                    .t`If you purchased a gift code or received one from our support team, you can enter it here.`}
            />
        </>
    );
};

export default PaymentGiftCode;
