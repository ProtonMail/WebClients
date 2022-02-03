import { SectionConfig, SubSectionConfig } from '@proton/components';

export const getIsSubsectionAvailable = (section: SubSectionConfig) => {
    return !(section.available === false);
};

export const getIsSectionAvailable = (section: SectionConfig) => {
    const subsections = Object.values(section.subsections || {});
    return !(section.available === false || subsections.every((subsection) => !getIsSubsectionAvailable(subsection)));
};

export const getSectionPath = (path: string, section: SectionConfig) => {
    return `${path}${section.to}`;
};
