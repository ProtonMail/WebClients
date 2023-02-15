import { c } from 'ttag';

import { displayConfirmLeaveModal } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { changeOAuthStep, resetOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms/Button';
import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    VideoInstructions,
} from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import oauthInstructionsMp4 from '@proton/styles/assets/videos/easySwitch/oauth-instructions.mp4';
import oauthInstructionsWebm from '@proton/styles/assets/videos/easySwitch/oauth-instructions.webm';

interface Props {
    triggerOAuth: () => void;
}

const StepInstructionsGoogle = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const handleQuit = () => {
        dispatch(displayConfirmLeaveModal(false));
        dispatch(resetOauthDraft());
    };

    const handleBack = () => {
        dispatch(changeOAuthStep('products'));
    };

    const instructions = c('Oauth instructions')
        .t`Next you'll need to sign in to your Google account and grant ${BRAND_NAME} access to your data.`;

    const instructionsVideo = c('Oauth instructions video')
        .t`For the import to work, you must select all requested items as shown in the GIF.`;

    return (
        <ModalTwo open onClose={handleQuit}>
            <ModalTwoHeader title={c('Title').t`Sign in and grant access`} />
            <ModalTwoContent>
                <div className="mb2" data-testid="StepInstruction:modal">
                    {instructions}
                </div>
                <div className="mb2">{instructionsVideo}</div>
                <div className="text-center mb1 relative">
                    <VideoInstructions>
                        <source src={oauthInstructionsWebm} type="video/webm" />
                        <source src={oauthInstructionsMp4} type="video/mp4" />
                    </VideoInstructions>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="outline" onClick={handleBack} data-testid="StepInstruction:back">
                    {c('Action').t`Back`}
                </Button>
                <PrimaryButton onClick={triggerOAuth} data-testid="StepInstruction:submit">{c('Action')
                    .t`Continue`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepInstructionsGoogle;
