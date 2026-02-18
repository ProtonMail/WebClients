import type { Meta, StoryObj } from '@storybook/react-webpack5';

import VideoInstructions from '@proton/components/components/videoInstructions/VideoInstructions';

import videoMp4 from '../../assets/videos/oauth-instructions.mp4';
import videoWebm from '../../assets/videos/oauth-instructions.webm';

const meta: Meta<typeof VideoInstructions> = {
    title: 'Components/Video Instructions',
    component: VideoInstructions,
    parameters: {
        docs: {
            description: {
                component:
                    'A video player component for displaying instructional videos. Accepts standard HTML video element props and source children.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof VideoInstructions>;

export const Default: Story = {
    render: () => (
        <div className="max-w-custom m-auto" style={{ '--max-w-custom': '50em' } as React.CSSProperties}>
            <VideoInstructions>
                <source src={videoWebm} type="video/webm" />
                <source src={videoMp4} type="video/mp4" />
            </VideoInstructions>
        </div>
    ),
};
