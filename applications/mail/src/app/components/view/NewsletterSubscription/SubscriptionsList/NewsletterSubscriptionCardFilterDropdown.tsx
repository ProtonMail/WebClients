import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    FiltersUpsellModal,
    Icon,
    type IconName,
    useModalState,
    usePopperAnchor,
} from '@proton/components';
import { useFilters } from '@proton/mail/filters/hooks';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { shouldOpenUpsellOnFilterClick } from '../helper';
import type { ModalFilterType } from '../interface';

interface Props {
    subscription: NewsletterSubscription;
    handleSubscriptionFilter: (filterType: ModalFilterType) => void;
}

export const NewsletterSubscriptionCardFilterDropdown = ({ subscription, handleSubscriptionFilter }: Props) => {
    const [user, userLoading] = useUser();
    const [filters = [], filterLoading] = useFilters();

    const popover = usePopperAnchor<HTMLButtonElement>();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleClick = (filterType: ModalFilterType, event: React.MouseEvent) => {
        event.stopPropagation();
        popover.close();

        if (shouldOpenUpsellOnFilterClick(subscription, user, filters)) {
            handleUpsellModalDisplay(true);
        } else {
            handleSubscriptionFilter(filterType);
        }
    };

    const menuItems: {
        icon: IconName;
        label: string;
        filter: ModalFilterType;
    }[] = [
        {
            icon: 'envelope-open',
            label: c('Action').t`Mark as read`,
            filter: 'MarkAsRead',
        },
        {
            icon: 'archive-box',
            label: c('Action').t`Move to archive`,
            filter: 'MoveToArchive',
        },
        {
            icon: 'trash',
            label: c('Action').t`Delete`,
            filter: 'MoveToTrash',
        },
    ];

    return (
        <>
            <div className="shrink-0 subscription-card-dropdown">
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
                <DropdownMenu>
                    {menuItems.map((item) => (
                        <DropdownMenuButton
                            key={item.icon}
                            disabled={userLoading || filterLoading}
                            onClick={(e) => handleClick(item.filter, e)}
                            className="text-left flex items-center"
                        >
                            <Icon name={item.icon} className="mr-2" />
                            {item.label}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
            {renderUpsellModal && (
                <FiltersUpsellModal
                    modalProps={upsellModalProps}
                    overrideFeature={MAIL_UPSELL_PATHS.UNLIMITED_FILTERS_MAIL_SUBSCRIPTION}
                />
            )}
        </>
    );
};
