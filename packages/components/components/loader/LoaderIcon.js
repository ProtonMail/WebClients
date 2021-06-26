import React from 'react';
import CircleLoader from './CircleLoader';

const LoaderIcon = () => (
    <div className="p1" aria-busy="true">
        <CircleLoader />
    </div>
);

export default LoaderIcon;
