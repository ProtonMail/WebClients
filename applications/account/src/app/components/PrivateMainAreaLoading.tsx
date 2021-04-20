import React from 'react';
import { Loader, PrivateMainArea } from 'react-components';

const PrivateMainAreaLoading = () => {
    return (
        <PrivateMainArea>
            <Loader size="small" className="p2" />
        </PrivateMainArea>
    );
};

export default PrivateMainAreaLoading;
