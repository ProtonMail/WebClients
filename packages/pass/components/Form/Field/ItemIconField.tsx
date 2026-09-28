import { type FC, useRef, useState } from 'react';

import type { FieldProps } from 'formik';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Icon from '@proton/components/components/icon/Icon';
import { IcCrossSmall } from '@proton/icons/icons/IcCrossSmall';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import type { IconName, IconSize } from '@proton/icons/types';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import {
    ITEM_ICON_ACCEPTED_TYPES,
    ITEM_ICON_MAX_INPUT_SIZE,
    ITEM_ICON_MAX_LENGTH,
    ItemIconError,
    type ItemIconErrorReason,
    getItemIconSrc,
    processItemIcon,
} from '../../../lib/items/item-icon';
import type { Maybe } from '../../../types';
import { IconBox, getIconSizePx } from '../../Layout/Icon/IconBox';

type Props = FieldProps<Maybe<string>> & {
    className?: string;
    /** Fallback icon when no custom icon is set */
    icon: IconName;
    size?: IconSize;
};

/** SVGs are stored as-is (not rasterized), so their effective limit is
 * the maximum stored data URI length minus the base64 overhead */
const getMaxInputSize = (file: File): number =>
    file.type === 'image/svg+xml' ? Math.floor((ITEM_ICON_MAX_LENGTH * 3) / 4) : ITEM_ICON_MAX_INPUT_SIZE;

const getItemIconErrorMessage = (reason: ItemIconErrorReason, file: File): string => {
    switch (reason) {
        case 'type':
            return c('Error').t`Please select a PNG, JPEG, WebP or SVG image.`;
        case 'size': {
            const maxSize = humanSize({ bytes: getMaxInputSize(file), unit: 'KB', fraction: 0 });
            return c('Error').t`Image is too large. Maximum size is ${maxSize}.`;
        }
        case 'decode':
            return c('Error').t`Could not read this image.`;
    }
};

/** Binds a custom item icon (base64 data URI) to a string form field */
export const ItemIconField: FC<Props> = ({ className, field, form, meta, icon, size = 5 }) => {
    const { createNotification } = useNotifications();
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    const iconSrc = getItemIconSrc(field.value);
    const iconSizePx = getIconSizePx(size);
    /** ie: an invalid icon value coming from another client or an import */
    const error = meta.error;

    const onFileSelect = async (file: File) => {
        setBusy(true);

        try {
            const dataUri = await processItemIcon(file);
            await form.setFieldValue(field.name, dataUri);
        } catch (err) {
            const reason = err instanceof ItemIconError ? err.reason : 'decode';
            createNotification({ type: 'error', text: getItemIconErrorMessage(reason, file) });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={clsx('relative shrink-0 ml-3 my-2', className)}>
            <input
                ref={inputRef}
                type="file"
                accept={ITEM_ICON_ACCEPTED_TYPES.join(',')}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(evt) => {
                    const file = evt.target.files?.[0];
                    /** Reset so selecting the same file again re-triggers `onChange` */
                    evt.target.value = '';
                    if (file) void onFileSelect(file);
                }}
            />

            <button
                type="button"
                className="interactive-pseudo-inset rounded-xl"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                aria-busy={busy}
                title={error ?? c('Action').t`Set custom icon`}
                aria-label={c('Action').t`Set custom icon`}
            >
                <IconBox mode={iconSrc ? 'image' : 'icon'} size={size} pill>
                    {iconSrc && (
                        <img
                            src={iconSrc}
                            alt=""
                            className="w-custom h-custom absolute inset-center object-cover"
                            style={{ '--w-custom': `${iconSizePx}px`, '--h-custom': `${iconSizePx}px` }}
                        />
                    )}

                    {!iconSrc && error && (
                        <IcExclamationCircleFilled
                            className="absolute inset-center"
                            color="var(--signal-warning)"
                            size={size}
                        />
                    )}

                    {!iconSrc && !error && (
                        <Icon
                            className={clsx('absolute inset-center', busy && 'opacity-50')}
                            color="var(--interaction-norm)"
                            name={icon}
                            size={size}
                        />
                    )}

                    {busy && <CircleLoader size="small" className="color-primary absolute inset-center" />}
                </IconBox>
            </button>

            {/* Also allow clearing a value which does not pass `getItemIconSrc` */}
            {field.value && !busy && (
                <Button
                    icon
                    pill
                    size="small"
                    shape="solid"
                    color="danger"
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '-0.25rem', '--right-custom': '-0.25rem' }}
                    onClick={() => form.setFieldValue(field.name, undefined)}
                    title={c('Action').t`Remove custom icon`}
                    aria-label={c('Action').t`Remove custom icon`}
                >
                    <IcCrossSmall size={3} />
                </Button>
            )}
        </div>
    );
};
