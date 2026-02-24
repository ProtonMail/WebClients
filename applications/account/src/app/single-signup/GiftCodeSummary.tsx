import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Input } from '@proton/atoms/Input/Input';
import { Info, Price, useNotifications } from '@proton/components';
import { useCouponConfig } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import { IcCross } from '@proton/icons/icons/IcCross';
import type { Currency, PlanIDs, PlansMap } from '@proton/payments';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';

interface Props {
    coupon?: {
        code: string;
        description: string;
        discount: number;
        currency: Currency;
    };
    onApplyCode: (code: string) => Promise<void>;
    onRemoveCode: () => Promise<void>;

    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult: SubscriptionEstimation;
}

const GiftCodeSummary = ({ coupon, onApplyCode, onRemoveCode, planIDs, plansMap, checkResult }: Props) => {
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [applyingCode, setApplyingCode] = useState(false);

    const [removingCode, setRemovingCode] = useState(false);

    const { createNotification } = useNotifications();

    const couponConfig = useCouponConfig({ planIDs, plansMap, checkResult });

    if (coupon) {
        const { code, description, discount, currency } = coupon;

        const handleRemoveCode = async () => {
            setRemovingCode(true);

            await onRemoveCode();

            setRemovingCode(false);
        };

        return (
            <div className="flex items-center gap-2 my-1 text-sm">
                <div>
                    <span className="flex items-center rounded-sm bg-success px-1 py-0.5 text-semibold">
                        <span className="mr-0.5">{code}</span>
                        {removingCode ? <CircleLoader /> : <IcCross onClick={handleRemoveCode} />}
                    </span>
                </div>
                {!couponConfig?.hidden && (
                    <>
                        <div className="color-weak flex-auto">{description}</div>
                        <Price currency={currency} className="color-weak">
                            {discount}
                        </Price>
                    </>
                )}
            </div>
        );
    }

    const handleApplyCode = async () => {
        setApplyingCode(true);

        try {
            await onApplyCode(inputValue);
            setShowInput(false);
            setInputValue('');
        } catch (error: any) {
            createNotification({ text: error.message, type: 'error' });
        } finally {
            setApplyingCode(false);
        }
    };

    if (showInput) {
        return (
            <div className="flex flex-nowrap items-center items-start">
                <div className="pr-2 flex-1">
                    <Input
                        value={inputValue}
                        onValue={setInputValue}
                        // ref={giftCodeRef}
                        placeholder={c('Placeholder').t`Add gift code`}
                        autoFocus
                        disableChange={applyingCode}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                void handleApplyCode();
                            }
                        }}
                    />
                </div>
                <Button
                    color="norm"
                    title={c('Title').t`Apply gift code`}
                    loading={applyingCode}
                    disabled={!inputValue}
                    onClick={handleApplyCode}
                >
                    {c('Action').t`Apply`}
                </Button>
            </div>
        );
    }

    return (
        <div>
            <Button shape="underline" color="norm" className="mr-2" size="small" onClick={() => setShowInput(true)}>
                {c('Link').t`Add gift code`}
            </Button>
            <Info
                title={c('Tooltip')
                    .t`If you purchased a gift code or received one from our support team, you can enter it here.`}
            />
        </div>
    );
};

export default GiftCodeSummary;
