import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../../atoms';

interface Props {
    title?: string;
    onClose: () => void;
    bg: 'bg-weak' | 'bg-norm';
}

export const DrawerHeader = ({ title, bg, onClose }: Props) => {
    return (
        <div className="flex flex-row mb-3">
            {title && <div>{title}</div>}
            <div className="ml-auto">
                <CoreButton
                    onClick={() => onClose()}
                    icon
                    className={clsx('rounded-full border-none', bg === 'bg-norm' ? 'bg-weak' : 'bg-norm')}
                >
                    <Icon name="cross" className="color-hint" size={5} />
                </CoreButton>
            </div>
        </div>
    );
};
