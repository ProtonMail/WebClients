import type { CSSProperties, JSX } from 'react';

import { c } from 'ttag';

import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import type { MemberUsageColumnDisplay } from '@proton/shared/lib/api/members';
import { SECOND, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import Info from '../../../components/link/Info';
import useSpotlightShow from '../../../components/spotlight/useSpotlightShow';
import TableCell from '../../../components/table/TableCell';
import useSpotlightOnFeature from '../../../hooks/useSpotlightOnFeature';
import { adminTooltipText } from '../constants';
import AdminRolesSpotlight from '../rolesAndPermissions/AdminRolesSpotlight';

type HeaderCellItem = {
    key: string;
    node: string | JSX.Element;
    className?: string;
    style?: CSSProperties;
};

interface Props {
    useEmail?: boolean;
    showFeaturesColumn?: boolean;
    showUsage?: boolean;
    columnDisplay?: MemberUsageColumnDisplay;
}

const UsersAndAddressesSectionHeader = ({ useEmail, showFeaturesColumn, showUsage, columnDisplay }: Props) => {
    const [adminRolesUIState] = useAdminRolesUI();
    const { feature: adminRolesModalFeature, loading: adminRolesModalLoading } = useFeature(
        FeatureCode.AdminRolesOnboardingModal
    );
    const isAdminRolesModalDismissed = !adminRolesModalLoading && !adminRolesModalFeature?.Value;
    const {
        show: showSpotlight,
        onDisplayed: onSpotlightDisplayed,
        onClose: onSpotlightClose,
    } = useSpotlightOnFeature(
        FeatureCode.AdminRolesTableSpotlight,
        adminRolesUIState === AdminRolesUIState.Enabled && isAdminRolesModalDismissed
    );
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3 * SECOND);

    const addressesTitle = useEmail
        ? c('Title header for members table').t`Email`
        : c('Title header for members table').t`Addresses`;

    const usageHeaderCell = (
        key: 'lastActivity' | 'lastConnection',
        title: string,
        tooltip: string,
        widthClass: string
    ): HeaderCellItem => {
        const columnState = key === 'lastActivity' ? columnDisplay?.Activity : columnDisplay?.Connection;
        const greyed = columnState !== undefined && columnState !== 'data';

        return {
            key,
            node: (
                <div className="inline-flex gap-2 items-center">
                    <span>{title}</span>
                    <span className="hidden md:inline-flex items-center">
                        <Info title={tooltip} />
                    </span>
                </div>
            ),
            className: clsx(widthClass, greyed && 'color-weak'),
        };
    };

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
            className: showUsage ? 'w-1/4' : 'w-auto',
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
            className: showUsage ? 'w-custom max-w-custom' : 'w-1/6',
            style: showUsage ? { '--w-custom': '3em', '--max-w-custom': '6em' } : undefined,
        },
        !showUsage && {
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
            className: 'w-1/5',
        },
        showUsage &&
            usageHeaderCell(
                'lastActivity',
                c('Title header for members table').t`Last app activity`,
                c('Tooltip for members table')
                    .t`Last time this user signed in or used the ${VPN_APP_NAME} app on their device.`,
                'w-1/6'
            ),
        showUsage &&
            usageHeaderCell(
                'lastConnection',
                c('Title header for members table').t`Last connection`,
                c('Tooltip for members table').t`Last time this user connected to one of your organization's Gateways.`,
                'w-1/5'
            ),
        { key: 'actions', node: '', className: 'w-custom', style: { '--w-custom': '3em' } },
    ].filter(isTruthy);

    return (
        <>
            {headerCells.map(({ key, node, className = '', style }) => (
                <TableCell key={key} className={className} type="header" style={style}>
                    {node}
                </TableCell>
            ))}
        </>
    );
};

export default UsersAndAddressesSectionHeader;
