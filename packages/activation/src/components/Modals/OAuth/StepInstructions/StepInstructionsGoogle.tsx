import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import VideoInstructions from '@proton/components/components/videoInstructions/VideoInstructions';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import oauthInstructionsMp4 from '@proton/styles/assets/videos/easySwitch/oauth-instructions.mp4';
import oauthInstructionsWebm from '@proton/styles/assets/videos/easySwitch/oauth-instructions.webm';

import { displayConfirmLeaveModal } from '../../../../logic/draft/imapDraft/imapDraft.actions';
import { changeOAuthStep, resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateProducts,
} from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { trackAccountImportEasySwitchInstructionsViewed } from '../../../../telemetry/accountImportFlow';

interface Props {
    triggerOAuth: () => void;
}

const StepInstructionsGoogle = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const products = useEasySwitchSelector(selectOauthImportStateProducts);

    useEffect(() => {
        trackAccountImportEasySwitchInstructionsViewed({ provider, products });
    }, []);

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

    const instructionsVideoAlt = c('Oauth instructions video alternative')
        .t`Select what ${BRAND_NAME} can access: view your email messages and settings, view and download your contacts, view and download all agendas you access from Google Calendar.`;

    return (
        <ModalTwo open onClose={handleQuit}>
            <ModalTwoHeader title={c('Title').t`Sign in and grant access`} />
            <ModalTwoContent>
                <div className="mb-8" data-testid="StepInstruction:modal">
                    {instructions}
                </div>
                <div className="mb-8">{instructionsVideo}</div>
                <div className="sr-only">{instructionsVideoAlt}</div>
                <div className="text-center mb-4 relative" aria-hidden="true">
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
                <Button color="norm" onClick={triggerOAuth} data-testid="StepInstruction:submit">
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepInstructionsGoogle;
