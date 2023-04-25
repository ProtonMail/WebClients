import CircleLoader from './CircleLoader';
import mdx from './CircleLoader.mdx';


export default {
    component: CircleLoader,
    title: 'components/CircleLoader',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <>
        <CircleLoader />
        <br />
        <CircleLoader size="medium" className="color-primary" />
        <br />
        <CircleLoader size="large" className="color-danger" />
    </>
);

export const Sizes = () => (
    <div className="block">
        <div>Small</div>
        <CircleLoader />

        <div className="mt-8">Medium</div>
        <CircleLoader size="medium" />

        <div className="mt-8">Large</div>
        <CircleLoader size="large" />
    </div>
);