import Avatar, { AvatarProps } from './Avatar';
import mdx from './Avatar.mdx';

export default {
    component: Avatar,
    title: 'components/Avatar',
    parameters: { docs: { page: mdx } },
};

export const Playground = ({ ...args }) => <Avatar {...args}>PM</Avatar>;

const args: AvatarProps<'span'> = {};

Playground.args = args;

export const Basic = () => <Avatar>HF</Avatar>;
