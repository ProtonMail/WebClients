import { useMemo } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    FiltersUpsellModal,
    Icon,
    useApi,
    useEventManager,
    useModalState,
    useNotifications,
    usePopperAnchor,
} from '@proton/components';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { toggleEnable } from '@proton/shared/lib/api/filters';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getFilterDropdownData, shouldOpenUpsellOnFilterClick, shouldToggleFilter } from '../helper';
import { type ModalFilterType } from '../interface';
import { useNewsletterSubscriptionTelemetry } from '../useNewsletterSubscriptionTelemetry';

interface Props {
    subscription: NewsletterSubscription;
    handleSubscriptionFilter: (filterType: ModalFilterType) => void;
}

export const NewsletterSubscriptionCardFilterDropdown = ({ subscription, handleSubscriptionFilter }: Props) => {
    const api = useApi();
    const [user, userLoading] = useUser();
    const [filters = [], filterLoading] = useFilters();

    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const popover = usePopperAnchor<HTMLButtonElement>();

    const { sendNewsletterMessageFilterUpsell } = useNewsletterSubscriptionTelemetry();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const dropdownData = useMemo(() => getFilterDropdownData(subscription, filters), [subscription, filters]);

    const toggleFilter = async (filterID: string, enabled: boolean) => {
        await api(toggleEnable(filterID, enabled));
        await call();

        createNotification({
            text: enabled
                ? c('Success notification').t`The filter has been enabled`
                : c('Success notification').t`The filter has been disabled`,
        });
    };

    const handleClick = (filterType: ModalFilterType, event: React.MouseEvent) => {
        event.stopPropagation();
        popover.close();

        // We show an upsell if the user reach the limit of filters.
        if (shouldOpenUpsellOnFilterClick(subscription, user, filters)) {
            sendNewsletterMessageFilterUpsell();
            handleUpsellModalDisplay(true);
            return;
        }

        const hasExistingFilter = !!subscription.FilterID && dropdownData.isFilterEnabled;
        const toggleFilterInsteadOfCreatingOne = shouldToggleFilter(filterType, {
            markingAsRead: dropdownData.markingAsRead,
            movingToArchive: dropdownData.movingToArchive,
            movingToTrash: dropdownData.movingToTrash,
        });

        if (hasExistingFilter && toggleFilterInsteadOfCreatingOne && subscription.FilterID) {
            void toggleFilter(subscription.FilterID, !dropdownData.isFilterEnabled);
            return;
        }

        handleSubscriptionFilter(filterType);
    };

    return (
        <>
            <div className="shrink-0 subscription-card-dropdown" data-testid="subscription-card-dropdown">
                <DropdownButton
                    ref={popover.anchorRef}
                    isOpen={popover.isOpen}
                    onClick={(e) => {
                        e.stopPropagation();
                        popover.toggle();
                    }}
                    shape="ghost"
                    size="small"
                    icon
                >
                    <Icon name="three-dots-vertical" />
                </DropdownButton>
            </div>
            <Dropdown isOpen={popover.isOpen} anchorRef={popover.anchorRef} onClose={popover.close}>
                <DropdownMenu className="my-3 w-custom" style={{ '--w-custom': '16rem' }}>
                    {dropdownData.menuItems.map((item) => (
                        <DropdownMenuButton
                            key={item.icon}
                            disabled={userLoading || filterLoading}
                            onClick={(e) => handleClick(item.filter, e)}
                            className="text-left flex flex-nowrap pl-6"
                            data-testid={`dropdown-item-${item.filter}`}
                        >
                            <Icon name={item.icon} className="mr-2 mt-0.5 shrink-0" />
                            {item.label}
                        </DropdownMenuButton>
                    ))}
                    <DropdownMenuButton
                        onClick={() => handleSubscriptionFilter('RemoveFromList')}
                        className="text-left flex flex-nowrap pl-6"
                    >
                        <Icon name="cross-circle" className="mr-2 mt-0.5 shrink-0" />
                        {c('Action').t`Remove from list`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>

            {renderUpsellModal && (
                <FiltersUpsellModal
                    modalProps={upsellModalProps}
                    overrideFeature={MAIL_UPSELL_PATHS.UNLIMITED_FILTERS_NEWSLETTER_SUBSCRIPTION}
                />
            )}
        </>
    );
};
