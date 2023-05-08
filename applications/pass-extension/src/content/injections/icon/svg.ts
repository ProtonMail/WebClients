import { createElement } from '@proton/pass/utils/dom';

import { ICON_ROOT_CLASSNAME, ICON_SVG } from '../../constants';

export const createLockIcon = (): HTMLDivElement => {
    const lockIcon = createElement<HTMLDivElement>({
        type: 'div',
        classNames: [ICON_ROOT_CLASSNAME, ICON_SVG],
    });

    lockIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
            <g>
                <path fill-rule="evenodd" d="M5.2 5H5a3 3 0 0 1 6 0H5.2ZM4 5.02V5a4 4 0 1 1 8 0v.02c.392.023.67.077.908.198a2 2 0 0 1 .874.874C14 6.52 14 7.08 14 8.2v3.6c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C12.48 15 11.92 15 10.8 15H5.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C2 13.48 2 12.92 2 11.8V8.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874c.238-.121.516-.175.908-.199Zm4.47 4.863a1 1 0 1 0-.94 0l-.437 1.744a.3.3 0 0 0 .291.373h1.232a.3.3 0 0 0 .29-.373l-.435-1.744Z"/>
            </g>
       </svg>
    `;

    return lockIcon;
};
