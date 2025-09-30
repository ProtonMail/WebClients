import Meter from '@proton/components/components/progress/Meter';

import { WavyMeter } from '../progress/WavyMeter';

import './SidebarStorageMeter.scss';

export default function SidebarStorageMeter({
    label,
    value,
    wavy = false,
}: {
    label: string;
    value: number;
    wavy?: boolean;
}) {
    if (wavy) {
        return <WavyMeter />;
    }
    return <Meter thin label={label} value={value} className="sidebar-meter-storage" />;
}
