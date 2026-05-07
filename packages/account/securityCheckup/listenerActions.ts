import { createAction } from '@reduxjs/toolkit';

export const securityCheckupListenerStarted = createAction('securityCheckup/started', (payload: { href: string }) => ({
    payload,
}));
export const securityCheckupListenerStopped = createAction('securityCheckup/stopped');
