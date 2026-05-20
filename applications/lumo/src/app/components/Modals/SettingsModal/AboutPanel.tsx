import { c } from 'ttag';

import { useConfig } from '@proton/components/index';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { format } from '@proton/shared/lib/date-fns-utc';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { dateLocale } from '@proton/shared/lib/i18n';

import AuthenticatedReportBugSection from './AuthenticatedReportBugSection';
import { SettingsSectionItem, SettingsSectionItemButton } from './SettingsSectionItem';

const AboutPanel = () => {
    const { DATE_VERSION } = useConfig();
    const formattedDate = DATE_VERSION ? `${format(new Date(DATE_VERSION), 'PPpp', { locale: dateLocale })} UTC` : '';

    return (
        <div className="flex flex-column flex-nowrap *:min-size-auto gap-4">
            <AuthenticatedReportBugSection />

            <SettingsSectionItemButton
                icon="question-circle"
                text={c('collider_2025: Title').t`Help and support`}
                subtext={c('collider_2025: Description').jt`Learn more about how to use ${LUMO_SHORT_APP_NAME}`}
                button={<IcArrowWithinSquare className="shrink-0 color-hint mr-2" />}
                onClick={() => window.open(getKnowledgeBaseUrl('/lumo'), '_blank')}
                data-testid="about-panel:help-support"
            />

            <SettingsSectionItem
                icon="info-circle"
                text={c('collider_2025: Title').t`About ${LUMO_SHORT_APP_NAME}`}
                subtext={c('collider_2025: Description').jt`Last updated on ${formattedDate}`}
            />
        </div>
    );
};

export default AboutPanel;
