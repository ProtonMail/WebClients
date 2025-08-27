import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    type IconName,
    usePopperAnchor,
} from '@proton/components';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import { getUnreadCount } from 'proton-mail/components/sidebar/locationAsideHelpers';
import { getUnreadNewslettersText } from 'proton-mail/helpers/text';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { SortSubscriptionsValue, SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import { sortSubscriptionList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import {
    selectSubscriptionsCount,
    selectTabSortingState,
    selectedTab,
    selectedTabSubscriptionsCount,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { useNewsletterSubscriptionTelemetry } from '../useNewsletterSubscriptionTelemetry';

const SortingDropdownMenu = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const selectedSort = useMailSelector(selectTabSortingState);
    const { sendNewslettersListSorting } = useNewsletterSubscriptionTelemetry();

    const selectedTabSubCount = useMailSelector(selectedTabSubscriptionsCount);

    const dispatch = useMailDispatch();

    const handleSortChange = (value: SortSubscriptionsValue) => {
        void dispatch(newsletterSubscriptionsActions.setSortingOrder(value));
        void dispatch(sortSubscriptionList(value));
        sendNewslettersListSorting(value);
    };

    const items: {
        text: string;
        icon: IconName;
        onClick: () => void;
        active: boolean;
    }[] = [
        {
            text: c('Action').t`Least read`,
            icon: 'list-arrow-down',
            onClick: () => handleSortChange(SortSubscriptionsValue.LastRead),
            active: selectedSort === SortSubscriptionsValue.LastRead,
        },
        {
            text: c('Action').t`Most read`,
            icon: 'list-arrow-up',
            onClick: () => handleSortChange(SortSubscriptionsValue.MostRead),
            active: selectedSort === SortSubscriptionsValue.MostRead,
        },
        {
            text: c('Action').t`Most frequent`,
            icon: 'arrow-right-arrow-left',
            onClick: () => handleSortChange(SortSubscriptionsValue.MostFrequent),
            active: selectedSort === SortSubscriptionsValue.MostFrequent,
        },
        {
            text: c('Action').t`A to Z`,
            icon: 'sort-alphabetically',
            onClick: () => handleSortChange(SortSubscriptionsValue.Alphabetical),
            active: selectedSort === SortSubscriptionsValue.Alphabetical,
        },
        {
            text: c('Action').t`Recently read`,
            icon: 'envelope-open',
            onClick: () => handleSortChange(SortSubscriptionsValue.RecentlyRead),
            active: selectedSort === SortSubscriptionsValue.RecentlyRead,
        },
        {
            text: c('Action').t`Recently received`,
            icon: 'inbox',
            onClick: () => handleSortChange(SortSubscriptionsValue.RecentlyReceived),
            active: selectedSort === SortSubscriptionsValue.RecentlyReceived,
        },
    ];

    return (
        <>
            <DropdownButton
                icon
                ref={anchorRef}
                isOpen={isOpen}
                disabled={selectedTabSubCount === 0}
                onClick={toggle}
                shape="ghost"
                className="shrink-0 self-end"
                aria-disabled={selectedTabSubCount === 0}
            >
                <Icon name="list-arrow-down" alt={c('Action').t`Change sorting`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <p className="m-0 py-2 px-4 text-sm color-weak">Sort by</p>
                <DropdownMenu>
                    {items.map((option) => (
                        <DropdownMenuButton
                            key={option.icon}
                            isSelected={option.active}
                            onClick={option.onClick}
                            className="text-left flex items-center"
                            data-testid={`dropdown-item-${option.icon}`}
                        >
                            <Icon name={option.icon} className="mr-2" />
                            {option.text}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

interface HeaderTabProps {
    onClick: () => void;
    copy: string;
    count?: number;
    tab: SubscriptionTabs;
    dataTestId: string;
}

const HeaderTab = ({ onClick, copy, count, tab, dataTestId }: HeaderTabProps) => {
    const amountNewsletters = getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, count);
    const unreadNewslettersText = getUnreadNewslettersText(count);

    const activeTab = useMailSelector(selectedTab);

    return (
        <Button
            onClick={onClick}
            shape={tab === activeTab ? 'solid' : 'ghost'}
            color={tab === activeTab ? 'weak' : undefined}
            className="mr-1"
            role="tab"
            aria-selected={tab === activeTab}
            data-testid={dataTestId}
        >
            {copy}
            {tab === SubscriptionTabs.Active && count ? (
                <span
                    className={clsx(
                        'px-1 py-0.5 ml-2 rounded-sm text-xs align-text-bottom',
                        tab === activeTab ? 'bg-norm' : 'bg-strong'
                    )}
                    data-testid={`${dataTestId}-count`}
                >
                    <span aria-hidden="true">{amountNewsletters}</span>
                    <span className="sr-only">{unreadNewslettersText}</span>
                </span>
            ) : null}
        </Button>
    );
};

interface NewsletterSubscriptionListHeaderProps {
    tabClickCallback: () => void;
}

export const NewsletterSubscriptionListHeader = ({ tabClickCallback }: NewsletterSubscriptionListHeaderProps) => {
    const counts = useMailSelector(selectSubscriptionsCount);
    const dispatch = useMailDispatch();

    const handleTabClick = (tab: SubscriptionTabs) => {
        dispatch(newsletterSubscriptionsActions.setSelectedTab(tab));
        tabClickCallback();
    };

    return (
        <div className="flex flex-row flex-nowrap justify-space-between py-4 px-6 sticky top-0 subscriptions-list-header">
            <div className="flex gap-4 items-center">
                <h2 className="text-bold text-xl hidden sm:block">{c('Title').t`Newsletters`}</h2>
                <ul className="unstyled m-0 p-0 flex flex-row flex-wrap" role="tablist">
                    {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                    <li role="presentation">
                        <HeaderTab
                            onClick={() => handleTabClick(SubscriptionTabs.Active)}
                            copy={c('Action').t`Active`}
                            count={counts.active}
                            dataTestId="newsletter-subscription-list-header--active"
                            tab={SubscriptionTabs.Active}
                        />
                    </li>
                    {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                    <li role="presentation">
                        <HeaderTab
                            onClick={() => handleTabClick(SubscriptionTabs.Unsubscribe)}
                            copy={c('Action').t`Unsubscribed`}
                            dataTestId="newsletter-subscription-list-header--unsubscribed"
                            tab={SubscriptionTabs.Unsubscribe}
                        />
                    </li>
                </ul>
            </div>
            <SortingDropdownMenu />
        </div>
    );
};
