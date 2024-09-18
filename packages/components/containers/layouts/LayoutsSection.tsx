import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import { useLoading } from '@proton/hooks';
import { updateComposerMode, updateViewLayout } from '@proton/shared/lib/api/mailSettings';
import { updateDensity } from '@proton/shared/lib/api/settings';
import type { DENSITY } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { COMPOSER_MODE, VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { Loader } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications, useUserSettings } from '../../hooks';
import { SettingsSectionWide } from '../account';
import ComposerModeCards from './ComposerModeCards';
import DensityRadiosCards from './DensityRadiosCards';
import ViewLayoutCards from './ViewLayoutCards';

const LayoutsSection = () => {
    const [{ ComposerMode, ViewLayout } = DEFAULT_MAILSETTINGS, loadingMailSettings] = useMailSettings();
    const [{ Density }, loadingUserSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loadingComposerMode, withLoadingComposerMode] = useLoading();
    const [loadingViewLayout, withLoadingViewLayout] = useLoading();
    const [loadingDensity, withLoadingDensity] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeComposerMode = async (mode: COMPOSER_MODE) => {
        await api(updateComposerMode(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeViewLayout = async (layout: VIEW_LAYOUT) => {
        await api(updateViewLayout(layout));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeDensity = async (density: DENSITY) => {
        await api(updateDensity(density));
        await call();
        notifyPreferenceSaved();
    };

    return (
        <SettingsSectionWide className="flex flex-wrap">
            {loadingMailSettings || loadingUserSettings ? (
                <Loader />
            ) : (
                <>
                    <div className="flex flex-column flex-nowrap mb-4">
                        <span className="mb-4 text-semibold">
                            <span className="mr-2" id="layoutMode_desc">{c('Label').t`Inbox`}</span>
                            <Info
                                url={getKnowledgeBaseUrl('/change-inbox-layout')}
                                title={c('Tooltip').t`Set the default layout for your Inbox.`}
                            />
                        </span>
                        <ViewLayoutCards
                            describedByID="layoutMode_desc"
                            viewLayout={ViewLayout}
                            onChange={(value) => withLoadingViewLayout(handleChangeViewLayout(value))}
                            loading={loadingViewLayout}
                        />
                    </div>

                    <div className="flex flex-column flex-nowrap mb-4">
                        <span className="mb-4 text-semibold">
                            <span className="mr-2" id="composerMode_desc">{c('Label').t`Composer`}</span>
                            <Info
                                url={getKnowledgeBaseUrl('/composer')}
                                title={c('Tooltip').t`Set the default Composer popup size as small or full screen.`}
                            />
                        </span>

                        <ComposerModeCards
                            describedByID="composerMode_desc"
                            composerMode={ComposerMode}
                            onChange={(value) => withLoadingComposerMode(handleChangeComposerMode(value))}
                            loading={loadingComposerMode}
                        />
                    </div>

                    <div className="flex flex-column flex-nowrap mb-4">
                        <span className="mb-4 text-semibold">
                            <span className="mr-2" id="densityMode_desc">{c('Label').t`Density`}</span>
                            <Info
                                url={getKnowledgeBaseUrl('/change-inbox-layout')}
                                title={c('Tooltip').t`Set how your list of messages looks like by default.`}
                            />
                        </span>
                        <DensityRadiosCards
                            density={Density}
                            describedByID="densityMode_desc"
                            onChange={(value) => withLoadingDensity(handleChangeDensity(value))}
                            loading={loadingDensity}
                        />
                    </div>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default LayoutsSection;
