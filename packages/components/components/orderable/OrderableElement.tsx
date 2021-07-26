import { SortableElement } from 'react-sortable-hoc';

interface Props {
    children: any;
}

export default SortableElement(({ children }: Props) => children);
