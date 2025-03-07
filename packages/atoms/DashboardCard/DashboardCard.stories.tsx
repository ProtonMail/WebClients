import DashboardCard from './DashboardCard';
import mdx from './DashboardCard.mdx';

export default {
    component: DashboardCard,
    title: 'components/DashboardCard',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <div className="bg-weak p-8">
        <DashboardCard>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam
            laborum aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
            voluptatibus?
        </DashboardCard>
    </div>
);
