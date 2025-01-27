import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import * as storage from '@proton/shared/lib/helpers/storage';
import clsx from '@proton/utils/clsx';

import { usePublicSessionUser } from '../../../store';
import {
    needPublicRedirectSpotlight,
    publicRedirectSpotlightWasShown,
    setPublicRedirectSpotlightToShown,
} from '../../../utils/publicRedirectSpotlight';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { useSignupFlowModal } from '../../modals/SignupFlowModal/SignupFlowModal';
import { SaveForLaterSpotlight, SaveForLaterSpotlightVersion } from './SaveForLaterSpotlight';

interface Props {
    onClick: () => Promise<void>;
    alreadyBookmarked: boolean;
    className?: string;
    loading?: boolean;
    customPassword?: string;
}

export const PUBLIC_SHARE_BOOKMARK_SPOTLIGHT_KEY = 'public-share-bookmark-spotlight';

export const SaveForLaterButton = ({ className, alreadyBookmarked, customPassword, loading, onClick }: Props) => {
    const [isAdding, withAdding] = useLoading();
    const [signupFlowModal, showSignupFlowModal] = useSignupFlowModal();
    const { user } = usePublicSessionUser();
    const [spotlightVersion, setSpotlightVersion] = useState(SaveForLaterSpotlightVersion.HIDE);
    const buttonText = alreadyBookmarked
        ? c('drive:action').t`Open in ${DRIVE_SHORT_APP_NAME}`
        : c('drive:action').t`Save for later`;

    useEffect(() => {
        if (!!user) {
            if (needPublicRedirectSpotlight()) {
                setSpotlightVersion(SaveForLaterSpotlightVersion.BOOKMARKED);
                setPublicRedirectSpotlightToShown();
            }
        } else if (!storage.getItem(PUBLIC_SHARE_BOOKMARK_SPOTLIGHT_KEY)) {
            setSpotlightVersion(SaveForLaterSpotlightVersion.UPSELL);
            storage.setItem(PUBLIC_SHARE_BOOKMARK_SPOTLIGHT_KEY, 'true');
        }
    }, [user]);

    return (
        <>
            <SaveForLaterSpotlight spotlightVersion={spotlightVersion}>
                <Tooltip
                    title={
                        alreadyBookmarked
                            ? ''
                            : c('Tooltip').t`Add this shared file to your ${DRIVE_APP_NAME} for easy access later.`
                    }
                >
                    <Button
                        loading={loading || isAdding}
                        className={clsx(
                            'flex gap-2 py-2 items-start justify-center text-left flex-column md:gap-4 md:py-3',
                            className
                        )}
                        onClick={async () => {
                            if (!user) {
                                void countActionWithTelemetry(Actions.AddToBookmarkTriggeredModal);
                                showSignupFlowModal({ customPassword });
                            } else if (alreadyBookmarked) {
                                openNewTab(getAppHref('/shared-with-me', APPS.PROTONDRIVE));
                            } else {
                                await withAdding(onClick);
                                if (!publicRedirectSpotlightWasShown()) {
                                    setPublicRedirectSpotlightToShown();
                                    setSpotlightVersion(SaveForLaterSpotlightVersion.BOOKMARKED);
                                }
                            }
                        }}
                        color="norm"
                        data-testid="save-in-drive-button"
                    >
                        <Icon name="folder-arrow-in" />
                        {isAdding ? c('Info').t`Saving...` : buttonText}
                    </Button>
                </Tooltip>
            </SaveForLaterSpotlight>
            {signupFlowModal}
        </>
    );
};
