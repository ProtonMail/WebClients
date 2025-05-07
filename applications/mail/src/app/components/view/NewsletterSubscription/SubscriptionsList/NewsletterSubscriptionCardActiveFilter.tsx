import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { SettingsLink } from '@proton/components';
import { IcCheckmarkCircleFilled, IcCrossCircleFilled } from '@proton/icons';
import { useFilters } from '@proton/mail/filters/hooks';
import { useFolders } from '@proton/mail/index';
import { APPS, FILTER_STATUS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getSubscriptionMoveToFolderName } from '../helper';

interface Props {
    subscription: NewsletterSubscription;
}

const FilterWrapper = ({ children }: PropsWithChildren) => {
    return (
        <div className="bg-weak color-weak px-3 py-1 rounded-full mt-3 text-sm w-fit-content">
            <span className="flex gap-1">{children}</span>
        </div>
    );
};

const ActiveFilter = ({ children }: PropsWithChildren) => {
    return (
        <FilterWrapper>
            <IcCheckmarkCircleFilled className="color-success" /> {children}
        </FilterWrapper>
    );
};

const DisabledFilter = () => {
    const settingsLink = (
        <SettingsLink path="/filters" className="color-weak" app={APPS.PROTONMAIL}>
            {c('Link').t`here`}
        </SettingsLink>
    );

    return (
        <FilterWrapper>
            <IcCrossCircleFilled className="color-weak" />
            {c('Label').jt`The filter is disabled. You can enable it ${settingsLink}`}
        </FilterWrapper>
    );
};

export const NewsletterSubscriptionCardActiveFilter = ({ subscription }: Props) => {
    const [filters] = useFilters();
    const [folders = []] = useFolders();

    // Users could disable the filter in the settings, we want to make it clear for them when it's the case
    const subscriptionFilter = filters?.find((filter) => filter.ID === subscription.FilterID);
    if (filters?.length && subscriptionFilter?.Status === FILTER_STATUS.DISABLED) {
        return <DisabledFilter />;
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
