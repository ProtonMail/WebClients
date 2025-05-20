import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { SettingsLink } from '@proton/components';
import { IcCheckmarkCircleFilled } from '@proton/icons';
import { useFilters } from '@proton/mail/filters/hooks';
import { useFolders } from '@proton/mail/index';
import { APPS, FILTER_STATUS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getSubscriptionMoveToFolderName } from '../helper';

interface Props {
    subscription: NewsletterSubscription;
}

interface WrapperProps extends PropsWithChildren {
    iconClassName: string;
}

const FilterWrapper = ({ children, iconClassName }: WrapperProps) => {
    return (
        <div className="flex flex-nowrap gap-2 bg-weak color-weak px-3 py-1 rounded-xl mt-3 text-sm">
            <IcCheckmarkCircleFilled className={iconClassName} />
            <span>{children}</span>
        </div>
    );
};

const ActiveFilter = ({ children }: PropsWithChildren) => {
    return <FilterWrapper iconClassName="color-success shrink-0">{children}</FilterWrapper>;
};

const DisabledFilter = () => {
    const settingsLink = (
        <SettingsLink path="/filters" className="color-weak" app={APPS.PROTONMAIL}>
            {c('Link').t`here`}
        </SettingsLink>
    );

    return (
        <FilterWrapper iconClassName="color-weak shrink-0">
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
