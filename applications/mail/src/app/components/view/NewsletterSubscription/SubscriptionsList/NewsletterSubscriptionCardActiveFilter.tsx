import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { FiltersUpsellModal, useApi, useEventManager, useModalState, useNotifications } from '@proton/components';
import { IcCheckmarkCircleFilled } from '@proton/icons';
import { useFilters } from '@proton/mail/filters/hooks';
import { useFolders } from '@proton/mail/index';
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
        <div className="flex flex-nowrap items-center gap-2 bg-weak color-weak px-3 py-1 rounded-xl mt-3 text-sm">
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
        <Button className="py-0 color-weak ml-0.5" shape="underline" onClick={enableFilter}>
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
                    overrideFeature={MAIL_UPSELL_PATHS.UNLIMITED_FILTERS_MAIL_SUBSCRIPTION}
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

    if (subscription.MoveToFolder) {
        const folderName = getSubscriptionMoveToFolderName(folders, subscription.MoveToFolder);
        if (folderName) {
            const boldFolderName = <b className="text-semibold">{folderName}</b>;
            return <ActiveFilter>{c('Label').jt`${boldActive} Move all messages to ${boldFolderName}`}</ActiveFilter>;
        }
    }

    if (subscription.MarkAsRead) {
        return <ActiveFilter>{c('Label').jt`${boldActive} Mark all messages as read`}</ActiveFilter>;
    }

    return null;
};
