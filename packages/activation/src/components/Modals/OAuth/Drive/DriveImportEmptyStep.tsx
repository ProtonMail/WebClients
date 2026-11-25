import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { changeOAuthStep, resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
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
        <EasySwitchStepModal
            onClose={handleClose}
            media={<TransferSourceErrorIllustration />}
            primaryAction={{ label: c('Action').t`Try again`, onClick: handleRetry }}
            title={c('Title').t`Nothing to import`}
        >
            <p className="color-weak m-0">{c('Info')
                .t`Your Google Drive may be empty or contain only files that are not supported.`}</p>
            <p className="mt-2 mb-0">
                <Href href={getKnowledgeBaseUrl('/drive-easy-switch-troubleshooting')}>{c('Link').t`Learn more`}</Href>
            </p>
        </EasySwitchStepModal>
    );
};
