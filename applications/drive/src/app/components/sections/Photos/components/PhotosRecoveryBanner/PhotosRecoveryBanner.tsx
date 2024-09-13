import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { TopBanner } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { usePhotosRecovery } from '../../../../../store';
import type { RECOVERY_STATE } from '../../../../../store/_photos/usePhotosRecovery';

const getPhotosRecoveryProgressText = (
    recoveryState: RECOVERY_STATE,
    countOfUnrecoveredLinksLeft: number,
    countOfFailedLinks: number
) => {
    const baseText = c('Info').t`Restoring Photos... Please keep the tab open`;

    if (recoveryState === 'READY') {
        return c('Info').t`Restore Photos`;
    }

    if (recoveryState === 'FAILED') {
        return c('Info').t`An issue occurred during the restore process.`;
    }

    if (recoveryState === 'SUCCEED') {
        return c('Info').t`Photos have been successfully recovered.`;
    }

    const errorMessage = !!countOfFailedLinks
        ? c('Failed').ngettext(msgid`${countOfFailedLinks} failed`, `${countOfFailedLinks} failed`, countOfFailedLinks)
        : '';
    if (countOfUnrecoveredLinksLeft) {
        return `${baseText}: ${c('Success').ngettext(
            msgid`${countOfUnrecoveredLinksLeft} left`,
            `${countOfUnrecoveredLinksLeft} left`,
            countOfUnrecoveredLinksLeft
        )} ${errorMessage}`;
    }
    return `${baseText}.`;
};

const PhotosRecoveryBanner = () => {
    const {
        start,
        state: recoveryState,
        countOfUnrecoveredLinksLeft,
        countOfFailedLinks,
        needsRecovery,
    } = usePhotosRecovery();

    const [showBanner, setShowBanner] = useState<boolean>(false);

    useEffect(() => {
        setShowBanner(needsRecovery);
    }, [needsRecovery]);

    if (!showBanner) {
        return null;
    }
    return (
        <TopBanner
            className={clsx(
                recoveryState === 'SUCCEED' && 'bg-success',
                recoveryState === 'FAILED' && 'bg-danger',
                recoveryState !== 'FAILED' && recoveryState !== 'SUCCEED' && 'bg-warning'
            )}
        >
            <div className="flex items-center justify-center">
                <span className="mr-2 py-1 inline-block">
                    {getPhotosRecoveryProgressText(recoveryState, countOfUnrecoveredLinksLeft, countOfFailedLinks)}
                </span>
                {recoveryState === 'READY' && (
                    <Button size="small" onClick={start}>
                        {c('Action').t`Start`}
                    </Button>
                )}
                {recoveryState === 'SUCCEED' && (
                    <Button size="small" onClick={() => setShowBanner(false)}>
                        {c('Action').t`Ok`}
                    </Button>
                )}
                {recoveryState === 'FAILED' && (
                    <Button size="small" onClick={start}>
                        {c('Action').t`Retry`}
                    </Button>
                )}
                {recoveryState !== 'SUCCEED' && recoveryState !== 'FAILED' && recoveryState !== 'READY' && (
                    <CircleLoader />
                )}
            </div>
        </TopBanner>
    );
};

export default PhotosRecoveryBanner;
