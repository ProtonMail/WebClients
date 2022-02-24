import tinycolor from 'tinycolor2';

import genButtonShades from '../gen-button-shades';

const form = document.getElementById('form') as HTMLFormElement;
const input = document.getElementById('input') as HTMLInputElement;
const colors = document.getElementById('colors') as HTMLDivElement;

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const { value } = input;

    if (!value) {
        return;
    }

    const shades = genButtonShades(tinycolor(value), true);

    const children = shades.map((shade) => {
        const hex = shade.toHexString();

        const child = document.createElement('div');

        child.setAttribute('style', `background: ${hex}; padding: 24px;`);

        child.innerText = hex;

        return child;
    });

    colors.innerHTML = '';

    children.forEach(colors.appendChild.bind(colors));
});
