import { c } from 'ttag';

import { BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveStepModal } from './DriveStepModal';
import { AuthorizationIllustration } from './illustrations/AuthorizationIllustration';

interface Props {
    triggerOAuth: (scopes?: string[]) => void;
}

export const DriveOauthTutorial = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const handleClose = () => {
        dispatch(resetOauthDraft());
    };

    return (
        <DriveStepModal
            onClose={handleClose}
            media={
                <div className="p-10 bg-weak rounded">
                    <AuthorizationIllustration />
                </div>
            }
            secondaryAction={{ label: c('Action').t`Cancel`, onClick: handleClose, color: 'weak' }}
            primaryAction={{ label: c('Action').t`Sign in with Google`, onClick: () => triggerOAuth() }}
        >
            <h3 className="text-bold">{c('Title').t`Sign in and grant access`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Next, sign in to your Google Account and allow ${BRAND_NAME} to access Google Drive. We'll import your files and folders to ${DRIVE_APP_NAME}.`}</p>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`${BRAND_NAME} only uses this access for the import. Google never gets access to your ${BRAND_NAME} account.`}</p>
        </DriveStepModal>
    );
};
