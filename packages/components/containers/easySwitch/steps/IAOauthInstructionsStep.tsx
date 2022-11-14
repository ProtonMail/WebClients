import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { IAOauthModalModel } from '@proton/shared/lib/interfaces/EasySwitch';
import oauthInstructionsMp4 from '@proton/styles/assets/videos/easySwitch/oauth-instructions.mp4';
import oauthInstructionsWebm from '@proton/styles/assets/videos/easySwitch/oauth-instructions.webm';

import { VideoInstructions } from '../../../components';

interface Props {
    modalModel: IAOauthModalModel;
}

const IAOauthInstructionsStep = ({ modalModel }: Props) => {
    const instructions = c('Oauth instructions')
        .t`Next you'll need to sign in to your Google account and grant ${BRAND_NAME} access to your data.`;

    const instructionsVideo = c('Oauth instructions video')
        .t`For the import to work, you must select all requested items as shown in the GIF.`;

    return (
        <>
            {!modalModel.oauthProps && <div className="mb2">{instructions}</div>}
            <div className="mb2">{instructionsVideo}</div>
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
