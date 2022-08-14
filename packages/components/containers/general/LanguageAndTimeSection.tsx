import { IS_DATE_FORMAT_ENABLED } from '@proton/shared/lib/i18n/dateFnLocale';
import { locales } from '@proton/shared/lib/i18n/locales';

import { SettingsSection } from '../account';
import DateFormatSection from './DateFormatSection';
import LanguageSection from './LanguageSection';
import TimeFormatSection from './TimeFormatSection';
import WeekStartSection from './WeekStartSection';

const LanguageAndTimeSection = () => {
    return (
        <SettingsSection>
            <LanguageSection locales={locales} />
            <TimeFormatSection />
            <WeekStartSection />
            {IS_DATE_FORMAT_ENABLED && <DateFormatSection />}
        </SettingsSection>
    );
};

export default LanguageAndTimeSection;
