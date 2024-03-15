import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import Slider from '@proton/atoms/Slider/Slider';
import Label from '@proton/components/components/label/Label';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import { useFeeSelectionModal } from './useFeeSelectionModal';

interface Props {
    modalState: ModalStateProps;
    feesEstimations: [number, number][];
    feeRate: number;
    onFeeRateSelected: (feeRate: number) => void;
}

export const FeeSelectionModal = ({ modalState, feesEstimations, onFeeRateSelected, feeRate }: Props) => {
    const { handleBlockTargetChange, handleFeeRateChange, tmpBlockTarget, tmpFeeRate } = useFeeSelectionModal(
        feesEstimations,
        feeRate,
        modalState.open
    );

    const title = c('Wallet Send').t`Select fees`;

    return (
        <ModalTwo {...modalState} title={title} size="large" enableCloseWhenClickOutside>
            <ModalHeader title={title} />

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
                        data-testid="fee-rate-input"
                        value={tmpFeeRate}
                        placeholder={c('Wallet Send').t`Fee rate`}
                        onChange={(event) => {
                            handleFeeRateChange(event.target.value);
                        }}
                    />
                </div>

                <div className="my-3 flex w-full items-end">
                    <Button className="ml-auto" onClick={() => modalState.onClose()}>{c('Wallet Send')
                        .t`Cancel`}</Button>
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
