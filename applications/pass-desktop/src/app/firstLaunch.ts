export const FIRST_LAUNCH_KEY = 'pass::first_launch_complete';
export const isFirstLaunch = () => localStorage.getItem(FIRST_LAUNCH_KEY) !== '1';
export const dismissFirstLaunch = () => localStorage.setItem(FIRST_LAUNCH_KEY, '1');
