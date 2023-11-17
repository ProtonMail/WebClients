import { ReactNode } from 'react';

import { Scroll } from '@proton/atoms/Scroll';

import './QuickSettings.scss';

interface Props {
    children: ReactNode;
}

const QuickSettingsMain = ({ children }: Props) => {
    return (
        <Scroll>
            <div className="h-full p-3 pt-0.5 flex-no-min-children flex-column flex-nowrap items-start gap-3">
                {children}
            </div>
        </Scroll>
    );
};

export default QuickSettingsMain;
