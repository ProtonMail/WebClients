import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button, Input } from '@proton/atoms';
import {
    Icon,
    SUBSCRIPTION_STEPS,
    Toggle,
    Tooltip,
    useConfig,
    useNotifications,
    useSettingsLink,
    useUpsellConfig,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { PLANS, PLAN_NAMES } from '@proton/payments/index';
import { APPS, BRAND_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { type SHARE_URL_PERMISSIONS, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import drivePlusUpgrade from '@proton/styles/assets/img/drive/drive-plus-upsell-banner.svg';
import clsx from '@proton/utils/clsx';

import { useDriveUpsellModal } from '../../DriveUpsellModal';
import { PermissionsDropdownMenu } from '../PermissionsDropdownMenu';

interface Props {
    publicSharedLink: string;
    publicSharedLinkPermissions: SHARE_URL_PERMISSIONS;
    onChangePermissions: (permissions: number) => Promise<void>;
    createSharedLink: () => void;
    deleteSharedLink: () => void;
    isLoading: boolean;
    viewOnly: boolean;
}
export const PublicSharing = ({
    publicSharedLink,
    publicSharedLinkPermissions,
    onChangePermissions,
    createSharedLink,
    deleteSharedLink,
    isLoading,
    viewOnly,
}: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isPermissionsLoading, withPermissionsLoading] = useLoading(false);
    const { createNotification } = useNotifications();
    const [driveUpsellModal, showDriveUpsellModal] = useDriveUpsellModal();
    const [user] = useUser();

    const goToSettings = useSettingsLink();
    const { APP_NAME } = useConfig();
    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.PUBLIC_SHARING_PERMISSIONS_MENU,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: APPS.PROTONDRIVE,
    });
    const upsellConfig = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });

    /* Remove that when entitlement logic will be implemented */
    const [organization] = useOrganization();
    const havePublicEditorFeature =
        organization?.PlanName &&
        [
            PLANS.BUNDLE,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.MAIL_PRO,
            PLANS.DUO,
            PLANS.DRIVE_BUSINESS,
            PLANS.DRIVE,
            PLANS.VISIONARY,
            PLANS.MAIL_BUSINESS,
            PLANS.FAMILY,
        ].includes(organization.PlanName);

    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(publicSharedLink, contentRef.current);
            createNotification({
                text: c('Success').t`Secure link copied`,
            });
        }
    };

    const handleUpdatePermissions = (permissions: SHARE_URL_PERMISSIONS) => {
        if (!havePublicEditorFeature) {
            const planName = PLAN_NAMES[user.isFree ? PLANS.DRIVE : PLANS.BUNDLE];
            return showDriveUpsellModal({
                size: 'large',
                sourceEvent: 'BUTTON_PUBLIC_SHARING_EDITOR',
                titleModal: c('Title').t`Share files with full edit access`,
                // translator: We can have two different plan upgrade: "Upgrade to Proton Drive Plus" or "Upgrade to Proton Drive Unlimited"
                description: c('Description')
                    .t`Upgrade to ${BRAND_NAME} ${planName} to enable public file sharing with edit access. Keep collaborating seamlessly and securely.`,
                illustration: drivePlusUpgrade,
                closeButtonColor: 'white',
                onUpgrade: () => {
                    if (upsellConfig.onUpgrade) {
                        upsellConfig.onUpgrade();
                    } else {
                        goToSettings(upsellConfig.upgradePath);
                    }
                },
            });
        }
        return withPermissionsLoading(() => onChangePermissions(permissions));
    };

    const handleToggle = () => {
        if (publicSharedLink) {
            deleteSharedLink();
        } else {
            createSharedLink();
        }
    };

    const editorPermissions = useMemo(() => getCanWrite(publicSharedLinkPermissions), [publicSharedLinkPermissions]);
    const editorPermissionsTooltipText = c('Info')
        .t`Your email address will be visible as the link's owner on the share page`;

    return (
        <div className="w-full" ref={contentRef} data-testid="share-modal-shareWithAnyoneSection">
            <div className="flex justify-space-between items-center mb-6">
                <h2 className="text-lg text-semibold mr">{c('Info').t`Create public link`}</h2>
                <Toggle checked={!!publicSharedLink} loading={isLoading} onChange={handleToggle} />
            </div>
            <div className={clsx('flex items-center justify-space-between mb-4', !publicSharedLink && 'opacity-30')}>
                <div className="flex items-center">
                    <Avatar color="weak" className="mr-2 shrink-0">
                        <Icon name="globe" />
                    </Avatar>
                    <p className="flex-1 flex flex-column p-0 m-0">
                        <span className="text-semibold">{c('Label').t`Anyone with the link`}</span>
                        <span className="flex items-center color-weak">
                            {editorPermissions
                                ? c('Label').t`Anyone on the Internet with the link can edit`
                                : c('Label').t`Anyone on the Internet with the link can view`}
                            {editorPermissions && (
                                <Tooltip title={editorPermissionsTooltipText}>
                                    <Icon className="ml-1" name="info-circle" />
                                </Tooltip>
                            )}
                        </span>
                    </p>
                </div>
                {viewOnly ? (
                    <div className="hidden sm:block shrink-0">{c('Label').t`Viewer`}</div>
                ) : (
                    <PermissionsDropdownMenu
                        disabled={!publicSharedLink || isLoading}
                        isLoading={isPermissionsLoading}
                        selectedPermissions={publicSharedLinkPermissions}
                        onChangePermissions={handleUpdatePermissions}
                        publicSharingOptions
                        havePublicEditorFeature={havePublicEditorFeature}
                    />
                )}
            </div>
            {!!publicSharedLink ? (
                <div className="w-full flex justify-space-between">
                    <Input
                        readOnly
                        value={publicSharedLink}
                        className="overflow-hidden text-ellipsis bg-weak border-weak color-weak"
                        data-testid="share-anyone-url"
                        disabled={!publicSharedLink}
                    />
                    <Button
                        color="norm"
                        shape="outline"
                        icon
                        id="copy-url-button"
                        onClick={handleCopyURLClick}
                        className="ml-3"
                        disabled={!publicSharedLink}
                        data-testid="share-anyone-copyUrlButton"
                    >
                        <Icon name="squares" />
                    </Button>
                </div>
            ) : null}
            {driveUpsellModal}
        </div>
    );
};
