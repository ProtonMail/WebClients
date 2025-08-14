import { forwardRef } from 'react';
import type { LiHTMLAttributes } from 'react';

import clsx from 'clsx';
import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Tooltip } from '@proton/atoms';
import {
    SidebarList,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
} from '@proton/components';
import { useModalStateObject } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useSidebar } from '../../providers/SidebarProvider';
import SettingsModal from '../components/SettingsModal/SettingsModal';
import LumoPlusUpsellSidebarButton from './LumoPlusUpsellSidebarButton';

// Local wrapper that forwards refs to SidebarListItem
interface ForwardRefSidebarListItemProps extends LiHTMLAttributes<HTMLLIElement> {
    itemClassName?: string;
}

const ForwardRefSidebarListItem = forwardRef<HTMLLIElement, ForwardRefSidebarListItemProps>(
    ({ className = '', itemClassName = 'navigation-item w-full px-3 mb-0.5', children, ...rest }, ref) => {
        return (
            <li ref={ref} className={clsx([itemClassName, className])} {...rest}>
                {children}
            </li>
        );
    }
);

export const BasicSidebarListItems = () => {
    const settingsModal = useModalStateObject();
    const { isCollapsed } = useSidebar();

    const settingsLabel = c('collider_2025:Button').t`Settings`;
    const supportLabel = c('collider_2025:Button').t`Help and support `;

    return (
        <SidebarList className="flex flex-column flex-nowrap gap-1">
            <LumoPlusUpsellSidebarButton collapsed={isCollapsed} />
            <Tooltip title={supportLabel} originalPlacement="right">
                <ForwardRefSidebarListItem>
                    <Href className="navigation-link" href={getKnowledgeBaseUrl('/lumo')}>
                        <SidebarListItemContent
                            left={
                                <SidebarListItemContentIcon
                                    size={4}
                                    className={clsx(isCollapsed && 'flex mx-auto')}
                                    name="question-circle"
                                />
                            }
                            collapsed={isCollapsed}
                        >
                            <span className="text-ellipsis" title={isCollapsed ? undefined : supportLabel}>
                                {supportLabel}
                            </span>
                        </SidebarListItemContent>
                    </Href>
                </ForwardRefSidebarListItem>
            </Tooltip>
            <Tooltip title={settingsLabel} originalPlacement="right">
                <ForwardRefSidebarListItem>
                    <SidebarListItemButton onClick={() => settingsModal.openModal(true)}>
                        <SidebarListItemContent
                            left={
                                <SidebarListItemContentIcon
                                    size={4}
                                    className={clsx(isCollapsed && 'flex mx-auto')}
                                    name="cog-wheel"
                                />
                            }
                            collapsed={isCollapsed}
                        >
                            <span className="text-ellipsis" title={isCollapsed ? undefined : settingsLabel}>
                                {settingsLabel}
                            </span>
                        </SidebarListItemContent>
                    </SidebarListItemButton>
                </ForwardRefSidebarListItem>
            </Tooltip>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
        </SidebarList>
    );
};
