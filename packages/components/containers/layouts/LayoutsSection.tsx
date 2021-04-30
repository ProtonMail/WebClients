import React from 'react';
import { c } from 'ttag';

import { updateComposerMode, updateViewLayout } from 'proton-shared/lib/api/mailSettings';
import { updateDensity } from 'proton-shared/lib/api/settings';
import { DENSITY, VIEW_LAYOUT, COMPOSER_MODE } from 'proton-shared/lib/constants';

import { Info, Loader } from '../../components';
import { useNotifications, useUserSettings, useMailSettings, useEventManager, useLoading, useApi } from '../../hooks';
import { SettingsSectionWide } from '../account';

import ComposerModeCards from './ComposerModeCards';
import ViewLayoutCards from './ViewLayoutCards';
import DensityRadiosCards from './DensityRadiosCards';

const LayoutsSection = () => {
    const [{ ComposerMode = 0, ViewLayout = 0 } = {}, loadingMailSettings] = useMailSettings();
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
                    <div className="flex flex-nowrap mb1 on-mobile-flex-column flex-column">
                        <span className="mb1 text-semibold">
                            <span className="mr0-5" id="layoutMode_desc">{c('Label').t`Inbox`}</span>
                            <Info
                                url="https://protonmail.com/support/knowledge-base/change-inbox-layout/"
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

                    <div className="flex flex-nowrap mb1 on-mobile-flex-column flex-column">
                        <span className="mb1 text-semibold">
                            <span className="mr0-5" id="composerMode_desc">{c('Label').t`Composer`}</span>
                            <Info
                                url="https://protonmail.com/support/knowledge-base/composer/"
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

                    <div className="flex flex-nowrap mb1 on-mobile-flex-column flex-column">
                        <span className="mb1 text-semibold" id="densityMode_desc">
                            {c('Label').t`Density`}
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
