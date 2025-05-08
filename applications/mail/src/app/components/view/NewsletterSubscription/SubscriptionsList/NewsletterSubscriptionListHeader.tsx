import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
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
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import type { SortSubscriptionsValue, SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import { sortSubscriptionList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { subscriptionCountSelector } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

const SortingDropdownMenu = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const dispatch = useMailDispatch();

    const handleSortChange = (value: SortSubscriptionsValue) => {
        void dispatch(sortSubscriptionList(value));
    };

    const items: {
        text: string;
        icon: IconName;
        onClick: () => void;
    }[] = [
        {
            text: c('Action').t`Least read`,
            icon: 'list-arrow-down',
            onClick: () => handleSortChange('last-read'),
        },
        {
            text: c('Action').t`Most read`,
            icon: 'list-arrow-up',
            onClick: () => handleSortChange('most-read'),
        },
        // Not supported for the moment
        // {
        //     text: c('Action').t`Most frequent`,
        //     icon: 'arrow-right-arrow-left',
        //     onClick: () => handleSortChange('most-frequent'),
        // },
        {
            text: c('Action').t`A to Z`,
            icon: 'sort-alphabetically',
            onClick: () => handleSortChange('alphabetical'),
        },
        // Not supported for the moment
        // {
        //     text: c('Action').t`Recently read`,
        //     icon: 'envelope-open',
        //     onClick: () => handleSortChange('recently-read'),
        // },
        {
            text: c('Action').t`Recently received`,
            icon: 'inbox',
            onClick: () => handleSortChange('recently-received'),
        },
    ];

    return (
        <>
            <DropdownButton
                icon
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                shape="ghost"
                className="shrink-0 self-end"
            >
                <Icon name="list-arrow-down" alt={c('Action').t`Change sorting`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <p className="m-0 py-2 px-4 text-sm color-weak">Sort by</p>
                <DropdownMenu>
                    {items.map((option) => (
                        <DropdownMenuButton
                            key={option.icon}
                            onClick={option.onClick}
                            className="text-left flex items-center"
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
    count: number;
    active: boolean;
}

const HeaderTab = ({ onClick, copy, count, active }: HeaderTabProps) => {
    return (
        <Button
            onClick={onClick}
            shape={active ? 'solid' : 'ghost'}
            color={active ? 'weak' : undefined}
            className="mr-1"
        >
            {copy}
            {count ? (
                <span
                    className={clsx('px-1 ml-2 rounded-sm text-xs align-text-bottom', active ? 'bg-norm' : 'bg-strong')}
                >
                    {getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, count)}
                </span>
            ) : null}
        </Button>
    );
};

export const NewsletterSubscriptionListHeader = () => {
    const [active, setActive] = useState<SubscriptionTabs>('active');

    const counts = useMailSelector(subscriptionCountSelector);
    const dispatch = useMailDispatch();

    const handleTabClick = (tab: SubscriptionTabs) => {
        setActive(tab);
        dispatch(newsletterSubscriptionsActions.setFilteredSubscriptions(tab));
    };

    return (
        <div className="flex flex-nowrap justify-space-between mb-5">
            <div className="flex gap-4 items-center">
                <h2 className="text-bold text-xl hidden sm:block">{c('Title').t`Mail subscriptions`}</h2>
                <div>
                    <HeaderTab
                        onClick={() => handleTabClick('active')}
                        copy={c('Action').t`Active`}
                        count={counts.active}
                        active={active === 'active'}
                    />
                    <HeaderTab
                        onClick={() => handleTabClick('unsubscribe')}
                        copy={c('Action').t`Unsubscribed`}
                        count={counts.unsubscribe}
                        active={active === 'unsubscribe'}
                    />
                </div>
            </div>
            <SortingDropdownMenu />
        </div>
    );
};
