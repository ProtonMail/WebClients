import React from 'react';
import { SectionConfig } from './interface';
import {
    SubSidebarList,
    SidebarListItemContent,
    SubSidebarListItem,
    SidebarListItem,
    SidebarListItemContentIcon,
} from '../sidebar';
import SidebarListItemLink, { SubSidebarListItemLink } from '../sidebar/SidebarListItemLink';

interface Props {
    list: SectionConfig[];
    pathname: string;
    activeSection: string;
}
const SidebarListItemsWithSubsections = ({ list, pathname, activeSection }: Props) => {
    const children = list.map(({ text, to, icon, subsections }) => {
        const subSections = subsections?.length ? (
            <SubSidebarList aria-hidden={to !== pathname}>
                {subsections.map(({ text, id }) => {
                    return (
                        <SubSidebarListItem key={text}>
                            <SubSidebarListItemLink
                                to={`${to}#${id}`}
                                aria-current={id === activeSection ? 'true' : undefined}
                            >
                                <SidebarListItemContent>{text}</SidebarListItemContent>
                            </SubSidebarListItemLink>
                        </SubSidebarListItem>
                    );
                })}
            </SubSidebarList>
        ) : null;

        return (
            <SidebarListItem key={text}>
                <SidebarListItemLink to={to}>
                    <SidebarListItemContent left={<SidebarListItemContentIcon name={icon} />}>
                        {text}
                    </SidebarListItemContent>
                </SidebarListItemLink>
                {subSections}
            </SidebarListItem>
        );
    });

    return <>{children}</>;
};

export default SidebarListItemsWithSubsections;
