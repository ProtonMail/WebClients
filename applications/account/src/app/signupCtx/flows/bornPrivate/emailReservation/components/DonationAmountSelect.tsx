import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import Price from '@proton/components/components/price/Price';
import { CurrencySymbols } from '@proton/payments/core/constants';
import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';

const DONATION_MAX_MAJOR_UNIT = 1000;
const DONATION_AMOUNTS_MINOR_UNITS = [100, 500, 1000, 2000];
type DonationValue = number;

interface DonationAmountSelectProps {
    currency: Currency;
    donationAmount: DonationValue;
    setDonationAmount: React.Dispatch<React.SetStateAction<number>>;
}

const DonationAmountSelect = ({ currency, donationAmount, setDonationAmount }: DonationAmountSelectProps) => {
    const [selectedButton, setSelectedButton] = useState<DonationValue | undefined>(donationAmount);
    const [showInput, setShowInput] = useState(false);
    const { divisor } = getCurrencyFormattingConfig(currency);

    const handleSelect = (newDonationAmount: DonationValue) => {
        setSelectedButton(newDonationAmount);
        setDonationAmount(newDonationAmount);
        setShowInput(false);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        if (value.startsWith('-') || value.includes(',') || value.includes('.')) {
            return;
        }

        if (value === '') {
            setDonationAmount(0);
            return;
        }

        if (!/^-?\d*$/.test(value)) {
            return;
        }

        const parsedNumber = parseInt(value);

        if (parsedNumber > DONATION_MAX_MAJOR_UNIT) {
            setDonationAmount(DONATION_MAX_MAJOR_UNIT * divisor);
            return;
        }

        const unformattedAmount = Math.floor(parsedNumber * divisor);
        setDonationAmount(unformattedAmount);
    };

    const onBlur = (event: FocusEvent<HTMLInputElement>) => {
        const parsed = parseInt(event.target.value) || 0;
        setDonationAmount(parsed * divisor);
    };

    const unselectedStyle = {
        backgroundColor: '#E9E5FA',
    };

    return (
        <div className="mt-8 mb-4">
            <label className="text-semibold">{c('Label').t`Donation amount`}</label>
            <div role="radiogroup" id="donationSelect" className="unstyled m-0 mt-1 flex flex-row gap-2">
                {DONATION_AMOUNTS_MINOR_UNITS.map((amount: number) => {
                    const isSelected = !showInput && selectedButton === amount;
                    return (
                        <Button
                            key={amount}
                            size="medium"
                            shape="solid"
                            color={isSelected ? 'norm' : 'weak'}
                            style={isSelected ? undefined : unselectedStyle}
                            onClick={() => handleSelect(amount)}
                            aria-pressed={isSelected}
                            data-testid={`donation-amount-${amount}`}
                        >
                            <Price currency={currency} className="text-semibold">
                                {amount}
                            </Price>
                        </Button>
                    );
                })}
                {!showInput ? (
                    <Button
                        size="medium"
                        shape="solid"
                        style={unselectedStyle}
                        onClick={() => {
                            setShowInput(true);
                        }}
                    >
                        <span className="text-semibold">Other</span>
                    </Button>
                ) : (
                    <Input
                        type="text"
                        inputMode="numeric"
                        onBlur={onBlur}
                        className="invisible-number-input-arrow min-w-custom"
                        placeholder={c('Placeholder').t`Amount`}
                        suffix={CurrencySymbols[currency]}
                        autoFocus
                        value={donationAmount / divisor}
                        containerProps={{ style: { '--min-w-custom': '6rem' } }}
                        onChange={handleChange}
                    />
                )}
            </div>
        </div>
    );
};

export default DonationAmountSelect;
