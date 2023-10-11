import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';

import LocationFieldDropdown from './LocationFieldDropdown';
import { useLocationFieldOptions } from './useLocationFieldOptions';

interface Props {
    value: string;
    onChange: (nextValue: string) => void;
}

const { INBOX, ALL_MAIL, ALMOST_ALL_MAIL, SENT, DRAFTS, ALL_SENT, ALL_DRAFTS } = MAILBOX_LABEL_IDS;
const LOCATION_FIELD_MAIN_OPTIONS: string[] = [ALL_MAIL, ALMOST_ALL_MAIL, INBOX, DRAFTS, SENT, ALL_SENT, ALL_DRAFTS];

const LocationField = ({ value, onChange }: Props) => {
    const { AlmostAllMail } = useMailModel('MailSettings');
    const { all: options, findItemByValue } = useLocationFieldOptions();

    const mainOptions = options.filter(({ value }) => LOCATION_FIELD_MAIN_OPTIONS.includes(value));

    const isCustomValue =
        value !== undefined && LOCATION_FIELD_MAIN_OPTIONS.every((optionValue) => optionValue !== value);
    const customValueText = isCustomValue ? findItemByValue(value)?.text : undefined;
    const showCustomValue = isCustomValue === true && customValueText !== undefined;

    return (
        <>
            <span className="block text-semibold mb-2">{c('Label').t`Search in`}</span>
            <div className="flex flex-wrap flex-align-items-start mb-2 gap-2">
                {mainOptions.map((option) => (
                    <Button
                        key={option.value}
                        data-testid={`location-${option.value}`}
                        onClick={() => {
                            onChange(option.value);
                        }}
                        color={value === option.value ? 'norm' : 'weak'}
                        shape="solid"
                        size="small"
                        title={
                            // translator: The full sentence is "Search in All mail/Inbox/Drafts/etc." (only for blind users)
                            c('Action').t`Search in ${option.text}`
                        }
                    >
                        {option.text}
                    </Button>
                ))}

                <LocationFieldDropdown onChange={onChange} value={value} />

                {showCustomValue ? (
                    <Button
                        className="flex flex-nowrap flex-align-items-center"
                        onClick={() => onChange(AlmostAllMail ? ALMOST_ALL_MAIL : ALL_MAIL)}
                        color="norm"
                        shape="solid"
                        size="small"
                        title={c('Action').t`Remove`}
                    >
                        <span className="text-ellipsis">{customValueText}</span>
                        <Icon name="cross-small" className="ml-2 flex-item-noshrink" />
                    </Button>
                ) : null}
            </div>
        </>
    );
};

export default LocationField;
