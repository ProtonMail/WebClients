/**
 * Implements handlers for session-specific routes to manage concurrency
 * - Prevent concurrent requests to `refresh` route
 * - Queue concurrent requests to `setLocalKey` route
 * - Queue session lock requests to avoid parallel calls
 *
 * These measures mitigate potential pitfalls and race conditions that may arise
 * when users stress the web application by accessing it from multiple tabs.
 */
import { globToRegExp } from '@proton/pass/utils/url/utils';

import { fetchController } from './fetch-controller';
import { requestLockFactory, requestQueueFactory } from './utils';

const REFRESH_ROUTE = '/api/auth/refresh';
const SET_LOCAL_KEY_ROUTE = `/api/auth/v4/sessions/local/key`;
const SESSION_LOCK_ROUTES = globToRegExp('/api/pass/v1/user/session/lock/*');

export const matchRefreshRoute = (pathname: string): boolean => pathname === REFRESH_ROUTE;
export const matchLockRoute = (pathname: string): boolean => SESSION_LOCK_ROUTES.test(pathname);
export const matchSetLocalKeyRoute = (pathname: string): boolean => pathname === SET_LOCAL_KEY_ROUTE;

export const handleRefresh = fetchController.register(requestLockFactory());
export const handleLock = fetchController.register(requestQueueFactory());
export const handleSetLocalKey = fetchController.register(requestQueueFactory());
