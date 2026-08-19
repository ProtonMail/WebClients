import { c } from 'ttag';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import SettingsDescription from '@proton/components/containers/account/SettingsDescription';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { IS_DATE_FORMAT_ENABLED } from '@proton/shared/lib/i18n/dateFnLocale';
import { locales } from '@proton/shared/lib/i18n/locales';

import DateFormatSection from './DateFormatSection';
import LanguageSection, { LanguageTranslationHelp } from './LanguageSection';
import TimeFormatSection from './TimeFormatSection';
import WeekStartSection from './WeekStartSection';

const LanguageAndTimeSection = () => {
    return (
        <DashboardGrid>
            <SettingsDescription>
                <SettingsDescription.Item>
                    {c('Info').t`Your default language and time for ${BRAND_NAME} services.`}
                </SettingsDescription.Item>
                <SettingsDescription.Item>
                    {c('Info')
                        .t`Changes to your default language and time are reflected on the web. To change the default for mobile apps, go to the settings on your device.`}
                </SettingsDescription.Item>
            </SettingsDescription>

            <DashboardCard>
                <DashboardCardContent>
                    <LanguageSection locales={locales} />
                </DashboardCardContent>
            </DashboardCard>
            <LanguageTranslationHelp />

            <DashboardCard>
                <DashboardCardContent>
                    <TimeFormatSection />
                    <DashboardCardDivider />
                    <WeekStartSection />
                    {IS_DATE_FORMAT_ENABLED && (
                        <>
                            <DashboardCardDivider />
                            <DateFormatSection />
                        </>
                    )}
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};

export default LanguageAndTimeSection;
