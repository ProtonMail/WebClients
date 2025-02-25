import { useMemo, useRef } from 'react';

import { c } from 'ttag';

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
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS, BRAND_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { type SHARE_URL_PERMISSIONS, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
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
    createSharedLink: () => Promise<void>;
    deleteSharedLink: () => Promise<void>;
    isLoading: boolean;
    viewOnly: boolean;
    onPublicLinkToggle?: (enabled: boolean) => void;
}
export const PublicSharing = ({
    publicSharedLink,
    publicSharedLinkPermissions,
    onChangePermissions,
    createSharedLink,
    deleteSharedLink,
    isLoading,
    viewOnly,
    onPublicLinkToggle,
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

    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(publicSharedLink, contentRef.current);
            createNotification({
                text: c('Success').t`Secure link copied`,
            });
        }
    };

    const handleUpdatePermissions = (permissions: SHARE_URL_PERMISSIONS) => {
        void withPermissionsLoading(() =>
            onChangePermissions(permissions).catch((error) => {
                if (error.data.Code === API_CUSTOM_ERROR_CODES.MAX_PUBLIC_EDIT_MODE_FOR_FREE_USER) {
                    const planName = PLAN_NAMES[user.isFree ? PLANS.DRIVE : PLANS.BUNDLE];
                    return showDriveUpsellModal({
                        size: 'large',
                        titleModal: c('Title').t`Need to share more files with edit access?`,
                        // translator: We can have two different plan upgrade: "Upgrade to Proton Drive Plus" or "Upgrade to Proton Drive Unlimited"
                        description: c('Description')
                            .t`Upgrade to ${BRAND_NAME} ${planName} to keep sharing files with edit access`,
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
                throw error;
            })
        );
    };

    const handleToggle = () => {
        if (publicSharedLink) {
            void deleteSharedLink().then(() => onPublicLinkToggle?.(false));
        } else {
            void createSharedLink().then(() => onPublicLinkToggle?.(true));
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
                <div className="w-full flex flex-nowrap gap-2">
                    <Avatar color="weak" className="shrink-0">
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
                    <div className="shrink-0">
                        {viewOnly ? (
                            <div className="hidden sm:block">{c('Label').t`Viewer`}</div>
                        ) : (
                            <PermissionsDropdownMenu
                                disabled={!publicSharedLink || isLoading}
                                isLoading={isPermissionsLoading}
                                selectedPermissions={publicSharedLinkPermissions}
                                onChangePermissions={handleUpdatePermissions}
                                publicSharingOptions
                            />
                        )}
                    </div>
                </div>
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
