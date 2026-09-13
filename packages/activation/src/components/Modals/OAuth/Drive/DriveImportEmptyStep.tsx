import { c } from 'ttag';

import { changeOAuthStep, resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveStepModal } from './DriveStepModal';
import image from './illustrations/illustration-google-failed.webp';

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
            media={<img src={image} alt="" />}
            secondaryAction={{ label: c('Action').t`Close`, onClick: handleClose }}
            primaryAction={{ label: c('Action').t`Try again`, onClick: handleRetry }}
        >
            <h3 className="text-bold">{c('Title').t`We could not find anything to import`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`We do not support importing photos, Google Docs, Sheets and Slides. Please make sure that your Google Drive is not empty.`}</p>
        </DriveStepModal>
    );
};
