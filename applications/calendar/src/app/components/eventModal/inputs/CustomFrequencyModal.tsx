import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { END_TYPE, FREQUENCY, type VIEWS } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

import { getIsCalendarAppInDrawer } from '../../../helpers/views';
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
    view: VIEWS;
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
    view,
}: Props) => {
    const [values, setValues] = useState(frequencyModel);
    const isDrawerApp = getIsCalendarAppInDrawer(view);

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('Header').t`Repeat event`} />
            <ModalTwoContent>
                <CustomFrequencySelector
                    frequencyModel={values}
                    start={start}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    errors={errors}
                    isSubmitted={isSubmitted}
                    onChange={setValues}
                    displayStacked={isDrawerApp}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        onChange({ ...values, type: FREQUENCY.CUSTOM });
                    }}
                    disabled={values.ends.type === END_TYPE.UNTIL && !values.ends.until}
                >{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CustomFrequencyModal;
