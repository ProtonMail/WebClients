import type { ReactElement, ReactNode } from 'react';

import { c } from 'ttag';

import { Donut } from '@proton/atoms/Donut/Donut';
import type { ThemeColor } from '@proton/colors/types';
import AppsLogos from '@proton/components/components/appsLogos/AppsLogos';
import Info from '@proton/components/components/link/Info';
import { type Subscription, hasAllProductsB2CPlan, hasDrive, hasFree, hasMail } from '@proton/payments';
import {
    APPS,
    type APP_NAMES,
    CALENDAR_SHORT_APP_NAME,
    DOCS_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    SHEETS_SHORT_APP_NAME,
    WALLET_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import {
    SpaceStateThemeColorMap,
    getAppStorage,
    getAppStorageUsed,
    getCompleteSpaceDetails,
    getSpace,
    getStorageUsed,
} from '@proton/shared/lib/user/storage';
import useFlag from '@proton/unleash/useFlag';

function getStorageText(maxSpace: number, usedSpace: number) {
    const unit = maxSpace >= sizeUnits.TB ? 'TB' : 'GB';
    const humanUsedSpace = humanSize({ bytes: usedSpace, unit: unit });
    const humanMaxSpace = humanSize({ bytes: maxSpace, unit: unit, fraction: 0 });
    return c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`;
}

interface StorageSplitTooltipProps {
    userSpace: ReturnType<typeof getSpace>;
    spaceDetails: ReturnType<typeof getCompleteSpaceDetails>;
    isSheetsEnabled: boolean;
}

function StorageSplitTooltip({ spaceDetails, userSpace, isSheetsEnabled }: StorageSplitTooltipProps) {
    const mailText = getStorageText(userSpace.maxBaseSpace, userSpace.usedBaseSpace);
    const driveText = getStorageText(userSpace.maxDriveSpace, userSpace.usedDriveSpace);
    return (
        <div className="flex flex-column gap-4">
            <div className="flex gap-2 items-center justify-space-between">
                <span className="text-semibold">{getAppStorage(MAIL_SHORT_APP_NAME)}</span>
                <AppsLogos
                    apps={[APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONPASS, APPS.PROTONWALLET]}
                    appNames={false}
                    logoSize={5}
                />
            </div>
            <div className="flex gap-2 items-center">
                <span style={{ width: 36, height: 36 }}>
                    <Donut
                        gap={0}
                        segments={[[spaceDetails.base.percentage, SpaceStateThemeColorMap[spaceDetails.base.type]]]}
                    />
                </span>
                <span className="text-semibold">{mailText}</span>
            </div>
            <div className="text-left text-sm">{c('Label')
                .t`Shared between ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, and ${WALLET_SHORT_APP_NAME}.`}</div>
            <hr className="border mb-0" />
            <div className="flex gap-2 items-center justify-space-between">
                <span className="text-semibold">{getAppStorage(DRIVE_SHORT_APP_NAME)}</span>
                <AppsLogos
                    apps={
                        isSheetsEnabled
                            ? [APPS.PROTONDRIVE, APPS.PROTONDOCS, APPS.PROTONSHEETS]
                            : [APPS.PROTONDRIVE, APPS.PROTONDOCS]
                    }
                    appNames={false}
                    logoSize={5}
                />
            </div>
            <div className="flex gap-2 items-center">
                <span style={{ width: 36, height: 36 }}>
                    <Donut
                        gap={0}
                        segments={[[spaceDetails.drive.percentage, SpaceStateThemeColorMap[spaceDetails.drive.type]]]}
                    />
                </span>
                <span className="text-semibold">{driveText}</span>
            </div>
            <div className="text-left text-sm">
                {isSheetsEnabled
                    ? c('Label').t`For ${DRIVE_SHORT_APP_NAME}, ${DOCS_SHORT_APP_NAME}, and ${SHEETS_SHORT_APP_NAME}.`
                    : c('Label').t`For ${DRIVE_SHORT_APP_NAME} and ${DOCS_SHORT_APP_NAME}.`}
            </div>
        </div>
    );
}

interface DashboardStorageSection {
    label: string;
    text: string;
    tooltip: ReactNode;
    usedSpace: number;
    graphColor: ThemeColor;
    shouldRender: (app: APP_NAMES, subscription: Subscription) => boolean;
}

export function getDashboardStorageSections(
    organization: Organization | undefined,
    user: UserModel,
    subscription: Subscription,
    isSheetsEnabled: boolean
): DashboardStorageSection[] {
    const isFree = hasFree(subscription);
    let userSpace = getSpace(user);
    // For paid users in an organization, use organization space instead of user space.
    if (!isFree && organization) {
        userSpace = {
            ...userSpace,
            usedSpace: organization.UsedSpace ?? userSpace.usedSpace,
            maxSpace: organization.MaxSpace ?? userSpace.maxSpace,
        };
    }
    const spaceDetails = getCompleteSpaceDetails(userSpace);

    if (isFree) {
        // For Free plans, split the storage into Mail and drive
        const mailText = getStorageText(userSpace.maxBaseSpace, userSpace.usedBaseSpace);
        const driveText = getStorageText(userSpace.maxDriveSpace, userSpace.usedDriveSpace);
        return [
            {
                usedSpace: spaceDetails.base.percentage,
                tooltip: (
                    <StorageSplitTooltip
                        userSpace={userSpace}
                        spaceDetails={spaceDetails}
                        isSheetsEnabled={isSheetsEnabled}
                    />
                ),
                text: mailText,
                label: getAppStorageUsed(MAIL_SHORT_APP_NAME),
                graphColor: SpaceStateThemeColorMap[spaceDetails.base.type],
                shouldRender: (app) => app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR,
            },
            {
                usedSpace: spaceDetails.drive.percentage,
                tooltip: (
                    <StorageSplitTooltip
                        userSpace={userSpace}
                        spaceDetails={spaceDetails}
                        isSheetsEnabled={isSheetsEnabled}
                    />
                ),
                text: driveText,
                label: getAppStorageUsed(DRIVE_SHORT_APP_NAME),
                graphColor: SpaceStateThemeColorMap[spaceDetails.drive.type],
                shouldRender: (app) => app === APPS.PROTONDRIVE,
            },
        ];
    } else {
        // For paid plans, show consolidated storage
        const text = getStorageText(userSpace.maxSpace, userSpace.usedSpace);
        return [
            {
                usedSpace: spaceDetails.pooled.percentage,
                tooltip: null,
                text,
                label: getStorageUsed(),
                graphColor: SpaceStateThemeColorMap[spaceDetails.pooled.type],
                shouldRender: (app, subscription) =>
                    hasMail(subscription) || hasDrive(subscription) || hasAllProductsB2CPlan(subscription),
            },
        ];
    }
}

const FeatureElement = ({
    icon,
    title,
    text,
    tooltip,
}: {
    icon: ReactElement;
    title: ReactNode;
    text: string | ReactElement;
    tooltip?: ReactNode;
}) => {
    return (
        <div className="flex flex-nowrap gap-2 items-center">
            <div className="bg-norm color-hint rounded flex items-center justify-center ratio-square shrink-0">
                {icon}
            </div>
            <p className="m-0 flex gap-0.5 flex-column">
                <span className="text-sm color-hint flex items-center gap-1">
                    {title}
                    {tooltip && (
                        <Info
                            tooltipClassName="bg-norm color-norm before:hidden border-norm border max-w-custom w-custom px-4 py-3 shadow-lifted"
                            tooltipStyle={{ '--max-w-custom': '16rem', '--w-custom': '16rem' }}
                            title={tooltip}
                        />
                    )}
                </span>
                <span className="sr-only">:</span>
                <span className="text-semibold text-rg">{text}</span>
            </p>
        </div>
    );
};

export const StorageSection = ({
    app,
    user,
    subscription,
    organization,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription;
    organization: Organization | undefined;
}) => {
    const isSheetsEnabled = useFlag('DocsSheetsEnabled');
    const storageElements = getDashboardStorageSections(organization, user, subscription, isSheetsEnabled);
    const visibleElements = storageElements.filter(
        ({ usedSpace, shouldRender }) => shouldRender(app, subscription) || usedSpace > 80
    );

    if (visibleElements.length === 0) {
        return null;
    }

    return visibleElements.map(({ label, text, usedSpace, graphColor, tooltip }) => (
        <FeatureElement
            key={label}
            icon={
                <div style={{ width: 36, height: 36 }}>
                    <Donut gap={0} segments={[[usedSpace, graphColor]]} />
                </div>
            }
            title={label}
            tooltip={tooltip}
            text={text}
        />
    ));
};
