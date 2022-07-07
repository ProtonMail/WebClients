import ButtonLike from './ButtonLike';

import mdx from './ButtonLike.mdx';

export default {
    component: ButtonLike,
    title: 'components/ButtonLike',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <ButtonLike />;

export const StoryWithoutCanvas = () => <div>I am a story without a canvas</div>;

export const StoryWithCanvas = () => <div>I am a story with a canvas</div>;
