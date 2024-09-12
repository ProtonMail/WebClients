/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
 */
import React from 'react';

import type { IconSize } from '../types';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /**
     * The size of the icon
     * Refer to the sizing taxonomy: https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing
     */
    size?: IconSize;
}

export const IcCogDrawer = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path
                    fillRule="evenodd"
                    d="M8 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4ZM5.6 8a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-4.8 0Z"
                    clipRule="evenodd"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M13.916 11.946a.32.32 0 0 1-.057.373l-1.547 1.548a.32.32 0 0 1-.374.058l-1.132-.59a.723.723 0 0 0-.613-.017.725.725 0 0 0-.417.443l-.385 1.216a.32.32 0 0 1-.305.223H6.905a.32.32 0 0 1-.305-.223l-.385-1.216a.725.725 0 0 0-.417-.443.723.723 0 0 0-.613.017l-1.132.59a.32.32 0 0 1-.375-.058L2.132 12.32a.32.32 0 0 1-.058-.373l.59-1.134c.099-.19.1-.415.017-.613a.726.726 0 0 0-.444-.418l-1.214-.385A.32.32 0 0 1 .8 9.09V6.909c0-.14.09-.263.223-.305l1.214-.385a.726.726 0 0 0 .444-.418.724.724 0 0 0-.017-.613l-.59-1.134a.32.32 0 0 1 .058-.375L3.69 2.132a.32.32 0 0 1 .373-.057l1.132.59c.19.099.415.1.613.017a.725.725 0 0 0 .417-.443l.385-1.216A.32.32 0 0 1 6.914.8h2.18c.14 0 .264.09.306.224l.386 1.224c.063.203.22.361.416.443a.721.721 0 0 0 .612-.017l1.133-.59a.32.32 0 0 1 .374.058l1.547 1.548a.32.32 0 0 1 .057.373l-.589 1.134a.724.724 0 0 0-.017.613.726.726 0 0 0 .444.418l1.213.385a.32.32 0 0 1 .224.305v2.183a.32.32 0 0 1-.225.305l-1.22.379a.72.72 0 0 0-.446.416.718.718 0 0 0 .017.61l.59 1.135ZM9.013 13.52l-.279.88H7.256l-.278-.88a1.524 1.524 0 0 0-.872-.94 1.522 1.522 0 0 0-1.29.046l-.82.427-1.05-1.05.427-.822c.22-.421.21-.896.046-1.29-.163-.39-.49-.73-.94-.873l-.88-.278V7.26l.88-.278c.45-.143.777-.482.94-.873a1.524 1.524 0 0 0-.046-1.29l-.426-.821 1.057-1.05.82.426c.422.22.897.211 1.291.046.39-.163.73-.49.872-.94l.279-.88h1.477l.28.888c.141.45.48.778.87.941.395.165.87.174 1.29-.045l.821-.428 1.05 1.05-.428.821a1.52 1.52 0 0 0-.045 1.291c.163.39.49.73.94.873l.879.279v1.477l-.883.274a1.52 1.52 0 0 0-.946.872c-.165.393-.173.866.045 1.286l.428.824-1.049 1.05-.82-.428a1.522 1.522 0 0 0-1.29-.045c-.39.163-.73.49-.872.94Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
