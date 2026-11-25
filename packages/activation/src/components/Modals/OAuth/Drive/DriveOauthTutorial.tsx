import { c } from 'ttag';

import { BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { DRIVE_IMPORT_STEPS } from './driveImportSteps';
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
        <EasySwitchStepModal
            step={DRIVE_IMPORT_STEPS.grantAccess}
            onClose={handleClose}
            media={<AuthorizationIllustration />}
            primaryAction={{ label: c('Action').t`Sign in with Google`, onClick: () => triggerOAuth() }}
            title={c('Title').t`Sign in and grant access`}
        >
            <p className="color-weak m-0">{c('Info')
                .t`Next, sign in to your Google Account and allow ${BRAND_NAME} to access Google Drive. We'll import your files and folders to ${DRIVE_APP_NAME}.`}</p>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`${BRAND_NAME} only uses this access for the import. Google never gets access to your ${BRAND_NAME} account.`}</p>
        </EasySwitchStepModal>
    );
};
