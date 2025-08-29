import { c } from 'ttag';

import { SidebarExpandButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
}

export const DriveExpandButton = (props: Props) => {
    const title = props.expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`;
    return (
        <SidebarExpandButton
            title={title}
            className={clsx(props.className, 'drive-sidebar--button-expand')}
            {...props}
        />
    );
};
