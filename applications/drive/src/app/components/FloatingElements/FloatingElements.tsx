import { useDrawerWidth } from '@proton/components';

import './FloatingElements.scss';

export const FloatingElements = ({ children }: { children: React.ReactNode }) => {
    const drawerWidth = useDrawerWidth();
    return (
        <div
            className="floating-elements flex fixed bottom-0 flex-column w-full items-end right-custom max-w-custom"
            style={{
                '--right-custom': `${drawerWidth}px`,
                '--max-w-custom': '50em',
            }}
        >
            {children}
        </div>
    );
};
