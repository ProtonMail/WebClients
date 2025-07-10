import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcCross } from '@proton/icons';

import './SideBar.scss';

interface SideBarProps {
    children: React.ReactNode;
    onClose: () => void;
}

export const SideBar = ({ children, onClose }: SideBarProps) => {
    return (
        <div className="meet-side-bar bg-norm border border-norm flex flex-nowrap flex-column p-4 h-full w-full rounded-xl relative max-w-full z-1">
            <Button
                className="close-button absolute top-custom right-custom"
                style={{ '--top-custom': '0.5rem', '--right-custom': '0.5rem' }}
                aria-label={c('l10n_nightly Alt').t`Close`}
                onClick={onClose}
                shape="ghost"
                size="tiny"
            >
                <IcCross size={5} />
            </Button>
            {children}
        </div>
    );
};
