import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, PrimaryButton } from '@proton/components';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

import CustomFrequencySelector from './CustomFrequencySelector';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: object;
    isSubmitted: boolean;
    onChange: (value: FrequencyModel) => void;
    modalProps: ModalStateProps;
}

const CustomFrequencyModal = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    onChange,
    isSubmitted,
    modalProps,
}: Props) => {
    const [values, setValues] = useState(frequencyModel);

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader title={c('Header').t`Custom recurrence`} />
            <ModalTwoContent>
                <CustomFrequencySelector
                    frequencyModel={values}
                    start={start}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    errors={errors}
                    isSubmitted={isSubmitted}
                    onChange={setValues}
                    displayStacked
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>
                <PrimaryButton
                    onClick={() => {
                        onChange(values);
                    }}
                >{c('Action').t`Done`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CustomFrequencyModal;
