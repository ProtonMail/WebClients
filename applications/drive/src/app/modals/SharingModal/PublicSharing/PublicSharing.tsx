import { useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { SUBSCRIPTION_STEPS, Toggle, useConfig, useSettingsLink, useUpsellConfig } from '@proton/components';
import { MemberRole } from '@proton/drive';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcFormTextboxPassword } from '@proton/icons/icons/IcFormTextboxPassword';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import drivePlusUpgrade from '@proton/styles/assets/img/drive/drive-plus-upsell-banner.svg';
import clsx from '@proton/utils/clsx';

import { useDriveUpsellModal } from '../../DriveUpsellModal';
import { CopyPublicLink } from './CopyPublicLink';
import { usePublickLinkSettingsModal } from './PublicLinkSettingsModal';
import { PublicRoleDropdownMenu } from './PublicRoleDropdownMenu';

interface Props {
    publicLink?: {
        role: MemberRole;
        url: string;
        customPassword?: string;
        expirationTime?: Date;
    };
    onUpdate: ({
        role,
        customPassword,
        expiration,
    }: {
        role?: MemberRole;
        customPassword?: string;
        expiration?: Date;
    }) => Promise<void>;
    onCreate: () => Promise<void>;
    onDelete: () => Promise<void>;
    isLoading: boolean;
    viewOnly: boolean;
    onToggle?: (enabled: boolean) => void;
    disabledToggle?: boolean;
}
export const PublicSharing = ({
    publicLink,
    onUpdate,
    onCreate,
    onDelete,
    isLoading,
    viewOnly,
    onToggle,
    disabledToggle,
}: Props) => {
    const { url, role } = publicLink ?? {};

    const contentRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();
    const goToSettings = useSettingsLink();
    const [publicLinkSettingsModal, showPublicLinkSettingsModal] = usePublickLinkSettingsModal();

    const { APP_NAME } = useConfig();
    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.PUBLIC_SHARING_PERMISSIONS_MENU,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: APPS.PROTONDRIVE,
    });
    const upsellConfig = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
    const { driveUpsellModal, showDriveUpsellModal } = useDriveUpsellModal();

    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(url, contentRef.current);
        }
    };

    const handleChangeRole = (role: MemberRole) => {
        return onUpdate({ role }).catch((error) => {
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
        });
    };

    const handleToggle = () => {
        if (url) {
            void onDelete().then(() => onToggle?.(false));
        } else {
            void onCreate().then(() => onToggle?.(true));
        }
    };

    return (
        <>
            <div className="w-full" ref={contentRef} data-testid="share-modal-shareWithAnyoneSection">
                {/* Header */}
                <div className="flex items-center justify-space-between border-bottom border-weak px-8 pb-3 mb-5">
                    <div className="flex items-center gap-2">
                        <div
                            className="ratio-square rounded-50 w-2"
                            // Background colors not available in bg-* classes
                            style={{ background: !!url ? 'var(--signal-success)' : 'var(--interaction-weak-major-3)' }}
                        ></div>
                        <span className="text-bold">{c('Title').t`Public link`}</span>
                    </div>

                    <div className="flex items-center">
                        <span className="color-weak mr-2">
                            {!!url ? c('Label').t`Active` : c('Label').t`Not active`}
                        </span>
                        <Toggle disabled={disabledToggle} checked={!!url} loading={isLoading} onChange={handleToggle} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-column gap-4 px-8 w-full">
                    <div className="flex items-center justify-space-between gap-2">
                        <div className="flex flex-nowrap items-center gap-3">
                            <div
                                className="flex items-center ratio-square p-2 rounded"
                                // Background colors not available in bg-* classes
                                style={{
                                    background: !!url
                                        ? 'var(--signal-success-minor-2)'
                                        : 'var(--interaction-weak-minor-1)',
                                }}
                            >
                                <IcGlobe className={!!url ? 'color-success' : 'color-hint'} />
                            </div>
                            <span className={clsx(!url ? 'color-hint' : undefined, 'text-ellipsis')}>{c('Label')
                                .t`Anyone on the Internet with the link`}</span>
                        </div>

                        <div className="shrink-0">
                            {viewOnly ? (
                                <div className="hidden sm:block">{c('Label').t`can view`}</div>
                            ) : (
                                <PublicRoleDropdownMenu
                                    disabled={!url || isLoading}
                                    selectedRole={role ?? MemberRole.Viewer}
                                    onChangeRole={handleChangeRole}
                                />
                            )}
                        </div>
                    </div>

                    <CopyPublicLink url={url} onClick={handleCopyURLClick} disabled={!url} />
                </div>

                {/* Footer */}
                {url && (
                    <div className="w-full px-5">
                        <Button
                            className="w-full flex items-center justify-space-between mt-4"
                            color="weak"
                            shape="ghost"
                            size="small"
                            data-testid="public-link-settings-button"
                            onClick={() =>
                                showPublicLinkSettingsModal({
                                    customPassword: publicLink?.customPassword,
                                    expiration: publicLink?.expirationTime,
                                    onPublicLinkSettingsChange: onUpdate,
                                })
                            }
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex items-center ratio-square p-2 rounded"
                                    // Background color not available in bg-* classes
                                    style={{
                                        background: 'var(--interaction-weak-minor-2)',
                                    }}
                                >
                                    <IcFormTextboxPassword className="color-hint" />
                                </div>
                                <span>{c('Action').t`Set password or expiration date`}</span>
                            </div>

                            <IcChevronRight />
                        </Button>
                    </div>
                )}
            </div>

            {driveUpsellModal}
            {publicLinkSettingsModal}
        </>
    );
};
