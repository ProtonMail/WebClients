import { SectionConfig } from './interface';
import {
    SubSidebarList,
    SidebarListItemContent,
    SubSidebarListItem,
    SidebarListItem,
    SidebarListItemContentIcon,
} from '../../components/sidebar';
import SidebarListItemLink, { SubSidebarListItemLink } from '../../components/sidebar/SidebarListItemLink';
import { getIsSectionAvailable, getIsSubsectionAvailable } from './helper';

interface Props {
    list: SectionConfig[];
    pathname: string;
    activeSection: string;
}

const SidebarListItemsWithSubsections = ({ list, pathname, activeSection }: Props) => {
    const children = list.map((section) => {
        if (!getIsSectionAvailable(section)) {
            return null;
        }
        const subSections = section.subsections?.length ? (
            <SubSidebarList aria-hidden={section.to !== pathname}>
                {section.subsections.map((subsection) => {
                    return (
                        getIsSubsectionAvailable(subsection) && (
                            <SubSidebarListItem key={subsection.text}>
                                <SubSidebarListItemLink
                                    to={`${section.to}#${subsection.id}`}
                                    aria-current={subsection.id === activeSection ? 'true' : undefined}
                                >
                                    <SidebarListItemContent>{subsection.text}</SidebarListItemContent>
                                </SubSidebarListItemLink>
                            </SubSidebarListItem>
                        )
                    );
                })}
            </SubSidebarList>
        ) : null;

        return (
            <SidebarListItem key={section.text}>
                <SidebarListItemLink to={section.to}>
                    <SidebarListItemContent left={<SidebarListItemContentIcon name={section.icon} />}>
                        {section.text}
                    </SidebarListItemContent>
                </SidebarListItemLink>
                {subSections}
            </SidebarListItem>
        );
    });

    return <>{children}</>;
};

export default SidebarListItemsWithSubsections;
