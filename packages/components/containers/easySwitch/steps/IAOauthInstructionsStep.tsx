import { c } from 'ttag';

import oauthInstructionsWebm from '@proton/styles/assets/videos/easySwitch/oauth-instructions.webm';
import oauthInstructionsMp4 from '@proton/styles/assets/videos/easySwitch/oauth-instructions.mp4';

import { VideoInstructions } from '../../../components';

const IAOauthInstructionsStep = () => (
    <>
        <div className="mb2">
            {c('Oauth instructions')
                .t`Please note that you need to accept all the permissions requested by the application to be able to start your import.`}
        </div>
        <div className="text-center mb1 relative">
            <VideoInstructions>
                <source src={oauthInstructionsWebm} type="video/webm" />
                <source src={oauthInstructionsMp4} type="video/mp4" />
            </VideoInstructions>
        </div>
    </>
);

export default IAOauthInstructionsStep;
