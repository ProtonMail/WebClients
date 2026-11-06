import type { ComponentType } from 'react';

const context = require.context('./', true, /^\.\/spaces\/Spaces(SignIn|Signup)\.tsx$/, 'sync');

const load = (name: string): ComponentType<any> | null => {
    const key = `./spaces/${name}.tsx`;
    return context.keys().includes(key) ? context(key).default : null;
};

// FIXME: render unconditionally when ready
export const SpacesSignIn = load('SpacesSignIn');
export const SpacesSignup = load('SpacesSignup');
