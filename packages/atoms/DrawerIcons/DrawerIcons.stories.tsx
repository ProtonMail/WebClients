import DrawerIcons from './DrawerIcons';
import mdx from './DrawerIcons.mdx';

export default {
    component: DrawerIcons,
    title: 'components/DrawerIcons',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <DrawerIcons />;

export const StoryWithoutCanvas = () => <div>I am a story without a canvas</div>;

export const StoryWithCanvas = () => <div>I am a story with a canvas</div>;
