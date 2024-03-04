import { uniq } from 'lodash';
import { c } from 'ttag';

import { WasmBitcoinUnit } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';

import { BITCOIN } from '../constants';

interface Props {
    value: number;
    onValueChange: (value: number) => void;
    'data-testid'?: string;
    placeholder?: string;
    title?: string;
    min?: number;
    disabled?: boolean;
    suffix?: string;

    unit?: WasmBitcoinUnit;
    onUnitChange?: (unit: WasmBitcoinUnit) => void;
    allowedUnits?: WasmBitcoinUnit[];

    onMaxValue?: () => void;
}

const bitcoinUnitLabelByWasmBitcoinUnit: Record<WasmBitcoinUnit, string> = {
    [WasmBitcoinUnit.BTC]: 'BTC',
    [WasmBitcoinUnit.MBTC]: 'MBTC',
    [WasmBitcoinUnit.SAT]: 'SAT',
};

export const BitcoinAmountInput = ({
    value,
    onValueChange,
    onMaxValue,

    unit = WasmBitcoinUnit.SAT,
    onUnitChange,
    allowedUnits = [WasmBitcoinUnit.SAT, WasmBitcoinUnit.BTC],

    ['data-testid']: dataTestId = 'recipient-amount-input',
    placeholder = c('Wallet').t`Amount`,
    title = c('Wallet').t`Amount`,
    min = 0,
    disabled,
    suffix,
}: Props) => {
    return (
        <>
            <div className="max-w-custom" style={{ '--max-w-custom': '10rem' }}>
                <Input
                    data-testid={dataTestId}
                    placeholder={placeholder}
                    title={title}
                    type="number"
                    value={value}
                    min={min}
                    step={unit === WasmBitcoinUnit.SAT ? 1 : 1 / BITCOIN}
                    disabled={disabled}
                    suffix={suffix}
                    onChange={(event) => {
                        onValueChange(parseFloat(event.target.value));
                    }}
                />
            </div>

            {onUnitChange && (
                <ButtonGroup className="ml-3">
                    {uniq(allowedUnits).map((unitB) => (
                        <Button
                            key={unitB}
                            data-testid={`${unitB}-amount-input-unit-button`}
                            selected={unit === unitB}
                            onClick={() => onUnitChange(unitB)}
                        >
                            {bitcoinUnitLabelByWasmBitcoinUnit[unitB]}
                        </Button>
                    ))}
                </ButtonGroup>
            )}

            {onMaxValue && (
                <Button className="ml-3" shape="underline" color="norm" onClick={() => onMaxValue()}>{c('Wallet Send')
                    .t`Maximum amount`}</Button>
            )}
        </>
    );
};
