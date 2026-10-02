import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { GUARD_ERROR_MESSAGES, type GuardError } from '@proton/payments/core/subscription/guard';
import clsx from '@proton/utils/clsx';

interface Props {
    errors: GuardError[];
    variant?: 'inline' | 'block';
    className?: string;
}

/**
 * Lists every subscription-guard refusal from a `subscription/check` response in one view.
 * Announced via aria-live; the Banner icon pairs with the text so meaning is not
 * carried by colour alone. Mapped codes render their localised copy; if no code is mapped, a
 * single generic message is shown instead. Placement is up to the caller — this component never
 * opens a modal.
 *
 * @param errors Guard errors from a single `subscription/check` response (normalized
 *   `GuardResult`). Renders nothing when empty.
 * @param variant Visual weight only: compact inline line vs. standalone block. Default: 'block'.
 * @param className Extra classes appended to the banner wrapper.
 */
export const GuardBanner = ({ errors, variant = 'block', className }: Props) => {
    if (!errors.length) {
        return null;
    }
    const errorsMessages = errors
        .map(({ Code }) => (Code === undefined ? undefined : GUARD_ERROR_MESSAGES.get(Code)))
        .filter((message): message is () => string => message !== undefined);

    return (
        <Banner
            aria-live="polite"
            variant={BannerVariants.DANGER}
            className={clsx(variant === 'inline' && 'text-sm', className)}
        >
            {errorsMessages.length > 0 && (
                <p className="mb-1">{c('Payments').t`To complete the action, fix the following:`}</p>
            )}
            <ul className="m-0 pl-4">
                {errorsMessages.length > 0 ? (
                    errorsMessages.map((error, index) => <li key={index}>{error()}</li>)
                ) : (
                    <li>{c('Payments').t`This subscription can’t be completed right now. Please try again.`}</li>
                )}
            </ul>
        </Banner>
    );
};
