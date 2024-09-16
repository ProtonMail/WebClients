import type { ReactNode } from 'react';

import { Scroll } from '@proton/atoms';

interface Props {
    children: ReactNode;
}

const DrawerAppScrollContainer = ({ children }: Props) => {
    return (
        <Scroll>
            <div className="h-full p-3 pt-0.5 flex *:min-size-auto flex-column flex-nowrap items-start gap-3">
                {children}
            </div>
        </Scroll>
    );
};

export default DrawerAppScrollContainer;
