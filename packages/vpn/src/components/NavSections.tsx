import type { ReactNode } from 'react';

import SubSettingsSection from '@proton/components/containers/layout/SubSettingsSection';
import type { NavSectionResolved } from '@proton/nav/types/section';

interface BaseProps<SectionId extends string> {
    /**
     * A resolved nav navItem whose `sections` carry their literal ids.
     * `SectionId` is inferred from here.
     */
    navItem: { sections?: readonly (NavSectionResolved & { id: SectionId })[] } | undefined;
}

/**
 * `content` keys are always typo-proof (a misspelled id is a compile error).
 * `content` must cover **every** section id — nothing can be silently left out.
 *
 * @example
 * <NavSections navItem={navItem} content={{ 'a.x': <X />, 'a.y': <Y /> }} />
 */
type Props<SectionId extends string> = BaseProps<SectionId> & {
    content: Record<NoInfer<SectionId>, ReactNode>;
};

/**
 * Renders the bound components for a nav navItem's sections.
 *
 * **Important:** The order comes from the navigation definition (`navItem.sections`), not from `content`'s key order.
 *
 * Does NOT wrap in `PrivateMainSettingsAreaBase`, which owns the title and scroll/sticky container once for the page.
 *
 * @example
 * <PrivateMainSettingsAreaBase title={navItem.label}>
 *     <NavSections navItem={navItem} content={{ 'a.clients': <ClientsSection />, 'a.config': <ConfigSection /> }} />
 * </PrivateMainSettingsAreaBase>
 */
export const NavSections = <SectionId extends string>({ navItem, content }: Props<SectionId>): ReactNode =>
    (navItem?.sections ?? []).map((section) => {
        const sectionInContent = section.id in content;
        if (!sectionInContent) {
            throw new Error(`NavSections: no content added for section id "${section.id}"`);
        }

        return (
            <SubSettingsSection
                key={section.id}
                id={section.to}
                title={section.text}
                invisibleTitle={!section.text}
                beta={section.beta}
                variant={section.variant}
                className="container-section-sticky-section"
            >
                {content[section.id]}
            </SubSettingsSection>
        );
    });
