import type { FunctionComponent, PropsWithChildren } from 'react';

declare module 'react' {
    type FC17<P = {}> = FunctionComponent<PropsWithChildren<P>>;
    type VFC17<P = {}> = FunctionComponent<P>;
}
