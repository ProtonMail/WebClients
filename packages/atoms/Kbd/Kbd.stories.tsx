import Kbd from './Kbd';
import mdx from './Kbd.mdx';

export default {
    component: Kbd,
    title: 'components/Kbd',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <Kbd shortcut="N" />;
