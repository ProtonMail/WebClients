import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components/index';
import lumoAlert from '@proton/styles/assets/img/lumo/lumo-cat-alert.svg';

import { useLumoDispatch } from '../../redux/hooks';
import type { ConversationError } from '../../redux/slices/meta/errors';
import { dismissConversationError } from '../../redux/slices/meta/errors';
import { LUMO_API_ERRORS } from '../../types';
import ChatContainerItem from '../ChatContainerItem';

import './ErrorCard.scss';

const ErrorCard = ({
    error,
    index,
    onRetry,
}: {
    error: ConversationError;
    index: number;
    onRetry: (error: ConversationError) => void;
}) => {
    const dispatch = useLumoDispatch();

    const handleDismiss = () => {
        dispatch(
            dismissConversationError({
                conversationId: error.conversationId,
                index,
            })
        );
    };

    const handleRetry = () => {
        onRetry(error);
        handleDismiss();
    };

    const isRetriable = [
        LUMO_API_ERRORS.GENERATION_ERROR,
        LUMO_API_ERRORS.HIGH_DEMAND,
        LUMO_API_ERRORS.GENERATION_REJECTED,
        LUMO_API_ERRORS.STREAM_DISCONNECTED,
    ].includes(error.errorType);

    return (
        <ChatContainerItem className="error-card group-hover-opacity-container relative p-3 rounded-xl flex flex-column lg:flex-row flex-nowrap gap-2 mb-4">
            <div className="flex flex-row items-center mr-1 shrink-0">
                <img
                    className="w-custom h-custom mx-auto"
                    src={lumoAlert}
                    alt=""
                    style={{ '--w-custom': '3.5rem', '--h-custom': '3.5rem' }}
                />
            </div>
            <div className="flex flex-column flex-nowrap gap-2 lg:flex-1">
                <p className="error-card-title text-bold m-0">{error.errorTitle}</p>
                <p className="error-card-message m-0">{error.errorMessage}</p>
            </div>
            <div className="flex flex-row items-center mr-2">
                {isRetriable && (
                    <Button icon shape="ghost" className="shrink-0 error-card-button mx-auto" onClick={handleRetry}>
                        {c('collider_2025: Button').t`Retry`}
                    </Button>
                )}
                <Button
                    icon
                    shape="ghost"
                    className="error-card-dismiss-button rounded-full border-weak shrink-0 self-start absolute top-0 right-0 bg-norm group-hover:opacity-100"
                    onClick={handleDismiss}
                >
                    <Icon name="cross" color="danger" />
                </Button>
            </div>
        </ChatContainerItem>
    );
};

export default ErrorCard;
