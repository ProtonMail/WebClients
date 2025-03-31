import { type FC, useEffect } from 'react';

export const AutoClose: FC = () => {
    useEffect(() => window.close(), []);
    return null;
};
