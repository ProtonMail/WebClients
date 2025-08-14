// import React, { useEffect, useState } from 'react';

// import { Button } from '@proton/atoms';

// import { worker } from './browser';

// const MSW_STORAGE_KEY = 'dev-msw-enabled';
// // MSW service worker typically ends with 'mockServiceWorker.js'
// const MSW_WORKER_URL = '/mockServiceWorker.js';

// const MSWController: React.FC = () => {
//     // Only read from localStorage in development
//     const [isMswEnabled, setIsMswEnabled] = useState(() => {
//         if (process.env.NODE_ENV === 'development') {
//             return localStorage.getItem(MSW_STORAGE_KEY) !== 'false';
//         }
//         return false;
//     });

//     useEffect(() => {
//         const enableMSW = async () => {
//             try {
//                 if (isMswEnabled) {
//                     // Only unregister MSW service worker if it exists
//                     if ('serviceWorker' in navigator) {
//                         const registrations = await navigator.serviceWorker.getRegistrations();
//                         const mswRegistration = registrations.find((registration) =>
//                             registration.active?.scriptURL.endsWith(MSW_WORKER_URL)
//                         );

//                         if (mswRegistration) {
//                             await mswRegistration.unregister();
//                         }
//                     }

//                     // Start MSW with fresh registration
//                     await worker.start({
//                         onUnhandledRequest: 'bypass',
//                         serviceWorker: {
//                             url: MSW_WORKER_URL,
//                         },
//                     });
//                     console.log('🔶 Mock Service Worker Enabled');
//                 } else {
//                     // Only stop and unregister MSW service worker
//                     if ('serviceWorker' in navigator) {
//                         const registrations = await navigator.serviceWorker.getRegistrations();
//                         const mswRegistration = registrations.find((registration) =>
//                             registration.active?.scriptURL.endsWith(MSW_WORKER_URL)
//                         );

//                         if (mswRegistration) {
//                             await worker.stop();
//                             await mswRegistration.unregister();
//                             // Force reload to ensure clean state
//                             window.location.reload();
//                             console.log('🔶 Mock Service Worker Disabled');
//                         }
//                     }
//                 }
//             } catch (error) {
//                 console.error('🔶 Error managing Mock Service Worker', error);
//                 // Reset state on error
//                 setIsMswEnabled(false);
//                 localStorage.setItem(MSW_STORAGE_KEY, 'false');
//             }
//         };

//         if (process.env.NODE_ENV === 'development') {
//             void enableMSW();
//         }

//         // Cleanup on unmount - only stop MSW
//         return () => {
//             if (process.env.NODE_ENV === 'development' && isMswEnabled) {
//                 void worker.stop();
//             }
//         };
//     }, [isMswEnabled]);

//     if (process.env.NODE_ENV !== 'development') {
//         return null;
//     }

//     const toggleMSW = () => {
//         const newState = !isMswEnabled;
//         setIsMswEnabled(newState);
//         localStorage.setItem(MSW_STORAGE_KEY, String(newState));
//     };

//     return (
//         <Button
//             className="fixed bottom-2 right-2 z-9999 shadow-raised"
//             style={{
//                 top: '10px',
//                 right: '50%',
//             }}
//             shape="outline"
//             color={isMswEnabled ? 'success' : 'danger'}
//             onClick={toggleMSW}
//         >
//             Mock Chat API: {isMswEnabled ? 'ON' : 'OFF'}
//         </Button>
//     );
// };

// export default MSWController;
