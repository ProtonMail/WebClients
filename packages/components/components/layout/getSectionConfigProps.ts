import { SectionConfig } from './interface';

const getSectionConfigProps = (list: SectionConfig[], pathname: string, activeSection: string) => {
    return list.map(({ text, node = text, link, icon, subsections = [], ...rest }) => ({
        text: node,
        link,
        icon,
        ...rest,
        ariaHiddenList: pathname !== link,
        list: subsections.map(({ text, id }) => ({
            linkClassName: 'navigation__sublink',
            itemClassName: 'navigation__subitem',
            text,
            link: `${link}#${id}`,
            isActive: () => activeSection === id,
            ariaCurrent: activeSection === id ? 'true' : undefined
        }))
    }));
};

export default getSectionConfigProps;
