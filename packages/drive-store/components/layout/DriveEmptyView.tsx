import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';

import EmptyViewContainer from '@proton/components/containers/app/EmptyViewContainer';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

type MaybeString = string | false | null | undefined;
type Props = PropsWithChildren<{
    image: string;
    title: string;
    subtitle?: MaybeString | MaybeString[];

    dataTestId?: string;
    onClick?: () => void;
}>;

const filterSubtitles = (subtitle: MaybeString | MaybeString[]): string[] => {
    if (Array.isArray(subtitle)) {
        return subtitle.filter(isTruthy);
    }

    if (subtitle) {
        return [subtitle];
    }

    return [];
};

/**
 * Common template for empty views across Drive.
 */
export const DriveEmptyView = forwardRef<HTMLDivElement, Props>(
    ({ image, title, subtitle, dataTestId, onClick, children }, ref) => (
        // onClick is used for context menu, so we don't need to care about keyboard events
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div ref={ref} onClick={onClick} className="flex w-full flex flex-1 overflow-auto">
            <EmptyViewContainer
                imageProps={{
                    src: image,
                    role: 'presentation',
                    'aria-hidden': true,
                    alt: '',
                }}
                data-testid={dataTestId}
            >
                <div className={clsx(!!children && 'mb-8')}>
                    <h3 className="text-bold">{title}</h3>
                    {filterSubtitles(subtitle).map((text) => (
                        <p key={text} className={'color-weak m-0 mt-2'}>
                            {text}
                        </p>
                    ))}
                </div>
                {children}
            </EmptyViewContainer>
        </div>
    )
);
DriveEmptyView.displayName = 'DriveEmptyView';
