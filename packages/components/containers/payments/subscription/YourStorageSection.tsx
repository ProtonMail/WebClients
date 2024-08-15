import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    CalendarLogo,
    DriveLogo,
    Icon,
    MailLogo,
    Meter,
    PassLogo,
    SettingsLink,
    WalletLogo,
} from '@proton/components/components';
import { SettingsSection } from '@proton/components/containers';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useSubscription, useUser } from '@proton/components/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import {
    SpaceState,
    getAppStorage,
    getAppStorageAlmostFull,
    getAppStorageFull,
    getCompleteSpaceDetails,
    getPlanToUpsell,
    getSpace,
    getStorageFull,
} from '@proton/shared/lib/user/storage';
import clsx from '@proton/utils/clsx';
import percentage from '@proton/utils/percentage';

import PromotionBanner from '../../banner/PromotionBanner';
import upsellStorageDrive from './upsell-storage-drive-full.svg';
import upsellStorageGlobal from './upsell-storage-global.svg';
import upsellStorageIncrease from './upsell-storage-increase.svg';
import upsellStorageMail from './upsell-storage-mail.svg';

interface Props {
    app: APP_NAMES;
}

const StorageCard = ({
    className,
    header,
    usedSpace,
    maxSpace,
}: {
    className: string;
    header: ReactNode;
    usedSpace: number;
    maxSpace: number;
}) => {
    const humanUsedSpace = humanSize({ bytes: usedSpace });
    const humanMaxSpace = humanSize({ bytes: maxSpace });
    const value = Math.ceil(percentage(maxSpace, usedSpace));
    return (
        <div
            className={clsx(className, 'flex flex-column gap-6 border rounded p-6')}
            style={{ '--min-w-custom': '30em' }}
        >
            {header}
            <div className="pb-4">
                <div className="text-lg mb-2 flex items-center gap-1">
                    {getBoldFormattedText(c('storage_split: info').t`**${humanUsedSpace}** of ${humanMaxSpace}`)}
                    {value >= 100 && <Icon name="exclamation-circle-filled" className="color-danger shrink-0" />}
                </div>
                <Meter thin aria-hidden="true" value={value} />
            </div>
        </div>
    );
};

const getTryOut = (app: string) => {
    return c('storage_split: info').t`Try out ${app} to its full potential`;
};

const getDescription = ({ header, upgrade }: { header: ReactNode; upgrade: ReactNode }) => {
    return (
        <div>
            <div className="text-lg text-bold">{header}</div>
            <div>{upgrade}</div>
        </div>
    );
};

const getUpgrade = () => {
    return c('storage_split: info').t`Upgrade your plan to continue to use your account without interruptions.`;
};

const getDriveDanger = () => {
    return {
        icon: upsellStorageDrive,
        description: getDescription({
            header: getAppStorageFull(getAppStorage(DRIVE_SHORT_APP_NAME)),
            upgrade: getUpgrade(),
        }),
    };
};

const getBaseDanger = () => {
    return {
        icon: upsellStorageMail,
        description: getDescription({
            header: getAppStorageFull(getAppStorage(MAIL_SHORT_APP_NAME)),
            upgrade: getUpgrade(),
        }),
    };
};

const getConsiderUpgrade = () => {
    return c('storage_split: info')
        .t`Consider upgrading your plan to continue to use your account without interruptions.`;
};

const getDriveWarning = () => {
    return {
        icon: upsellStorageDrive,
        description: getDescription({
            header: getAppStorageAlmostFull(getAppStorage(DRIVE_SHORT_APP_NAME)),
            upgrade: getConsiderUpgrade(),
        }),
    };
};

const getBaseWarning = () => {
    return {
        icon: upsellStorageMail,
        description: getDescription({
            header: getAppStorageAlmostFull(getAppStorage(MAIL_SHORT_APP_NAME)),
            upgrade: getConsiderUpgrade(),
        }),
    };
};

const YourStorageSection = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const space = getSpace(user);
    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app });

    return (
        <SettingsSection>
            {(() => {
                const data = (() => {
                    if (details.drive.type === SpaceState.Danger && details.base.type === SpaceState.Danger) {
                        return {
                            icon: upsellStorageGlobal,
                            description: getDescription({
                                header: getStorageFull(),
                                upgrade: getUpgrade(),
                            }),
                        };
                    }

                    if (details.drive.type === SpaceState.Danger) {
                        return getDriveDanger();
                    }

                    if (details.base.type === SpaceState.Danger) {
                        return getBaseDanger();
                    }

                    if (details.drive.type === SpaceState.Warning && details.base.type === SpaceState.Warning) {
                        return app === APPS.PROTONDRIVE ? getDriveWarning() : getBaseWarning();
                    }

                    if (details.drive.type === SpaceState.Warning) {
                        return getDriveWarning();
                    }

                    if (details.base.type === SpaceState.Warning) {
                        return getBaseWarning();
                    }

                    const upgradePlan = c('storage_split: info').t`Upgrade your plan to increase your storage.`;
                    if (app === APPS.PROTONDRIVE) {
                        return {
                            icon: upsellStorageIncrease,
                            description: getDescription({
                                header: getTryOut(DRIVE_SHORT_APP_NAME),
                                upgrade: upgradePlan,
                            }),
                        };
                    }

                    if (app == APPS.PROTONMAIL || app == APPS.PROTONCALENDAR) {
                        return {
                            icon: upsellStorageIncrease,
                            description: getDescription({
                                header: getTryOut(MAIL_SHORT_APP_NAME),
                                upgrade: upgradePlan,
                            }),
                        };
                    }
                })();
                if (!data) {
                    return null;
                }
                return (
                    <div className="mb-6 mt-4">
                        <PromotionBanner
                            mode="banner"
                            rounded
                            contentCentered={false}
                            icon={<img width="40" src={data.icon} alt="" className="shrink-0" />}
                            description={data.description}
                            cta={
                                <ButtonLike
                                    as={SettingsLink}
                                    path={addUpsellPath(
                                        getUpgradePath({ user, subscription, plan }),
                                        getUpsellRefFromApp({
                                            app,
                                            feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
                                            component: UPSELL_COMPONENT.BANNER,
                                            fromApp: app,
                                        })
                                    )}
                                    type="button"
                                    color="norm"
                                    shape="ghost"
                                    className="text-bold"
                                    fullWidth
                                >
                                    {c('storage_split: info').t`Get more storage`}
                                </ButtonLike>
                            }
                        />
                    </div>
                );
            })()}
            <div className="flex gap-8 flex-column lg:flex-row">
                <StorageCard
                    className="lg:flex-1"
                    header={
                        <div>
                            <div>
                                <MailLogo variant="glyph-only" />
                                <CalendarLogo variant="glyph-only" />
                                <PassLogo variant="glyph-only" />
                                <WalletLogo variant="glyph-only" />
                            </div>
                            <div className="text-2xl text-bold">{getAppStorage(MAIL_SHORT_APP_NAME)}</div>
                        </div>
                    }
                    usedSpace={space.usedBaseSpace}
                    maxSpace={space.maxBaseSpace}
                />
                <StorageCard
                    className="lg:flex-1"
                    header={
                        <div>
                            <div>
                                <DriveLogo variant="glyph-only" />
                            </div>
                            <div className="text-2xl text-bold">{getAppStorage(DRIVE_SHORT_APP_NAME)}</div>
                        </div>
                    }
                    usedSpace={space.usedDriveSpace}
                    maxSpace={space.maxDriveSpace}
                />
            </div>
        </SettingsSection>
    );
};

export default YourStorageSection;
