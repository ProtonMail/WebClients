import React from 'react';
import { classnames } from 'react-components';

interface Props extends React.HTMLProps<HTMLDivElement> {
    larger?: boolean;
}

const Main = ({ children, className, larger, ...rest }: Props) => {
    return (
        <main
            className={classnames([
                'bg-white-dm sign-layout color-global-grey-dm relative no-scroll w100 max-w100 center',
                !larger ? 'mw48r' : '',
                className,
            ])}
            {...rest}
        >
            {children}
        </main>
    );
};

export default Main;
