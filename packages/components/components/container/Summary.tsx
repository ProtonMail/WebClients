import React from 'react';

import Icon from '../icon/Icon';

interface Props extends React.HTMLProps<HTMLElement> {
    children: React.ReactNode;
}

const Summary = ({ children, ...rest }: Props) => (
    <summary className="flex flex-nowrap" {...rest}>
        <Icon name="caret" className="summary-caret mr0-25 mt0-25 flex-item-noshrink" />
        <div className="flex-item-fluid">{children}</div>
    </summary>
);

export default Summary;
