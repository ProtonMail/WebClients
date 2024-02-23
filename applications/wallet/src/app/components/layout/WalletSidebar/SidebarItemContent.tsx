import {
    IconProps,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components/components';

import './SidebarItemContent.scss';

interface Props {
    label: string;
    to: string;
    icon: IconProps['name'];
    'data-testid'?: string;
    disabled?: boolean;
}

export const SidebarItemContent = ({ label, to, icon, disabled, ...props }: Props) => {
    return (
        <SidebarListItemLink
            to={to}
            onClick={(e) => {
                if (disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            className={disabled ? 'disabled-sidebar-link' : ''}
        >
            <SidebarListItemContent
                data-testid={props['data-testid']}
                left={<SidebarListItemContentIcon name={icon} />}
                className="flex gap-2 max-w-full"
            >
                <div className="ml-1 flex flex-nowrap justify-space-between items-center w-full relative">
                    <span className="text-ellipsis" title={label}>
                        {label}
                    </span>
                </div>
            </SidebarListItemContent>
        </SidebarListItemLink>
    );
};
