import ProtonLoader, { ProtonLoaderType } from './ProtonLoader';
import mdx from './ProtonLoader.mdx';

export default {
    component: ProtonLoader,
    title: 'components/ProtonLoader',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <>
        <div className="p-4">
            <ProtonLoader />
        </div>
        <br />
        <div className="p-4 ui-prominent bg-norm">
            <ProtonLoader type={ProtonLoaderType.Default} />
        </div>
    </>
);
