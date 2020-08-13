import React from 'react';
import { classnames } from '../../helpers';

interface Props {
    className?: string;
}
const ToolbarSeparator = ({ className }: Props) => <span className={classnames(['toolbar-separator', className])} />;

export default ToolbarSeparator;
