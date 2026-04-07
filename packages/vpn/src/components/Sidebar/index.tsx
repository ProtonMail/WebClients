import type { NavResolved } from '@proton/nav/types/nav';

import { Branch } from './Branch';
import { Leaf } from './Leaf';
import { Root } from './Root';
import { SidebarView } from './View';

type Props = {
    routes: NavResolved;
};

export const Sidebar = ({ routes }: Props) => {
    return (
        <SidebarView items={routes.items}>
            {(item) => {
                if (item.meta?.group) {
                    return <Root key={item.id} item={item} />;
                }
                if (item.children) {
                    return <Branch key={item.id} item={item} />;
                }
                return <Leaf key={item.id} item={item} />;
            }}
        </SidebarView>
    );
};

export { FeedbackModal } from './FeedbackModal';
