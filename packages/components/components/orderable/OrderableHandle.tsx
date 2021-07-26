import { SortableHandle } from 'react-sortable-hoc';

interface Props {
    children: any;
}

export default SortableHandle(({ children }: Props) => children);
