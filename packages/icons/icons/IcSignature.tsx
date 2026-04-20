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

export const IcSignature = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M7.768 1.708a.6.6 0 0 1 .396.013c.178.07.278.21.325.33.041.11.045.214.042.284a1.6 1.6 0 0 1-.086.428c-.178.55-.645 1.44-1.279 2.39-.62.93-1.427 1.956-2.332 2.83q-.122.405-.215.81c-.258 1.129-.34 2.224-.258 3.207H14.5a.5.5 0 1 1 0 1H4.51c.103.467.248.897.437 1.276a.5.5 0 0 1-.894.448A6.7 6.7 0 0 1 3.489 13H1.5a.5.5 0 0 1 0-1h1.858a11.4 11.4 0 0 1 .185-2.942c-.611.426-1.258.761-1.922.927a.5.5 0 0 1-.242-.97c.845-.21 1.731-.794 2.58-1.58.613-1.898 1.675-3.775 3.188-5.289.134-.134.266-.25.39-.329a1 1 0 0 1 .23-.109"></path>
                    <path d="M10.117 7.469c.291 0 .487.179.597.328.11.148.192.339.26.545.254.76.48 1.297.723 1.589.112.134.198.178.255.192.053.013.15.017.325-.07a.5.5 0 0 1 .447.894c-.326.163-.666.23-1.004.149-.333-.08-.591-.286-.791-.526-.368-.441-.636-1.12-.876-1.832-.127.218-.27.5-.445.837-.197.377-.426.804-.692 1.202a2.7 2.7 0 0 1-.412.501c-.13.117-.329.253-.582.253a.72.72 0 0 1-.589-.324 1.4 1.4 0 0 1-.193-.46c-.076-.303-.108-.69-.124-1.07a19 19 0 0 1-.014-.577c-.36.471-.774 1.136-1.067 1.648a.501.501 0 0 1-.87-.496c.337-.59.855-1.42 1.3-1.958a3.5 3.5 0 0 1 .343-.367 1.2 1.2 0 0 1 .432-.264.629.629 0 0 1 .719.255c.123.187.141.414.141.582 0 .377 0 .773.016 1.136.01.235.026.443.049.613l.02-.026c.233-.351.442-.737.636-1.11.187-.36.373-.73.543-1.003.085-.136.183-.276.296-.387.103-.102.293-.254.557-.254M13.5 9a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1"></path>
                </svg>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
