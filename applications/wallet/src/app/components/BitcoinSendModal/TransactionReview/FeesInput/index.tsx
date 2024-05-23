import { ChangeEvent, useRef, useState } from 'react';

import { noop } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmTxBuilder } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { Slider } from '@proton/atoms/Slider';
import { Icon } from '@proton/components/components';

import { CoreButton } from '../../../../atoms';
import { Price } from '../../../../atoms/Price';
import { TxBuilderUpdater } from '../../../../hooks/useTxBuilder';
import { useFeesInput } from './useFeesInput';

interface Props {
    exchangeRate?: WasmApiExchangeRate;
    fees: number;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
}

export const Fees = ({ exchangeRate, fees, txBuilder, updateTxBuilder }: Props) => {
    const [showFeeInputs, setShowFeeInputs] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isRecommended, note, blockTarget, feeRate, handleBlockTargetChange, handleFeesSelected } = useFeesInput(
        txBuilder,
        updateTxBuilder
    );

    return (
        <div className="flex flex-column w-full">
            <div className="flex flex-row flex-nowrap color-hint w-full gap-1">
                <div className="w-3/10">{c('Wallet transaction').t`Network fees`}</div>
                <div className="w-2/10 flex">
                    <div className="ml-auto">{exchangeRate && <Price satsAmount={fees} unit={exchangeRate} />}</div>
                </div>
                <div className="w-3/10 flex">
                    <div className="ml-auto">
                        <Price satsAmount={fees} unit={'BTC'} />
                    </div>
                </div>
                <CoreButton
                    size="small"
                    shape="ghost"
                    color="norm"
                    className="mx-auto py-0 w-2/10"
                    onClick={() => {
                        setShowFeeInputs(true);
                    }}
                >
                    {c('Wallet send').t`Edit`}
                </CoreButton>
            </div>

            {showFeeInputs && (
                <>
                    <div className="mt-4 px-4">
                        <Slider
                            color="norm"
                            size="small"
                            onInput={noop}
                            noButtonIcon
                            buttonClassName="rounded-full"
                            step={1}
                            min={1}
                            value={blockTarget}
                            max={25}
                            onChange={handleBlockTargetChange}
                            getDisplayedValue={(value) => (value < 25 ? value : '25+')}
                        />
                    </div>

                    <div className="flex flex-row flex-nowrap">
                        <div className="flex flex-column no-shrink">
                            <span className="block">
                                {isRecommended
                                    ? c('Wallet transaction').t`Recommended fees`
                                    : c('Wallet transaction').t`Selected fees`}
                            </span>
                            <span className="block color-hint">{
                                // translator: here `note` is either "high", "moderate" or "low". It is used to simply define to transaction confirmation speed
                                c('Wallet transaction').t`Confirmation speed: ${note}`
                            }</span>
                        </div>

                        <div className="flex flex-column ml-auto">
                            <div className="flex flex-row flex-nowrap w-full">
                                <span className="block">{c('Wallet transaction').t`sats/vbyte`}</span>
                                <input
                                    ref={inputRef}
                                    value={feeRate}
                                    type="number"
                                    min={1}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        handleFeesSelected(Number(e.target.value))
                                    }
                                    className="invisible-number-input-arrow ml-3 block text-right w-custom"
                                    style={{ '--w-custom': '3rem' }}
                                />
                            </div>

                            {exchangeRate && (
                                <span className="ml-auto block color-hint">
                                    <Price satsAmount={fees} unit={exchangeRate} />
                                </span>
                            )}
                        </div>

                        <Button
                            className="ml-4 rounded-full"
                            size="small"
                            shape="solid"
                            color="weak"
                            onClick={() => {
                                inputRef.current?.focus();
                            }}
                        >
                            <Icon name="pencil" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};
