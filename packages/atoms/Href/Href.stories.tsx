import Href from './Href';
import mdx from './Href.mdx';

export default {
    component: Href,
    title: 'components/Href',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <Href href="https://proton.me">Visit the Proton website</Href>;
