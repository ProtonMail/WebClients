import type { PropsWithChildren, ReactElement, ReactNode } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Donut } from '@proton/atoms/Donut/Donut';
import type { ThemeColor } from '@proton/colors/types';
import AppsLogos from '@proton/components/components/appsLogos/AppsLogos';
import Info from '@proton/components/components/link/Info';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { type Subscription, hasAllProductsB2CPlan, hasDrive, hasDrive1TB, hasFree, hasMail } from '@proton/payments';
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
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { isOrganization } from '@proton/shared/lib/organization/helper';
import {
    SpaceStateThemeColorMap,
    getAppStorage,
    getAppStorageUsed,
    getCompleteSpaceDetails,
    getSpace,
    getStorageUsed,
} from '@proton/shared/lib/user/storage';
import useFlag from '@proton/unleash/useFlag';

import { getSubscriptionPanelText } from '../../helpers/subscriptionPanelHelpers';

function getStorageText(maxSpace: number, usedSpace: number) {
    const unit = maxSpace >= sizeUnits.TB ? 'TB' : 'GB';
    const humanUsedSpace = humanSize({ bytes: usedSpace, unit: unit });
    const humanMaxSpace = humanSize({ bytes: maxSpace, unit: unit, fraction: 0 });
    return c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`;
}

function DonutContainer({ children }: PropsWithChildren) {
    return (
        <span className="w-custom h-custom" style={{ '--w-custom': '2.25rem', '--h-custom': '2.25rem' }}>
            {children}
        </span>
    );
}

interface StorageSplitFreePlanTooltipProps {
    userSpace: ReturnType<typeof getSpace>;
    spaceDetails: ReturnType<typeof getCompleteSpaceDetails>;
    isSheetsEnabled: boolean;
}

function StorageSplitFreePlanTooltip({ spaceDetails, userSpace, isSheetsEnabled }: StorageSplitFreePlanTooltipProps) {
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
                <DonutContainer>
                    <Donut
                        gap={0}
                        rounded={true}
                        segments={[[spaceDetails.base.percentage, SpaceStateThemeColorMap[spaceDetails.base.type]]]}
                    />
                </DonutContainer>
                <span className="text-semibold">{mailText}</span>
            </div>
            <div className="text-left text-sm">{c('Label')
                .t`Shared between ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, and ${WALLET_SHORT_APP_NAME}.`}</div>
            <hr className="mb-0 min-h-px" />
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
                <DonutContainer>
                    <Donut
                        rounded={true}
                        gap={0}
                        segments={[[spaceDetails.drive.percentage, SpaceStateThemeColorMap[spaceDetails.drive.type]]]}
                    />
                </DonutContainer>
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

interface StorageSplitOrganizationTooltipProps {
    user: UserModel;
    organization: Organization;
}

function StorageSplitOrganizationTooltip({ organization, user }: StorageSplitOrganizationTooltipProps) {
    const [addresses] = useAddresses();
    const userSpace = getSpace(user);
    const userSpaceDetails = getCompleteSpaceDetails(userSpace);
    const orgSpaceDetails = getCompleteSpaceDetails({
        ...userSpace,
        maxSpace: organization.MaxSpace ?? userSpace.maxSpace,
        usedSpace: organization.UsedSpace ?? userSpace.usedSpace,
    });
    const userStorageText = getStorageText(userSpace.maxBaseSpace, userSpace.usedBaseSpace);
    const orgStorageText = getStorageText(organization.MaxSpace, organization.UsedSpace);
    const { userText } = getSubscriptionPanelText(user, organization, addresses);
    const { MaxMembers } = organization;

    return (
        <div className="flex flex-column gap-4">
            <div className="flex gap-2 items-center justify-space-between">
                <span className="text-semibold">{c('Info').t`Total storage`}</span>
                {MaxMembers > 1 && userText && <span className="color-weak text-sm">{userText}</span>}
            </div>
            <div className="flex gap-2 items-center">
                <DonutContainer>
                    <Donut
                        gap={0}
                        rounded={true}
                        segments={[
                            [orgSpaceDetails.pooled.percentage, SpaceStateThemeColorMap[orgSpaceDetails.pooled.type]],
                        ]}
                    />
                </DonutContainer>
                <span className="text-semibold">{orgStorageText}</span>
            </div>
            <hr className="mb-0 min-h-px" />
            <div className="flex gap-2 items-center justify-space-between">
                <span className="text-semibold">{c('Info').t`Your storage`}</span>
                <Avatar
                    color="weak"
                    className="shrink-0 min-w-custom max-w-custom max-h-custom"
                    style={{
                        '--min-w-custom': '1.25rem',
                        '--max-w-custom': '1.25rem',
                        '--max-h-custom': '1.25rem',
                    }}
                >
                    {getInitials(user.DisplayName ?? user.Name)}
                </Avatar>
            </div>
            <div className="flex gap-2 items-center">
                <DonutContainer>
                    <Donut
                        gap={0}
                        rounded={true}
                        segments={[
                            [userSpaceDetails.pooled.percentage, SpaceStateThemeColorMap[userSpaceDetails.pooled.type]],
                        ]}
                    />
                </DonutContainer>
                <span className="text-semibold">{userStorageText}</span>
            </div>
            <div className="text-left text-sm">
                {getBoldFormattedText(c('Info').t`You can change storage allocation at **Users and addresses**`)}
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
                    <StorageSplitFreePlanTooltip
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
                    <StorageSplitFreePlanTooltip
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
        // For single user paid plans, show consolidated storage
        // For organizations, show a tooltip with user vs total space
        const text = getStorageText(userSpace.maxSpace, userSpace.usedSpace);
        return [
            {
                usedSpace: spaceDetails.pooled.percentage,
                tooltip:
                    organization && isOrganization(organization) ? (
                        <StorageSplitOrganizationTooltip user={user} organization={organization} />
                    ) : null,
                text,
                label: getStorageUsed(),
                graphColor: SpaceStateThemeColorMap[spaceDetails.pooled.type],
                shouldRender: (app, subscription) =>
                    hasMail(subscription) ||
                    hasDrive(subscription) ||
                    hasDrive1TB(subscription) ||
                    hasAllProductsB2CPlan(subscription),
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
            <div className="color-hint rounded flex items-center justify-center ratio-square shrink-0">{icon}</div>
            <p className="m-0 flex gap-0.5 flex-column">
                <span className="text-sm color-hint flex items-center gap-1">
                    {title}
                    {tooltip && (
                        <Info
                            tooltipClassName="bg-norm color-norm before:hidden border-norm border max-w-custom w-custom px-4 py-3 shadow-lifted"
                            tooltipStyle={{ '--max-w-custom': '16rem', '--w-custom': '16rem' }}
                            title={tooltip}
                            openDelay={100}
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
                <DonutContainer>
                    <Donut gap={0} segments={[[usedSpace, graphColor]]} rounded={true} />
                </DonutContainer>
            }
            title={label}
            tooltip={tooltip}
            text={text}
        />
    ));
};
