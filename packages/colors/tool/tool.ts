import tinycolor, { Instance } from 'tinycolor2';

import genAccentShades from '../gen-accent-shades';
import genButtonShades from '../gen-button-shades';

const form = document.getElementById('form') as HTMLFormElement;
const input = document.getElementById('input') as HTMLInputElement;
const light = document.getElementById('light') as HTMLDivElement;
const dark = document.getElementById('dark') as HTMLDivElement;
const accent = document.getElementById('accent') as HTMLDivElement;

function Color(color: Instance) {
    const hex = color.toHexString();

    const child = document.createElement('div');

    child.classList.add('color');

    const textColor = tinycolor.mostReadable(hex, ['white', 'black']);

    child.setAttribute('style', `background: ${hex}; color: ${textColor.toHexString()}`);

    child.innerText = hex;

    return child;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const { value } = input;

    if (!value) {
        return;
    }

    const lightShades = genButtonShades(tinycolor(value), true);
    light.innerHTML = '';
    lightShades.map(Color).forEach(light.appendChild.bind(light));

    const darkShades = genButtonShades(tinycolor(value), false);
    dark.innerHTML = '';
    darkShades.map(Color).forEach(dark.appendChild.bind(dark));

    const accentShades = genAccentShades(tinycolor(value));
    accent.innerHTML = '';
    accentShades.map(Color).forEach(accent.appendChild.bind(accent));
});
