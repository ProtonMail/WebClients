import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateTimeFormat } from '@proton/shared/lib/api/settings';
import { dateLocaleCode } from '@proton/shared/lib/i18n';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale } from '@proton/shared/lib/i18n/loadLocale';
import { SETTINGS_TIME_FORMAT, type UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import { getDefaultTimeFormat } from '@proton/shared/lib/settings/helper';

import Option from '../../components/option/Option';
import SelectTwo from '../../components/selectTwo/SelectTwo';
import { getAutomaticText } from './helper';

interface Props {
    id?: string;
    className?: string;
    unstyledSelect?: boolean;
    'aria-labelledby'?: string;
}

const TimeFormatSelector = ({
    id = 'time-format-select',
    className,
    unstyledSelect,
    'aria-labelledby': ariaLabelledBy,
}: Props) => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleTimeFormat = async (value: SETTINGS_TIME_FORMAT) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, TimeFormat: value });
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(updateTimeFormat(value));
        dispatch(userSettingsActions.set({ UserSettings }));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timeFormats = [
        { title: '1:00pm', value: SETTINGS_TIME_FORMAT.H12 },
        { title: '13:00', value: SETTINGS_TIME_FORMAT.H24 },
    ];

    const [h12, h24] = timeFormats;

    const defaultFormat = getDefaultTimeFormat() === SETTINGS_TIME_FORMAT.H12 ? h12.title : h24.title;

    return (
        <SelectTwo
            id={id}
            className={className}
            aria-labelledby={ariaLabelledBy}
            unstyled={unstyledSelect}
            value={userSettings.TimeFormat}
            loading={loading}
            onChange={({ value }) => withLoading(handleTimeFormat(value))}
        >
            {[
                {
                    title: getAutomaticText(defaultFormat),
                    value: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT,
                },
                ...timeFormats,
            ].map((option) => (
                <Option key={option.value} {...option} />
            ))}
        </SelectTwo>
    );
};

export default TimeFormatSelector;
