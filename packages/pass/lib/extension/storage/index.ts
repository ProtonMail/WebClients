import { default as localStorage } from './local';
import { default as sessionStorage } from './session';

export const browserSessionStorage = sessionStorage;
export const browserLocalStorage = localStorage;
