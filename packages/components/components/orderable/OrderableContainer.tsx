import { SortableContainer } from 'react-sortable-hoc';

interface Props {
    children: any;
}

export default SortableContainer(({ children }: Props) => children);
