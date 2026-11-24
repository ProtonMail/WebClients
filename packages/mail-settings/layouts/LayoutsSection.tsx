import type { ReactNode } from 'react';

import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import { Loader } from '@proton/atoms/Loader/Loader';
import { SettingsCardRows } from '@proton/components/containers/account/SettingsCardRows';
import useLoading from '@proton/hooks/useLoading';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateDensity } from '@proton/shared/lib/api/settings';
import type { DENSITY } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { COMPOSER_MODE, VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';

import ComposerModeCards from './ComposerModeCards';
import DensityRadiosCards from './DensityRadiosCards';
import ViewLayoutCards from './ViewLayoutCards';

const LayoutRow = ({
    id,
    label,
    description,
    children,
}: {
    id: string;
    label: string;
    description: ReactNode;
    children: ReactNode;
}) => (
    <div className="flex flex-column gap-4">
        <div className="flex flex-column gap-1">
            <span className="text-semibold" id={id}>
                {label}
            </span>
            <p className="m-0 text-sm color-weak">{description}</p>
        </div>
        {children}
    </div>
);

const LayoutsSection = () => {
    const [{ ComposerMode, ViewLayout }, loadingMailSettings] = useMailSettings();
    const [{ Density }, loadingUserSettings] = useUserSettings();
    const { update, isLoading } = useUpdateMailSetting();
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const [loadingDensity, withLoadingDensity] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeComposerMode = (mode: COMPOSER_MODE) => {
        update('ComposerMode', mode);
    };

    const handleChangeViewLayout = (layout: VIEW_LAYOUT) => {
        update('ViewLayout', layout);
    };

    const handleChangeDensity = async (density: DENSITY) => {
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(updateDensity(density));
        dispatch(userSettingsActions.set({ UserSettings }));
        notifyPreferenceSaved();
    };

    if (loadingMailSettings || loadingUserSettings) {
        return <Loader />;
    }

    const learnMoreLayout = <Href href={getKnowledgeBaseUrl('/change-inbox-layout')}>{c('Link').t`Learn more`}</Href>;

    return (
        <SettingsCardRows>
            <LayoutRow
                id="layoutMode_desc"
                label={c('Label').t`Inbox`}
                description={
                    <>
                        {c('Tooltip').t`Set the default layout for your Inbox.`} {learnMoreLayout}
                    </>
                }
            >
                <ViewLayoutCards
                    describedByID="layoutMode_desc"
                    viewLayout={ViewLayout}
                    onChange={(value) => handleChangeViewLayout(value)}
                    loading={isLoading('ViewLayout')}
                />
            </LayoutRow>
            <LayoutRow
                id="composerMode_desc"
                label={c('Label').t`Composer`}
                description={
                    <>
                        {c('Tooltip').t`Set the default Composer popup size as small or full screen.`}{' '}
                        <Href href={getKnowledgeBaseUrl('/composer')}>{c('Link').t`Learn more`}</Href>
                    </>
                }
            >
                <ComposerModeCards
                    describedByID="composerMode_desc"
                    composerMode={ComposerMode}
                    onChange={(value) => handleChangeComposerMode(value)}
                    loading={isLoading('ComposerMode')}
                />
            </LayoutRow>
            <LayoutRow
                id="densityMode_desc"
                label={c('Label').t`Density`}
                description={
                    <>
                        {c('Tooltip').t`Set how your list of messages looks like by default.`} {learnMoreLayout}
                    </>
                }
            >
                <DensityRadiosCards
                    density={Density}
                    describedByID="densityMode_desc"
                    onChange={(value) => withLoadingDensity(handleChangeDensity(value))}
                    loading={loadingDensity}
                />
            </LayoutRow>
        </SettingsCardRows>
    );
};

export default LayoutsSection;
