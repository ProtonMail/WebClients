export type AppLock = 'none' | 'password' | 'biometrics';
export type AppLockDTO = { mode: 'password'; password: string } | { mode: Exclude<AppLock, 'password'> };
