import React from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';

export const NoResultsPlaceholder = () => {
    return (
        <div
            className="w-full h-custom flex items-center justify-center"
            style={{ ...(!isMobile() ? { '--h-custom': '16rem' } : {}) }}
        >
            <span className="color-hint">No results found</span>
        </div>
    );
};
