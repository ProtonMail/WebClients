import { useEffect } from 'react';

import { c } from 'ttag';

import { Banner, InlineLinkButton } from '@proton/atoms';
import { useApi } from '@proton/components';
import type { EventInvitationError } from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { INVITATION_ERROR_TYPE } from '@proton/shared/lib/calendar/icsSurgery/errors/icsSurgeryErrorTypes';

import { sendInviteErrorTelemetryReport } from '../../../../helpers/calendar/invite';

const { DECRYPTION_ERROR, FETCHING_ERROR, UPDATING_ERROR, CANCELLATION_ERROR } = INVITATION_ERROR_TYPE;

interface Props {
    error: EventInvitationError;
    onReload: () => void;
}

const tryAgainErrorSet = new Set([DECRYPTION_ERROR, FETCHING_ERROR, UPDATING_ERROR, CANCELLATION_ERROR]);

export const ExtraEventErrorBanner = ({ error, onReload }: Props) => {
    const api = useApi();
    const canTryAgain = tryAgainErrorSet.has(error.type);

    useEffect(() => {
        void sendInviteErrorTelemetryReport({
            error: error,
            api,
            hash: error.hashedIcs,
        });
    }, []);

    return (
        <Banner
            variant="danger"
            className="mb-2"
            action={
                canTryAgain ? (
                    <span className="shrink-0 flex">
                        <InlineLinkButton onClick={onReload}>{c('Action').t`Try again`}</InlineLinkButton>
                    </span>
                ) : undefined
            }
        >
            {error.message}
        </Banner>
    );
};
