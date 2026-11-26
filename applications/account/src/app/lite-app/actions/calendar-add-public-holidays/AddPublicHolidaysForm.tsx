import { useState } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import joinHolidaysCalendar from '@proton/calendar-settings/calendarModal/holidaysCalendarModal/joinHolidaysCalendar';
import useHolidaysCalendarSelection from '@proton/calendar-settings/calendarModal/holidaysCalendarModal/useHolidaysCalendarSelection';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import ColorPicker from '@proton/components/components/input/ColorPicker';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getBusySlotSettingValue } from '@proton/components/helpers/busySlots';
import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import type { HolidaysDirectoryCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';

import LiteBusySlotsPanel from '../../components/settings/LiteBusySlotsPanel';
import LiteSettingsRow from '../../components/settings/LiteSettingsRow';
import LiteSettingsSheet from '../../components/settings/LiteSettingsSheet';

interface Props {
    directory: HolidaysDirectoryCalendar[];
    /** Read once, so mount the form after the calendars are loaded */
    holidaysCalendars: VisualCalendar[];
    onAdded: () => void;
    onCancel: () => void;
    onError: () => void;
}

const AddPublicHolidaysForm = ({ directory, holidaysCalendars, onAdded, onCancel, onError }: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [color, setColor] = useState(getRandomAccentColor);
    const [makesUserBusy, setMakesUserBusy] = useState(() => getBusySlotSettingValue(CALENDAR_TYPE.HOLIDAYS));

    const {
        countryOptions,
        computedCalendar,
        languageOptions,
        canShowHint,
        hasAlreadyJoinedSelectedCalendar,
        selectCountry,
        selectLanguage,
    } = useHolidaysCalendarSelection({ directory, holidaysCalendars });

    const addCalendar = async (holidaysCalendar: HolidaysDirectoryCalendar) => {
        let isCalendarJoined = false;
        try {
            await joinHolidaysCalendar({
                holidaysCalendar,
                addresses: await getAddresses(),
                getAddressKeys,
                color,
                notifications: [],
                makesUserBusy,
                api,
                onJoined: () => {
                    isCalendarJoined = true;
                },
            });
            await call();
            onAdded();
        } catch {
            // Once the calendar exists, offering to add it again would fail
            if (isCalendarJoined) {
                onAdded();
                return;
            }
            onError();
        }
    };

    const handleSubmit = () => {
        if (loading || !computedCalendar || hasAlreadyJoinedSelectedCalendar) {
            return;
        }
        void withLoading(addCalendar(computedCalendar));
    };

    // translator: A holidays calendar includes bank holidays and observances
    const description = c('Modal title').t`Get a country's official public holidays calendar.`;
    // translator: Hint text about the pre-selected country option in the holidays calendar modal
    const hintText = c('Info').t`Based on your time zone`;
    // translator: A holidays calendar includes bank holidays and observances
    const alreadyAddedText = c('Error').t`You already added this holidays calendar`;

    return (
        <LiteSettingsSheet
            className="calendar-add-public-holidays"
            description={description}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitButton={
                <Button
                    type="submit"
                    color="norm"
                    fullWidth
                    pill
                    size="large"
                    loading={loading}
                    disabled={!computedCalendar || hasAlreadyJoinedSelectedCalendar}
                >
                    {c('Action').t`Add`}
                </Button>
            }
        >
            <div>
                <div className="lite-settings-panel">
                    <LiteSettingsRow
                        htmlFor="holidays-country-select"
                        label={c('Label').t`Country`}
                        description={canShowHint ? hintText : undefined}
                    >
                        <SelectTwo<string>
                            id="holidays-country-select"
                            unstyled
                            aria-labelledby="holidays-country-select-label"
                            size={{ width: DropdownSizeUnit.Dynamic }}
                            placeholder={c('Placeholder').t`Select`}
                            value={computedCalendar?.CountryCode}
                            onValue={selectCountry}
                        >
                            {countryOptions.map(({ countryCode, countryName }) => (
                                <Option key={countryCode} value={countryCode} title={countryName} />
                            ))}
                        </SelectTwo>
                    </LiteSettingsRow>
                    {computedCalendar && languageOptions.length > 1 && (
                        <LiteSettingsRow htmlFor="holidays-language-select" label={c('Label').t`Language`}>
                            <SelectTwo<string>
                                id="holidays-language-select"
                                unstyled
                                aria-labelledby="holidays-language-select-label"
                                size={{ width: DropdownSizeUnit.Dynamic }}
                                value={computedCalendar.Language}
                                onValue={selectLanguage}
                            >
                                {languageOptions.map(({ Language }) => (
                                    <Option key={Language} value={Language} title={Language} />
                                ))}
                            </SelectTwo>
                        </LiteSettingsRow>
                    )}
                    <LiteSettingsRow htmlFor="holidays-color-picker" label={c('Label').t`Color`}>
                        <ColorPicker
                            id="holidays-color-picker"
                            // The picker names itself with the color only
                            aria-labelledby="holidays-color-picker-label holidays-color-picker"
                            className="calendar-add-public-holidays-color"
                            displayColorName={false}
                            color={color}
                            onChange={setColor}
                        />
                    </LiteSettingsRow>
                </div>
                {hasAlreadyJoinedSelectedCalendar && (
                    <p role="alert" className="calendar-add-public-holidays-error">
                        {alreadyAddedText}
                    </p>
                )}
            </div>
            <LiteBusySlotsPanel value={makesUserBusy} onChange={setMakesUserBusy} />
        </LiteSettingsSheet>
    );
};

export default AddPublicHolidaysForm;
