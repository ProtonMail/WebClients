import React, { useEffect, useRef } from 'react';
import { classnames, MainAreaContext } from 'react-components';
import { RouteComponentProps, withRouter } from 'react-router-dom';

interface Props extends RouteComponentProps {
    title: string;
    toolbar?: React.ReactNode;
    children: React.ReactNode;
}

const Page = ({ title, toolbar, children }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    useEffect(() => {
        document.title = `${title} - ProtonDrive`;
    }, [title]);

    return (
        <div className="flex-item-fluid reset4print">
            {toolbar}
            <div
                ref={mainAreaRef}
                className={classnames([toolbar ? `main-area--withToolbar` : `main-area`, 'reset4print'])}
            >
                <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
            </div>
        </div>
    );
};

export default withRouter(Page);
