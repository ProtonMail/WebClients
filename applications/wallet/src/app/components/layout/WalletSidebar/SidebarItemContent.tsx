import {
    IconProps,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components/components';

interface Props {
    label: string;
    to: string;
    icon: IconProps['name'];
    'data-testid'?: string;
}

export const SidebarItemContent = ({ label, to, icon, ...props }: Props) => {
    return (
        <SidebarListItemLink to={to}>
            <SidebarListItemContent
                data-testid={props['data-testid']}
                left={<SidebarListItemContentIcon name={icon} />}
                className="flex gap-2"
            >
                <div className="ml-1 flex flex-nowrap flex-justify-space-between flex-align-items-center w-full relative">
                    <span className="text-ellipsis" title={label}>
                        {label}
                    </span>
                </div>
            </SidebarListItemContent>
        </SidebarListItemLink>
    );
};
