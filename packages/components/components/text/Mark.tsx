import React, { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    value?: string;
}

const Mark = ({ children, value }: Props) => {
    if (!value || typeof children !== 'string') {
        return children;
    }

    const splitted = children.split(new RegExp(value, 'i'));

    if (splitted.length < 2) {
        // Not found
        return children;
    }

    return splitted.reduce((acc: ReactNode[], v, index) => {
        acc.push(v);
        if (index < splitted.length - 1) {
            const currentLength = acc.join('').length;
            const insert = children.substring(currentLength, currentLength + value.length);
            acc.push(<mark>{insert}</mark>);
        }
        return acc;
    }, []);
};

export default Mark;
