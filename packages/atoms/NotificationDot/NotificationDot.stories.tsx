import { ThemeColor } from '@proton/colors';



import { Card } from '..';
import NotificationDot from './NotificationDot';
import mdx from './NotificationDot.mdx';

export default {
    component: NotificationDot,
    title: 'components/NotificationDot',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <NotificationDot />;

export const Colors = () => (
    <div className="flex">
        {Object.values(ThemeColor).map((color) => (
            <NotificationDot className="mr-4" color={color} />
        ))}
    </div>
);

export const PositionHelper = () => (
    <>
        <Card className="relative mb-4">
            With helper
            <NotificationDot className="absolute top right notification-dot--top-right" />
        </Card>
        <Card className="relative">
            Without helper
            <NotificationDot className="absolute top right" />
        </Card>
    </>
);