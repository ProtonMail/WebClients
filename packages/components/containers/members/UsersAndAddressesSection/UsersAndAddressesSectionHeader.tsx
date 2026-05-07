import type { CSSProperties, JSX } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import TableCell from '@proton/components/components/table/TableCell';
import { adminTooltipText } from '@proton/components/containers/members/constants';
import AdminRolesSpotlight from '@proton/components/containers/members/rolesAndPermissions/AdminRolesSpotlight';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode, useFeature } from '@proton/features';
import { SECOND } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

type HeaderCellItem = {
    key: string;
    node: string | JSX.Element;
    className?: string;
    style?: CSSProperties;
};

interface Props {
    useEmail?: boolean;
    showFeaturesColumn?: boolean;
}

const UsersAndAddressesSectionHeader = ({ useEmail, showFeaturesColumn }: Props) => {
    const hasAdminRoles = useFlag('AdminRoleMVP');
    const { feature: adminRolesModalFeature, loading: adminRolesModalLoading } = useFeature(
        FeatureCode.AdminRolesOnboardingModal
    );
    const isAdminRolesModalDismissed = !adminRolesModalLoading && !adminRolesModalFeature?.Value;
    const {
        show: showSpotlight,
        onDisplayed: onSpotlightDisplayed,
        onClose: onSpotlightClose,
    } = useSpotlightOnFeature(FeatureCode.AdminRolesTableSpotlight, hasAdminRoles && isAdminRolesModalDismissed);
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3 * SECOND);

    const addressesTitle = useEmail
        ? c('Title header for members table').t`Email`
        : c('Title header for members table').t`Addresses`;

    const headerCells: HeaderCellItem[] = [
        {
            key: 'name',
            node: (
                <AdminRolesSpotlight
                    show={shouldShowSpotlight}
                    onDisplayed={onSpotlightDisplayed}
                    onClose={onSpotlightClose}
                    originalPlacement="top-start"
                    title={c('Spotlight').t`User roles available`}
                    description={c('Spotlight').t`Click a user's name to manage their role and permissions.`}
                    kbLink={getKnowledgeBaseUrl('/admin-roles')}
                >
                    <span>{c('Title header for members table').t`Name`}</span>
                </AdminRolesSpotlight>
            ),
            className: 'w-3/10',
        },
        {
            key: 'role',
            node: (
                <div className="inline-flex gap-2 items-center">
                    <span>{c('Title header for members table').t`Role`}</span>
                    <span className="hidden md:inline-flex items-center">
                        <Info title={adminTooltipText()} url={getKnowledgeBaseUrl('/user-roles')} />
                    </span>
                </div>
            ),
            className: 'w-1/6',
        },
        {
            key: 'addresses',
            node: (
                <>
                    <span className="text-ellipsis inline-block align-bottom max-w-full" title={addressesTitle}>
                        {addressesTitle}
                    </span>
                </>
            ),
            className: 'w-1/4',
        },
        showFeaturesColumn && {
            key: 'features',
            node: (
                <>
                    <span
                        className="text-ellipsis inline-block align-bottom max-w-full"
                        title={c('Title header for members table').t`Features`}
                    >{c('Title header for members table').t`Features`}</span>
                </>
            ),
            className: 'w-1/4',
        },
        { key: 'actions', node: '', className: 'w-1/6' },
    ].filter(isTruthy);

    return (
        <>
            {headerCells.map(({ key, node, className = '' }) => (
                <TableCell key={key} className={className} type="header">
                    {node}
                </TableCell>
            ))}
        </>
    );
};

export default UsersAndAddressesSectionHeader;
