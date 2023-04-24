import { HTMLProps, ReactNode } from 'react';



import Icon from '../icon/Icon';

interface Props extends HTMLProps<HTMLElement> {
    children: ReactNode;
}

const Summary = ({ children, ...rest }: Props) => (
    // Safari can't set up summary tag as a flex container, tsssss... https://bugs.webkit.org/show_bug.cgi?id=190065
    <summary {...rest}>
        <div className="flex flex-nowrap">
            <Icon name="chevron-down" className="summary-caret mr-1 mt-1 flex-item-noshrink" />
            <div className="flex-item-fluid">{children}</div>
        </div>
    </summary>
);

export default Summary;