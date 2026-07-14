import clsx from '@proton/utils/clsx';

/**
 * Hide an element while keeping its layout box, and make it `inert` so it stays non-interactive even
 * if the hiding classes are stripped in dev tools. Spreading the attribute avoids the
 * @ts-expect-error the JSX `inert=""` form needs.
 */
export const hiddenInertProps = (hidden: boolean) => ({
    className: clsx(hidden && 'visibility-hidden opacity-0'),
    ...(hidden ? { inert: '' } : {}),
});
