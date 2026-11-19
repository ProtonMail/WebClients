import type { ReactNode } from 'react';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import {
    DashboardGrid,
    DashboardGridSectionHeader,
    DashboardGridSectionSubtitle,
} from '@proton/atoms/DashboardGrid/DashboardGrid';

interface Props {
    /** Omit it when the page title already names the section. */
    title?: ReactNode;
    /** Shown under the title, outside the card. */
    description?: ReactNode;
    /** A notice or alert shown above the actions. */
    notice?: ReactNode;
    /** Buttons shown between the header and the card, e.g. to add an item to the list in the card. */
    actions?: ReactNode;
    /** The card content. No card is rendered without it. */
    children?: ReactNode;
    /** Removes the card padding, for a table that fills the card. See `getSettingsCardTableProps`. */
    flush?: boolean;
}

/**
 * A settings section in the card layout: a header with the title and description, then the
 * content in a card. Use it with `invisibleTitle` on the subsection, since it renders the title.
 */
/** The buttons shown between a card section header and its card. */
export const SettingsCardActions = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-wrap items-center gap-2 md:gap-4">{children}</div>
);

/** The card of a card section. `flush` removes its padding, for a table that fills it. */
export const SettingsCardBody = ({ flush = false, children }: { flush?: boolean; children: ReactNode }) => (
    <DashboardCard>
        <DashboardCardContent paddingClass={flush ? 'p-0' : undefined}>{children}</DashboardCardContent>
    </DashboardCard>
);

export const SettingsCardSection = ({ title, description, notice, actions, children, flush = false }: Props) => {
    return (
        <DashboardGrid as="div">
            {title ? (
                <DashboardGridSectionHeader title={title} subtitle={description} />
            ) : (
                description && <DashboardGridSectionSubtitle>{description}</DashboardGridSectionSubtitle>
            )}
            {notice && <div>{notice}</div>}
            {actions && <SettingsCardActions>{actions}</SettingsCardActions>}
            {children && <SettingsCardBody flush={flush}>{children}</SettingsCardBody>}
        </DashboardGrid>
    );
};
