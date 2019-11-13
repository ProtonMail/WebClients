import React, { useEffect } from 'react';
import { classnames } from 'react-components';

interface Props {
    title: string;
    toolbar?: React.ReactNode;
    children: React.ReactNode;
}

const Page = ({ title, toolbar, children }: Props) => {
    useEffect(() => {
        document.title = `${title} - ProtonDrive`;
    }, [title]);

    return (
        <div className="content flex-item-fluid reset4print">
            {toolbar}
            <div
                className={classnames([
                    toolbar ? `main-area--withToolbar` : `main-area`,
                    'flex-item-fluid flex reset4print'
                ])}
            >
                {children}
            </div>
        </div>
    );
};

export default Page;
