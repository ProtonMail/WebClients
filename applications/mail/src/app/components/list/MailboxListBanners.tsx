import type { ReactNode } from 'react';

import { useUserSettings } from '@proton/account';
import { DENSITY, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { isAllowedAutoDeleteLabelID } from 'proton-mail/helpers/autoDelete';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isInDeletedFolder } from '../../helpers/elements';
import useShowUpsellBanner from '../../hooks/useShowUpsellBanner';
import {
    AlmostAllMailBanner,
    AutoDeleteBanner,
    EsSlowBanner,
    MailUpsellBanner,
    RetentionPolicyBanner,
    TaskRunningBanner,
    useAutoDeleteBanner,
} from './banners';

interface Props {
    labelID: string;
    columnLayout: boolean;
    esState: {
        isESLoading: boolean;
        isSearch: boolean;
        showESSlowToolbar: boolean;
    };
    canDisplayTaskRunningBanner: boolean;
}

type BannerId = 'es-slow' | 'almost-all-mail' | 'mail-upsell' | 'task-running' | 'auto-delete' | 'retention-policy';

interface Banner {
    id: BannerId;
    banner: () => ReactNode;
    condition: () => boolean;
    canWith?: BannerId[];
}

const MailboxListBanners = ({
    labelID,
    columnLayout,
    esState: { isESLoading, showESSlowToolbar: canDisplayESSlowToolbar },
    canDisplayTaskRunningBanner,
}: Props) => {
    const [userSettings] = useUserSettings();
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    // Override compactness of the list view to accommodate body preview when showing encrypted search results
    const { contentIndexingDone, esEnabled } = esStatus;
    const shouldOverrideCompactness = shouldHighlight() && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    const bannerType = useAutoDeleteBanner(labelID);
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');

    const { canDisplayUpsellBanner, needToShowUpsellBanner, handleDismissBanner } = useShowUpsellBanner(labelID);

    /**
     * By default every banner is not stackable, and is displayed by ascending priority order
     * `canWith` field can enable a banner stacking under a whitelisted other
     */
    const banners: Banner[] = [
        {
            id: 'es-slow',
            banner: () => (
                <EsSlowBanner
                    key="es-slow"
                    className={clsx([columnLayout ? 'mt-2' : 'my-3', isCompactView && 'mb-2'])}
                />
            ),
            condition: () => canDisplayESSlowToolbar,
        },
        {
            id: 'almost-all-mail',
            banner: () => (
                <AlmostAllMailBanner
                    key="almost-all-mail"
                    className={clsx([columnLayout ? 'mt-2' : 'my-3', isCompactView && 'mb-2'])}
                />
            ),
            condition: () => !isESLoading && labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        },
        {
            id: 'mail-upsell',
            banner: () => (
                <MailUpsellBanner
                    key="mail-upsell"
                    needToShowUpsellBanner={needToShowUpsellBanner}
                    columnMode={columnLayout}
                    onClose={handleDismissBanner}
                />
            ),
            condition: () => canDisplayUpsellBanner,
        },
        {
            id: 'task-running',
            banner: () => <TaskRunningBanner key="task-running" />,
            condition: () => canDisplayTaskRunningBanner,
            canWith: ['es-slow', 'almost-all-mail', 'mail-upsell', 'auto-delete'],
        },
        {
            id: 'auto-delete',
            banner: () => (
                <AutoDeleteBanner
                    key="auto-delete"
                    columnLayout={columnLayout}
                    isCompactView={isCompactView}
                    bannerType={bannerType}
                />
            ),
            condition: () => isAllowedAutoDeleteLabelID(labelID) && !['hide', 'disabled'].includes(bannerType),
        },
        {
            id: 'retention-policy',
            banner: () => <RetentionPolicyBanner key="retention-policy" />,
            condition: () => isInDeletedFolder(isRetentionPoliciesEnabled, labelID),
        },
    ];

    return (
        <>
            {banners.some((current) => current.condition()) && (
                <div className="shrink-0 flex flex-column">
                    {banners
                        .reduce((displayedBanners: Banner[], current) => {
                            // to be displayed, a banner condition must be fulfilled,
                            // and if other banners more prioritized are already displayed,
                            // it must have them whitelisted
                            const canDisplayBanner =
                                current.condition() &&
                                displayedBanners.every(({ id }) => current.canWith?.includes(id));

                            return canDisplayBanner ? [...displayedBanners, current] : displayedBanners;
                        }, [])
                        .map(({ banner }) => banner())}
                </div>
            )}
        </>
    );
};

export default MailboxListBanners;
