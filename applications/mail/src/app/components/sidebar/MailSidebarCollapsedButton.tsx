import { c } from 'ttag';

import { Icon, type IconName, SidebarListItem } from '@proton/components'
import { Tooltip } from '@proton/atoms';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    onClick: () => void;
    iconName: IconName;
    title: string;
    unread: boolean;
}

export const MailSidebarCollapsedButton = ({ onClick, iconName, title, unread }: Props) => {
    const [mailSettings] = useMailSettings();

    return (
        <SidebarListItem>
            <Tooltip originalPlacement="right" title={title}>
                <button
                    onClick={onClick}
                    className="flex items-center relative navigation-link-header-group-link mx-auto w-full"
                >
                    <Icon name={iconName} alt={title} className="mx-auto" />
                    {unread && (
                        <span className="navigation-counter-item shrink-0">
                            <span className="sr-only">
                                {mailSettings?.ViewMode === VIEW_MODE.GROUP
                                    ? c('Info').t`Unread conversations`
                                    : c('Info').t`Unread messages`}
                            </span>
                        </span>
                    )}
                </button>
            </Tooltip>
        </SidebarListItem>
    );
};
