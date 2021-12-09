import { VideoInstructions } from '@proton/components';

import { getTitle } from '../../helpers/title';

import videoWebm from '../../assets/videos/oauth-instructions.webm';
import videoMp4 from '../../assets/videos/oauth-instructions.mp4';

import mdx from './VideoInstructions.mdx';

export default {
    component: VideoInstructions,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return (
        <div className="max-w50e mauto">
            <VideoInstructions
                sources={[
                    {
                        src: videoWebm,
                        format: 'webm',
                    },
                    {
                        src: videoMp4,
                        format: 'mp4',
                    },
                ]}
            />
        </div>
    );
};
