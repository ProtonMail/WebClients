import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { FiltersUpsellModal, useApi, useEventManager, useModalState, useNotifications } from '@proton/components';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { toggleEnable } from '@proton/shared/lib/api/filters';
import { FILTER_STATUS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';

import { getSubscriptionMoveToFolderName } from '../helper';
import type { PropsWithNewsletterSubscription } from '../interface';

interface WrapperProps extends PropsWithChildren {
    iconClassName: string;
}

const FilterWrapper = ({ children, iconClassName }: WrapperProps) => {
    return (
        <div
            className="flex flex-nowrap items-center gap-2 bg-weak color-weak px-3 py-1 rounded-xl mt-3 text-sm"
            data-testid="subscription-filter-wrapper"
        >
            <IcCheckmarkCircleFilled className={iconClassName} />
            <span className="flex gap-0.5">{children}</span>
        </div>
    );
};

const ActiveFilter = ({ children }: PropsWithChildren) => {
    return <FilterWrapper iconClassName="color-success shrink-0">{children}</FilterWrapper>;
};

const DisabledFilter = ({ subscription }: PropsWithNewsletterSubscription) => {
    const [user] = useUser();
    const [filters = []] = useFilters();

    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const enableFilter = async () => {
        if (hasReachedFiltersLimit(user, filters)) {
            handleUpsellModalDisplay(true);
            return;
        }

        await api(toggleEnable(subscription.FilterID!, true));
        await call();
        createNotification({
            text: c('Success notification').t`The filter is active again`,
        });
    };

    const enableButton = (
        <Button key="enable-button" className="py-0 color-weak ml-0.5" shape="underline" onClick={enableFilter}>
            {c('Label').t`Enable filter`}
        </Button>
    );

    return (
        <>
            <FilterWrapper iconClassName="color-weak shrink-0">
                {c('Label').jt`The filter is disabled. ${enableButton}`}
            </FilterWrapper>

            {renderUpsellModal && (
                <FiltersUpsellModal
                    modalProps={upsellModalProps}
                    overrideFeature={MAIL_UPSELL_PATHS.UNLIMITED_FILTERS_NEWSLETTER_SUBSCRIPTION}
                />
            )}
        </>
    );
};

export const NewsletterSubscriptionCardActiveFilter = ({ subscription }: PropsWithNewsletterSubscription) => {
    const [filters] = useFilters();
    const [folders = []] = useFolders();

    // Users can enable the filter again right from the UI. This avoid going to the settings to do it.
    const subscriptionFilter = filters?.find((filter) => filter.ID === subscription.FilterID);
    if (subscription.FilterID && filters?.length && subscriptionFilter?.Status === FILTER_STATUS.DISABLED) {
        return <DisabledFilter subscription={subscription} />;
    }

    const boldActive = <b className="text-semibold" key="active-filter">{c('Label').t`Active filter:`}</b>;

    if (subscription.MoveToFolder && subscription.FilterID) {
        const folderName = getSubscriptionMoveToFolderName(folders, subscription.MoveToFolder);
        if (folderName) {
            const boldFolderName = (
                <b className="text-semibold" key="bold-folder-name">
                    {folderName}
                </b>
            );
            return <ActiveFilter>{c('Label').jt`${boldActive} Move all messages to ${boldFolderName}`}</ActiveFilter>;
        }
    }

    if (subscription.MarkAsRead) {
        return <ActiveFilter>{c('Label').jt`${boldActive} Mark all messages as read`}</ActiveFilter>;
    }

    return null;
};
