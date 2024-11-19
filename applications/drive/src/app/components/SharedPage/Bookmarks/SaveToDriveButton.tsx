import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Spotlight, Tooltip } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { usePublicSessionUser } from '../../../store';
import {
    needPublicRedirectSpotlight,
    publicRedirectSpotlightWasShown,
    setPublicRedirectSpotlightToShown,
} from '../../../utils/publicRedirectSpotlight';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { useSignupFlowModal } from '../../modals/SignupFlowModal/SignupFlowModal';

interface Props {
    onClick: () => Promise<void>;
    alreadyBookmarked: boolean;
    className?: string;
    loading?: boolean;
    customPassword?: string;
}
export const SaveToDriveButton = ({ className, alreadyBookmarked, customPassword, loading, onClick }: Props) => {
    const [isAdding, withAdding] = useLoading();
    const [signupFlowModal, showSignupFlowModal] = useSignupFlowModal();
    const [showSpotlight, setShowSpotlight] = useState(needPublicRedirectSpotlight());
    const { user } = usePublicSessionUser();
    const buttonText = alreadyBookmarked
        ? c('drive:action').t`Open in ${DRIVE_SHORT_APP_NAME}`
        : c('drive:action').t`Save for later`;

    useEffect(() => {
        if (showSpotlight) {
            setPublicRedirectSpotlightToShown();
        }
    }, [showSpotlight]);
    return (
        <>
            <Spotlight
                show={showSpotlight}
                content={c('Spotlight')
                    .t`A link to this item has been saved in your drive. You can access it later in the 'Shared with me' section.`}
                originalPlacement="bottom-end"
            >
                <Tooltip
                    title={
                        alreadyBookmarked
                            ? ''
                            : c('Tooltip').t`Add this shared file to your ${DRIVE_APP_NAME} for easy access later.`
                    }
                >
                    <Button
                        loading={loading || isAdding}
                        className={clsx('flex items-center', className)}
                        onClick={async () => {
                            if (!user) {
                                countActionWithTelemetry(Actions.AddToBookmarkTriggeredModal);
                                showSignupFlowModal({ customPassword });
                            } else if (alreadyBookmarked) {
                                openNewTab(getAppHref('/shared-with-me', APPS.PROTONDRIVE));
                            } else {
                                await withAdding(onClick);
                                if (!publicRedirectSpotlightWasShown()) {
                                    setShowSpotlight(true);
                                    setPublicRedirectSpotlightToShown();
                                }
                            }
                        }}
                        color="norm"
                        data-testid="save-in-drive-button"
                    >
                        {!isAdding && <Icon className="mr-2" name="folder-arrow-in" />}
                        {isAdding ? c('Info').t`Saving...` : buttonText}
                    </Button>
                </Tooltip>
            </Spotlight>
            {signupFlowModal}
        </>
    );
};
