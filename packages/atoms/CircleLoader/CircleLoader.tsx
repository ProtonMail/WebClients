import { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import generateUID from '../generateUID';

import './CircleLoader.scss';

export type CircleLoaderSize = 'small' | 'medium' | 'large';

export interface CircleLoaderProps extends ComponentPropsWithoutRef<'svg'> {
    size?: CircleLoaderSize;
    srLabelHidden?: Boolean;
}

const CircleLoader = ({ size, className, srLabelHidden, ...rest }: CircleLoaderProps) => {
    const uid = generateUID('circle-loader');

    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={clsx('circle-loader', size && `is-${size}`, className)}
                viewBox="0 0 16 16"
                data-testid="circle-loader"
                {...rest}
            >
                <defs>
                    <circle id={uid} cx="8" cy="8" r="7" />
                </defs>
                <use href={`#${uid}`} className="circle-loader-track" />
                <use href={`#${uid}`} className="circle-loader-circle" />
            </svg>
            {!srLabelHidden ? <span className="sr-only">{c('Info').t`Loading`}</span> : null}
        </>
    );
};

export default CircleLoader;
