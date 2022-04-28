import NotificationDot from './NotificationDot';
import { Card } from '..';

import mdx from './NotificationDot.mdx';

export default {
    component: NotificationDot,
    title: 'components/NotificationDot',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <NotificationDot color="warning" />;

export const Colors = () => (
    <div className="flex">
        <NotificationDot color="warning" className="mr1" />
        <NotificationDot color="danger" />
    </div>
);

export const PositionHelper = () => (
    <>
        <Card className="relative mb1">
            With helper
            <NotificationDot className="absolute top right notification-dot--top-right" color="warning" />
        </Card>
        <Card className="relative">
            Without helper
            <NotificationDot className="absolute top right" color="warning" />
        </Card>
    </>
);
