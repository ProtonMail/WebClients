import { memo } from 'react';
import IconRow, { IconRowProps } from './IconRow';

const MemoizedIconRow = (props: IconRowProps) => IconRow(props);

export default memo(MemoizedIconRow);
