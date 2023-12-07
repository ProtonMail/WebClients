import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Input } from '@proton/atoms/Input';
import { Slider } from '@proton/atoms/Slider';
import { Label, ModalTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

import { useFeeSelectionModal } from './useFeeSelectionModal';

interface Props {
    isOpen: boolean;
    feeEstimations: [number, number][];
    blockTarget: number;
    feeRate: number;
    onClose: () => void;
    onFeeRateSelected: (feeRate: number) => void;
}

export const FeeSelectionModal = ({
    isOpen,
    onClose,
    feeEstimations,
    onFeeRateSelected,
    blockTarget,
    feeRate,
}: Props) => {
    const { handleBlockTargetChange, handleFeeRateChange, tmpBlockTarget, tmpFeeRate } = useFeeSelectionModal(
        feeEstimations,
        isOpen,
        blockTarget,
        feeRate
    );

    return (
        <ModalTwo title={c('Wallet Send').t`Select fees`} open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            <ModalContent className="pt-2">
                <span className="block h4 my-4 text-semibold">{c('Wallet Send').t`Select fees`}</span>

                <div className="mb-3">
                    <Label className="block mb-2 text-sm" htmlFor="estimated-confirmation-block">
                        {c('Wallet send').ngettext(
                            msgid`Expect confirmation in ${tmpBlockTarget} block`,
                            `Expect confirmation in ${tmpBlockTarget} blocks`,
                            tmpBlockTarget
                        )}
                    </Label>

                    <Slider
                        id="estimated-confirmation-block"
                        value={tmpBlockTarget}
                        step={1}
                        min={1}
                        max={25}
                        onChange={handleBlockTargetChange}
                        getDisplayedValue={(value) => (value < 25 ? value : '25+')}
                        size="small"
                    />
                </div>

                <div className="mb-6">
                    <Label className="block mb-2 text-sm" htmlFor="fee-rate">{c('Wallet Send')
                        .t`Fee rate - sats/vB`}</Label>
                    <Input
                        type="number"
                        step={0.01}
                        id="fee-rate"
                        value={tmpFeeRate}
                        placeholder={c('Wallet Send').t`Fee rate`}
                        onChange={handleFeeRateChange}
                    />
                </div>

                <div className="my-3 flex w-full items-end">
                    <Button className="ml-auto" onClick={onClose}>{c('Wallet Send').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        className="ml-3"
                        onClick={() => {
                            onFeeRateSelected(tmpFeeRate);
                        }}
                    >{c('Wallet Send').t`Done`}</Button>
                </div>
            </ModalContent>
        </ModalTwo>
    );
};
