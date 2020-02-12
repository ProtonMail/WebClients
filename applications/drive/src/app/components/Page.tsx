import React, { useEffect, useRef } from 'react';
import { classnames, MainAreaContext } from 'react-components';
import { RouteComponentProps, withRouter } from 'react-router-dom';

interface PageProps extends RouteComponentProps {
    title: string;
    children: React.ReactNode;
}

const Page = ({ title, children }: PageProps) => {
    useEffect(() => {
        document.title = `${title} - ProtonDrive`;
    }, [title]);

    return <div className="flex-item-fluid reset4print">{children}</div>;
};

interface PageMainAreaProps {
    hasToolbar?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const PageMainArea = ({ children, hasToolbar, className }: PageMainAreaProps) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={mainAreaRef}
            className={classnames([hasToolbar ? `main-area--withToolbar` : `main-area`, 'reset4print', className])}
        >
            <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
        </div>
    );
};

export default withRouter(Page);
