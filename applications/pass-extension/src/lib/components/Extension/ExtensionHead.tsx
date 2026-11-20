import { type FC, useEffect } from 'react';

export const ExtensionHead: FC<{ title: string }> = ({ title }) => {
    useEffect(() => {
        document.title = title;
    }, [title]);

    return null;
};
