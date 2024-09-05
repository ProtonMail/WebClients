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

export const IcBrandSafari = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    clipRule="evenodd"
                    d="M15.002 8A7 7 0 0 1 8 15a7 7 0 1 1 7-7Zm-6.533.683L2.99 12.137l4.354-4.795.188.225.748.89.189.226Zm-.19-.226 2.989-3.268-3.736 2.378-.188-.225 5.478-3.455L8.47 8.683l-.19-.226ZM8.148 1.7a.146.146 0 1 0-.292 0v1.167a.146.146 0 1 0 .292 0V1.7Zm-1.636.177a.146.146 0 1 0-.282.075l.158.591a.146.146 0 0 0 .282-.075l-.158-.591Zm3.261.075a.146.146 0 0 0-.281-.075l-.159.59a.146.146 0 1 0 .282.076l.158-.59Zm-4.795.52a.146.146 0 1 0-.253.145l.583 1.01a.146.146 0 1 0 .253-.145l-.583-1.01Zm6.3.145a.146.146 0 1 0-.252-.146l-.583 1.01a.146.146 0 1 0 .252.147l.584-1.01ZM12.56 3.65a.146.146 0 0 0-.206-.207l-.432.433a.146.146 0 0 0 .206.206l.432-.432Zm-8.91-.207a.146.146 0 1 0-.207.207l.433.432a.146.146 0 1 0 .206-.206l-.432-.433ZM2.617 4.724a.146.146 0 0 0-.146.253l1.01.583a.146.146 0 0 0 .147-.252l-1.01-.584Zm10.913.253a.146.146 0 0 0-.145-.253l-1.01.584a.146.146 0 1 0 .145.252l1.01-.583ZM1.954 6.229a.146.146 0 1 0-.076.282l.59.158a.146.146 0 0 0 .076-.282l-.59-.158Zm12.172.282a.146.146 0 0 0-.076-.282l-.59.159a.146.146 0 1 0 .075.281l.59-.158ZM1.7 7.855a.146.146 0 1 0 0 .292h1.167a.146.146 0 0 0 0-.292H1.7Zm11.435 0a.146.146 0 0 0 0 .292h1.167a.146.146 0 1 0 0-.292h-1.167Zm.399 1.477a.146.146 0 0 0-.076.282l.591.158a.146.146 0 0 0 .076-.281l-.591-.159Zm-10.99.282a.146.146 0 0 0-.076-.282l-.59.159a.146.146 0 0 0 .075.281l.59-.158Zm1.084 1.08a.146.146 0 1 0-.146-.253l-1.01.584a.146.146 0 0 0 .145.252l1.01-.583Zm8.892-.253a.146.146 0 1 0-.146.253l1.01.583a.146.146 0 1 0 .146-.252l-1.01-.584Zm-8.439 1.686a.146.146 0 0 0-.206-.207l-.433.433a.146.146 0 1 0 .207.206l.432-.432Zm8.046-.207a.146.146 0 1 0-.206.207l.432.432a.146.146 0 0 0 .206-.206l-.432-.432Zm-6.567.6a.146.146 0 1 0-.252-.146l-.584 1.01a.146.146 0 0 0 .253.146l.583-1.01Zm5.134-.146a.146.146 0 0 0-.253.146l.584 1.01a.146.146 0 0 0 .252-.146l-.583-1.01Zm-2.547.76a.146.146 0 0 0-.292 0v1.168a.146.146 0 1 0 .292 0v-1.167Zm1.467.324a.146.146 0 0 0-.282.076l.159.59a.146.146 0 0 0 .281-.075l-.158-.59Zm-2.945.076a.146.146 0 1 0-.281-.076l-.159.591a.146.146 0 1 0 .282.076l.158-.591Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
