import { c } from 'ttag';

import { getTimeUnitLabels } from '@proton/activation/src/constants';
import { TIME_PERIOD } from '@proton/activation/src/interface';
import { Field, Icon, Label, Option, Row, SelectTwo, Tooltip } from '@proton/components';

interface Props {
    selectedPeriod: TIME_PERIOD;
    onChange: (timePeriod: TIME_PERIOD) => void;
}

const CustomizeMailImportModalPeriod = ({ selectedPeriod, onChange }: Props) => {
    const timeUnitLabels = getTimeUnitLabels();
    const periodOptions = Object.values(TIME_PERIOD).map((item) => ({ value: item, text: timeUnitLabels[item] }));

    return (
        <div className="mb-4 border-bottom items-center">
            <Row>
                <Label className="flex items-center">
                    {c('Label').t`Import interval`}
                    <Tooltip title={c('Tooltip').t`The import will start with the most recent messages.`}>
                        <Icon name="info-circle" className="ml-2" />
                    </Tooltip>
                </Label>
                <Field>
                    <SelectTwo
                        value={selectedPeriod}
                        onChange={({ value }) => {
                            onChange(value);
                        }}
                    >
                        {periodOptions.map((period) => (
                            <Option key={period.value} value={period.value} title={period.text}>
                                {period.text}
                            </Option>
                        ))}
                    </SelectTwo>
                </Field>
            </Row>
        </div>
    );
};

export default CustomizeMailImportModalPeriod;
