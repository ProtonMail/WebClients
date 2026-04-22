import type { SectionConfig, SubSectionConfig, SubrouteConfig } from './interface';

export const getIsSubsectionAvailable = (section: SubSectionConfig) => {
    return section.available !== false;
};

export const getIsSubrouteAvailable = (subroute: SubrouteConfig) => {
    return subroute.available !== false;
};

export const getIsSectionAvailable = (section: SectionConfig) => {
    const subsectionsAvailable = (() => {
        const { subsections = [] } = section;

        if (!subsections.length) {
            return true;
        }

        return subsections.some((subsection) => getIsSubsectionAvailable(subsection));
    })();

    return section.available !== false && subsectionsAvailable;
};

export const getSectionPath = (path: string, section: SectionConfig) => {
    return `${path}${section.to}`;
};

export const getSubroutePath = (sectionPath: string, subroute: SubrouteConfig) => {
    return `${sectionPath}${subroute.to}`;
};

export const getRoutePaths = (prefix: string, sectionConfigs: SectionConfig[]) => {
    return sectionConfigs.map((section) => getSectionPath(prefix, section));
};
