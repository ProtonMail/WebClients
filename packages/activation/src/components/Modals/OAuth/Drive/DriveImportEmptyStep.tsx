import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { changeOAuthStep, resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveStepModal } from './DriveStepModal';
import { TransferSourceErrorIllustration } from './illustrations/TransferSourceErrorIllustration';

export const DriveImportEmptyStep = () => {
    const dispatch = useEasySwitchDispatch();

    const handleClose = () => {
        dispatch(resetOauthDraft());
    };

    const handleRetry = () => {
        dispatch(changeOAuthStep('instructions'));
    };

    return (
        <DriveStepModal
            onClose={handleClose}
            media={<TransferSourceErrorIllustration />}
            secondaryAction={{ label: c('Action').t`Close`, onClick: handleClose }}
            primaryAction={{ label: c('Action').t`Try again`, onClick: handleRetry }}
        >
            <h3 className="text-bold">{c('Title').t`We could not find anything to import`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Your Google Drive may be empty or contain only files that are not supported.`}</p>
            <p className="mt-2 mb-0">
                <Href href={getKnowledgeBaseUrl('/drive-easy-switch-troubleshooting')}>{c('Link').t`Learn more`}</Href>
            </p>
        </DriveStepModal>
    );
};
