import { c } from 'ttag';
import { Button, Icon, Label } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useLocationFieldOptions from './useLocationFieldOptions';
import LocationFieldDropdown from './LocationFieldDropdown';

interface Props {
    value: string;
    onChange: (nextValue: string) => void;
}

const { INBOX, ALL_MAIL, SENT, DRAFTS, ALL_SENT, ALL_DRAFTS } = MAILBOX_LABEL_IDS;
const LOCATION_FIELD_MAIN_OPTIONS: string[] = [ALL_MAIL, INBOX, DRAFTS, SENT, ALL_SENT, ALL_DRAFTS];

const LocationField = ({ value, onChange }: Props) => {
    const { all: options } = useLocationFieldOptions();
    const firstOptions = options.filter(({ value }) => LOCATION_FIELD_MAIN_OPTIONS.includes(value));
    const { getTextFromValue } = useLocationFieldOptions();

    const isCustomValue =
        value !== undefined && LOCATION_FIELD_MAIN_OPTIONS.every((optionValue) => optionValue !== value);
    const customValueText = isCustomValue ? getTextFromValue(value)?.text : undefined;
    const showCustomValue = isCustomValue === true && customValueText !== undefined;

    return (
        <>
            <Label className="block text-semibold mb0-5">{c('Label').t`Search in`}</Label>
            <div className="flex flex-wrap flex-align-items-start mb0-5 flex-gap-0-5">
                {firstOptions.map((option) => (
                    <Button
                        className="no-border rounded"
                        color={value === option.value ? 'norm' : 'weak'}
                        key={option.value}
                        data-testid={`location-${option.value}`}
                        onClick={() => onChange(option.value)}
                        shape="solid"
                        size="small"
                        type="button"
                    >
                        {option.text}
                    </Button>
                ))}
                <LocationFieldDropdown onChange={onChange} value={value} />
                {showCustomValue ? (
                    <Button
                        className="no-border rounded align-baseline text-ellipsis"
                        color="norm"
                        onClick={() => onChange(ALL_MAIL)}
                        shape="solid"
                        size="small"
                        type="button"
                    >
                        {customValueText}
                        <Icon name="xmark" className="ml0-5" size={12} title={c('Action').t`Remove`} />
                    </Button>
                ) : null}
            </div>
        </>
    );
};

export default LocationField;
