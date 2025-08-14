import React from 'react';
import ReactDOM from 'react-dom/client';

import AppGuard from './entrypoint/AppGuard';

// import MSWController from './mocks/MSWController';

import './index.scss';

ReactDOM.createRoot(document.querySelector('.app-root')!).render(
    <React.StrictMode>
        <>
            <AppGuard />

            {/* MSWController is only visible in development */}
            {/* <MSWController /> */}
        </>
    </React.StrictMode>
);
