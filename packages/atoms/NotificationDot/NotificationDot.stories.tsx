import { ThemeColor } from '@proton/colors';

import NotificationDot from './NotificationDot';
import { Card } from '..';

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
            <NotificationDot className="mr1" color={color} />
        ))}
    </div>
);

export const PositionHelper = () => (
    <>
        <Card className="relative mb1">
            With helper
            <NotificationDot className="absolute top right notification-dot--top-right" />
        </Card>
        <Card className="relative">
            Without helper
            <NotificationDot className="absolute top right" />
        </Card>
    </>
);
