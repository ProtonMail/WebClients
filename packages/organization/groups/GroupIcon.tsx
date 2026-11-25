import { IcShareNode } from '@proton/icons/icons/IcShareNode';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import type { IconSize } from '@proton/icons/types';

interface Props {
    isScimGroup?: boolean;
    className?: string;
    size?: IconSize;
}

const GroupIcon = ({ isScimGroup = false, className, size }: Props) => {
    if (isScimGroup) {
        // Mirror the icon to indicate sync direction from identity provider
        return <IcShareNode className={className} size={size} style={{ transform: 'scaleX(-1)' }} />;
    }
    return <IcUsers className={className} size={size} />;
};

export default GroupIcon;
