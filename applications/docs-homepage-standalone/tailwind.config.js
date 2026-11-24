/** @type {import('tailwindcss').Config} */
export default {
    // This app only takes Tailwind's preflight (src/tailwind.css has no utilities): the homepage module builds its own.
    content: { relative: true, files: ['./src/**/*.tsx'] },
};
