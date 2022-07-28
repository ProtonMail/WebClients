import { useState } from 'react';

import { fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { AppLink, useConfig, useFeature, useUser } from '../..';
import { FeatureCode } from '../features';
import TopBanner from './TopBanner';

const ACCOUNT_CREATION_DATE_LIMIT = new Date('2022-07-15');

const DriveReleaseTopBanner = () => {
    const config = useConfig();
    const [user] = useUser();
    const [show, setShow] = useState(true);
    const displayFlag = useFeature(FeatureCode.TopBannerDisplayDriveRelease);
    const visitedFlag = useFeature(FeatureCode.TopBannerVisitedDriveRelease);

    if (!user.CreateTime) {
        return null;
    }

    const isAccountCreatedBeforeLimit = isBefore(fromUnixTime(user.CreateTime), ACCOUNT_CREATION_DATE_LIMIT);

    const handleClose = () => {
        setShow(false);
        void visitedFlag.update(true);
    };

    if (
        displayFlag.loading ||
        visitedFlag.loading ||
        config.APP_NAME !== APPS.PROTONMAIL ||
        // Account was created after limit
        !isAccountCreatedBeforeLimit ||
        // Can't display
        !displayFlag.feature?.Value ||
        // Already visited
        visitedFlag.feature?.Value === true
    ) {
        return null;
    }

    return show ? (
        <TopBanner className="bg-primary" onClose={handleClose}>
            <span className="mr0-5">{c('Spotlight')
                .t`${DRIVE_APP_NAME} is out of beta! Give your files the same security your emails get.`}</span>
            <AppLink
                onClick={() => {
                    handleClose();
                }}
                to="/?ref=drive-launch-top-banner"
                toApp={APPS.PROTONDRIVE}
            >{c('Spotlight').t`Try ${DRIVE_APP_NAME}`}</AppLink>
        </TopBanner>
    ) : null;
};

export default DriveReleaseTopBanner;
