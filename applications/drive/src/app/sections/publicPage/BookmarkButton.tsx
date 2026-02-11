import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Spotlight } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useSignupFlowModal } from '../../components/modals/SignupFlowModal/SignupFlowModal';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicBookmark } from './usePublicBookmark';

interface BookmarkButtonProps {
    customPassword?: string;
}

export function BookmarkButton({ customPassword }: BookmarkButtonProps) {
    const {
        isBookmarked,
        error,
        isLoading: isBookmarkLoading,
        addBookmark,
        openInDrive,
        showSaveForLaterSpotlight,
    } = usePublicBookmark();
    const isLoggedIn = usePublicAuthStore(useShallow((state) => state.isLoggedIn));
    const [isAdding, withAdding] = useLoading();
    const [signupFlowModal, showSignupFlowModal] = useSignupFlowModal();

    const buttonText = isBookmarked
        ? c('drive:action').t`Open in ${DRIVE_SHORT_APP_NAME}`
        : c('drive:action').t`Save for later`;

    const handleClick = async () => {
        if (!isLoggedIn) {
            void countActionWithTelemetry(Actions.AddToBookmarkTriggeredModal);
            showSignupFlowModal({ customPassword });
        } else if (isBookmarked) {
            openInDrive();
        } else {
            await withAdding(() => addBookmark(customPassword));
        }
    };

    return (
        <>
            <Spotlight
                show={showSaveForLaterSpotlight}
                content={c('Spotlight')
                    .t`A link to this item has been saved in your drive. You can access it later in the 'Shared with me' section.`}
                originalPlacement="bottom-end"
            >
                <Tooltip
                    title={
                        isBookmarked
                            ? ''
                            : c('Tooltip').t`Add this shared file to your ${DRIVE_APP_NAME} for easy access later.`
                    }
                >
                    <Button
                        shape="solid"
                        color="weak"
                        loading={isBookmarkLoading || isAdding}
                        onClick={handleClick}
                        // Disable bookmark in case we had issue while loading bookmark
                        // In case we still got the info that it's already bookmarked,
                        // we can ignore as button will do redirect
                        disabled={error && !isBookmarkLoading && !isBookmarked}
                        data-testid="save-in-drive-button"
                        className="flex items-center"
                    >
                        {isAdding ? c('Info').t`Saving...` : buttonText}
                    </Button>
                </Tooltip>
            </Spotlight>
            {signupFlowModal}
        </>
    );
}
