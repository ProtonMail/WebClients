import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import { getIsSectionAvailable } from '@proton/components/containers/layout/helper';
import type { SectionConfig } from '@proton/components/containers/layout/interface';

/**
 * Sections that moved to another page, so links to their old anchors keep working
 */
export interface SettingsLinkRedirectRule {
    /** Anchors of the moved sections on the current page */
    hashes: string[];
    /** Page the sections moved to */
    section: SectionConfig;
    /** Keep the anchor when the section has the same id on the new page, so it scrolls to it */
    keepHash?: boolean;
}

interface Props {
    rules: SettingsLinkRedirectRule[];
    path: string;
    children: ReactNode;
}

export function SettingsLinkRedirect({ rules, path, children }: Props) {
    const location = useLocation();
    const [, loadingAllSubscriptions] = useAllSubscriptions();
    const [, loadingOrganization] = useOrganization();

    // Which page to redirect to, and which version of the current page to render, depend on the organization and subscriptions
    if (loadingAllSubscriptions || loadingOrganization) {
        return <PrivateMainAreaLoading />;
    }

    const rule = location.hash ? rules.find(({ hashes }) => hashes.includes(location.hash)) : undefined;

    if (!rule || !getIsSectionAvailable(rule.section)) {
        return <>{children}</>;
    }

    const hash = rule.keepHash ? location.hash : '';
    return <Redirect to={`${path}${rule.section.to}${location.search}${hash}`} />;
}
