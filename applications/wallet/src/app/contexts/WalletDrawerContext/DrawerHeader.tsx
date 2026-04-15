import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import clsx from '@proton/utils/clsx';

interface Props {
    title?: string;
    onClose: () => void;
    bg: 'bg-weak' | 'bg-norm';
}

export const DrawerHeader = ({ title, bg, onClose }: Props) => {
    return (
        <div className="flex flex-row mb-3 px-6 pt-6">
            {title && <div>{title}</div>}
            <div className="ml-auto">
                <Button
                    className={clsx('rounded-full border-none', bg === 'bg-norm' ? 'bg-weak' : 'bg-norm')}
                    icon
                    shape="ghost"
                    data-testid="modal:close"
                    onClick={onClose}
                >
                    <IcCrossBig className="modal-close-icon" alt={c('Action').t`Close`} />
                </Button>
            </div>
        </div>
    );
};
