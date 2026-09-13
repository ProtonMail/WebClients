import { c } from 'ttag';

import { VideoInstructions } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveStepModal } from './DriveStepModal';
import oauthInstructionsMp4 from './illustrations/google-oauth-tutorial.mp4';
import oauthInstructionsWebm from './illustrations/google-oauth-tutorial.webm';

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
                <VideoInstructions className="p-12 bg-weak">
                    <source src={oauthInstructionsWebm} type="video/webm" />
                    <source src={oauthInstructionsMp4} type="video/mp4" />
                </VideoInstructions>
            }
            secondaryAction={{ label: c('Action').t`Cancel`, onClick: handleClose, color: 'weak' }}
            primaryAction={{ label: c('Action').t`Sign in with Google`, onClick: () => triggerOAuth() }}
        >
            <h3 className="text-bold">{c('Title').t`Sign in to Google`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Next you'll need to sign in to your Google account and grant ${BRAND_NAME} access to your data.`}</p>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`For the import to work, you must select all requested items as shown in the GIF above.`}</p>
        </DriveStepModal>
    );
};
