import * as React from 'react';
import { classnames } from '@proton/components';

interface Props extends React.HTMLProps<HTMLDivElement> {
    larger?: boolean;
}

const Main = ({ children, className, larger, ...rest }: Props) => {
    return (
        <main
            className={classnames([
                'ui-standard color-norm bg-norm relative no-scroll w100 max-w100 center sign-layout',
                !larger ? 'mw30r' : '',
                className,
            ])}
            {...rest}
        >
            {children}
        </main>
    );
};

export default Main;
