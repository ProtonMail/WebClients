import { useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button, Input, Tooltip } from '@proton/atoms';
import {
    Icon,
    SUBSCRIPTION_STEPS,
    Toggle,
    useConfig,
    useNotifications,
    useSettingsLink,
    useUpsellConfig,
} from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import drivePlusUpgrade from '@proton/styles/assets/img/drive/drive-plus-upsell-banner.svg';
import clsx from '@proton/utils/clsx';

import { useDriveUpsellModal } from '../../../components/modals/DriveUpsellModal';
import { RoleDropdownMenu } from '../RoleDropdownMenu';

interface Props {
    url?: string;
    role: MemberRole;
    onChangeRole: ({ role }: { role: MemberRole }) => Promise<void>;
    onCreate: () => Promise<void>;
    onDelete: () => Promise<void>;
    isLoading: boolean;
    viewOnly: boolean;
    onToggle?: (enabled: boolean) => void;
    disabledToggle?: boolean;
}
export const PublicSharing = ({
    url,
    role,
    onChangeRole,
    onCreate,
    onDelete,
    isLoading,
    viewOnly,
    onToggle,
    disabledToggle,
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
            textToClipboard(url, contentRef.current);
            createNotification({
                text: c('Success').t`Secure link copied`,
            });
        }
    };

    const handleChangeRole = (role: MemberRole) => {
        void withPermissionsLoading(() =>
            onChangeRole({ role }).catch((error) => {
                if (error.data.Code === API_CUSTOM_ERROR_CODES.MAX_PUBLIC_EDIT_MODE_FOR_FREE_USER) {
                    const planName = PLAN_NAMES[user.isFree ? PLANS.DRIVE : PLANS.BUNDLE];
                    return showDriveUpsellModal({
                        size: 'large',
                        'data-testid': 'public-sharing',
                        titleModal: c('Title').t`Need to share more files with edit access?`,
                        // translator: We can have two different plan upgrade: "Upgrade to Proton Drive Plus" or "Upgrade to Proton Drive Unlimited"
                        description: c('Description').t`Upgrade to ${planName} to keep sharing files with edit access`,
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
        if (url) {
            void onDelete().then(() => onToggle?.(false));
        } else {
            void onCreate().then(() => onToggle?.(true));
        }
    };

    const hasEditorRole = role === MemberRole.Editor;
    const editorPermissionsTooltipText = c('Info')
        .t`Your email address will be visible as the link's owner on the share page`;

    return (
        <div className="w-full" ref={contentRef} data-testid="share-modal-shareWithAnyoneSection">
            <div className="flex justify-space-between items-center mb-6">
                <h2 className="text-lg text-semibold mr">{c('Info').t`Create public link`}</h2>
                <Toggle disabled={disabledToggle} checked={!!url} loading={isLoading} onChange={handleToggle} />
            </div>
            <div className={clsx('flex items-center justify-space-between mb-4', !url && 'opacity-30')}>
                <div className="w-full flex flex-nowrap gap-2">
                    <Avatar color="weak" className="shrink-0">
                        <Icon name="globe" />
                    </Avatar>
                    <p className="flex-1 flex flex-column p-0 m-0">
                        <span className="text-semibold">{c('Label').t`Anyone with the link`}</span>
                        <span className="flex items-center color-weak">
                            {hasEditorRole
                                ? c('Label').t`Anyone on the Internet with the link can edit`
                                : c('Label').t`Anyone on the Internet with the link can view`}
                            {hasEditorRole && (
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
                            <RoleDropdownMenu
                                disabled={!url || isLoading}
                                isLoading={isPermissionsLoading}
                                selectedRole={role}
                                onChangeRole={handleChangeRole}
                                publicLinkOptions
                            />
                        )}
                    </div>
                </div>
            </div>
            {!!url ? (
                <div className="w-full flex justify-space-between">
                    <Input
                        readOnly
                        value={url}
                        className="overflow-hidden text-ellipsis bg-weak border-weak color-weak"
                        data-testid="share-anyone-url"
                        disabled={!url}
                    />
                    <Button
                        color="norm"
                        shape="outline"
                        icon
                        id="copy-url-button"
                        onClick={handleCopyURLClick}
                        className="ml-3"
                        disabled={!url}
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
