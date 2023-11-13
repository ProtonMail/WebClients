import { ReactNode, memo } from 'react';
import { useSelector } from 'react-redux';

import { DENSITY, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { isAllowedAutoDeleteLabelID } from 'proton-mail/helpers/autoDelete';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import useShowUpsellBanner from '../../hooks/useShowUpsellBanner';
import { showLabelTaskRunningBanner } from '../../logic/elements/elementsSelectors';
import {
    AlmostAllMailBanner,
    AutoDeleteBanner,
    EsSlowBanner,
    MailUpsellBanner,
    TaskRunningBanner,
    useAutoDeleteBanner,
} from './banners';

interface Props {
    labelID: string;
    columnLayout: boolean;
    userSettings: UserSettings;
    esState: {
        isESLoading: boolean;
        isSearch: boolean;
        showESSlowToolbar: boolean;
    };
}

type BannerId = 'es-slow' | 'almost-all-mail' | 'mail-upsell' | 'task-running' | 'auto-delete';
interface Banner {
    id: BannerId;
    banner: () => ReactNode;
    condition: () => boolean;
    canWith?: BannerId[];
}

const ListBanners = ({
    labelID,
    columnLayout,
    userSettings,
    esState: { isESLoading, showESSlowToolbar: canDisplayESSlowToolbar },
}: Props) => {
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    // Override compactness of the list view to accomodate body preview when showing encrypted search results
    const { contentIndexingDone, esEnabled } = esStatus;
    const shouldOverrideCompactness = shouldHighlight() && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    const bannerType = useAutoDeleteBanner(labelID);

    const canDisplayTaskRunningBanner = useSelector(showLabelTaskRunningBanner);
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
            banner: () => (
                <TaskRunningBanner
                    key="task-running"
                    className={clsx([
                        !canDisplayESSlowToolbar && 'mt-3',
                        columnLayout ? 'mb-0' : 'my-3',
                        isCompactView && 'mb-3',
                    ])}
                />
            ),
            condition: () => canDisplayTaskRunningBanner,
            canWith: ['es-slow'],
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
    ];

    return (
        <>
            {banners
                .reduce((displayedBanners: Banner[], current) => {
                    // to be displayed, a banner condition must be fulfilled,
                    // and if other banners more prioritized are already displayed,
                    // it must have them whitelisted
                    const canDisplayBanner =
                        current.condition() && displayedBanners.every(({ id }) => current.canWith?.includes(id));

                    return canDisplayBanner ? [...displayedBanners, current] : displayedBanners;
                }, [])
                .map(({ banner }) => banner())}
        </>
    );
};

export default memo(ListBanners);
