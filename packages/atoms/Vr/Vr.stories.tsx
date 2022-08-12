import Vr from './Vr';
import mdx from './Vr.mdx';

export default {
    component: Vr,
    title: 'components/Vr',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <div style={{ display: 'flex', justifyContent: 'center', height: 50 }}>
        <Vr />
    </div>
);
