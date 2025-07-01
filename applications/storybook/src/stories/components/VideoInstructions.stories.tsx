import { VideoInstructions } from '@proton/components';

import videoMp4 from '../../assets/videos/oauth-instructions.mp4';
import videoWebm from '../../assets/videos/oauth-instructions.webm';
import mdx from './VideoInstructions.mdx';

export default {
    component: VideoInstructions,
    title: 'Components/Video Instructions',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return (
        <div className="max-w-custom m-auto" style={{ '--max-w-custom': '50em' }}>
            <VideoInstructions>
                <source src={videoWebm} type="video/webm" />
                <source src={videoMp4} type="video/mp4" />
            </VideoInstructions>
        </div>
    );
};
