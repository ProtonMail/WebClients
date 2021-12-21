import { c } from 'ttag';

import oauthInstructionsWebm from '@proton/styles/assets/videos/easySwitch/oauth-instructions.webm';
import oauthInstructionsMp4 from '@proton/styles/assets/videos/easySwitch/oauth-instructions.mp4';

import { VideoInstructions } from '../../../components';

const IAOauthInstructionsStep = () => {
    // translator: full sentence: "Please note that in the next step you need to select all the permissions requested by the application to start your import"
    const boldNextStep = (
        <strong key="boldNextStep">{c('Import instructions emphasis')
            .t`in the next step you need to select all the permissions`}</strong>
    );

    // translator: full sentence: "Please note that in the next step you need to select all the permissions requested by the application to start your import"
    const instructions = c('Oauth instructions')
        .jt`Please note that ${boldNextStep} requested by the application to start your import.`;

    return (
        <>
            <div className="mb2">{instructions}</div>
            <div className="text-center mb1 relative">
                <VideoInstructions>
                    <source src={oauthInstructionsWebm} type="video/webm" />
                    <source src={oauthInstructionsMp4} type="video/mp4" />
                </VideoInstructions>
            </div>
        </>
    );
};

export default IAOauthInstructionsStep;
