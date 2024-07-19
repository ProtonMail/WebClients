import { memo } from 'react';

import type { IconRowProps } from './IconRow';
import IconRow from './IconRow';

const MemoizedIconRow = (props: IconRowProps) => IconRow(props);

export default memo(MemoizedIconRow);
