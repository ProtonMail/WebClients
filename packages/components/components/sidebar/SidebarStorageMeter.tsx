import clsx from '@proton/utils/clsx';

import { Meter } from '../progress';

import './SidebarStorageMeter.scss';

interface Props {
    label: string;
    value: number;
    className?: string;
}

const SidebarStorageMeter = ({ label, value, className }: Props) => {
    return <Meter thin label={label} value={value} className={clsx('sidebar-meter-storage', className)} />;
};

export default SidebarStorageMeter;
