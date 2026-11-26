import { type ForwardRefRenderFunction, type ReactElement, type ReactNode, forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import clsx from '@proton/utils/clsx';

import { useIFrameAppController } from '../../../../../../../lib/components/Inline/IFrameApp';

type Props = {
    discardOnClose?: boolean;
    /** Prevents the header's close button from closing the toast:
     * `onClose` only. For views managing their own close sequence. */
    noClose?: boolean;
    extra?: ReactElement;
    wrapText?: boolean;
    title: ReactNode;
    onClose?: () => void;
    className?: string;
};

const ToastHeaderRender: ForwardRefRenderFunction<HTMLDivElement, Props> = (
    { wrapText, discardOnClose, noClose, extra, title, onClose, className },
    ref
) => {
    const controller = useIFrameAppController();

    return (
        <div
            className={clsx('flex flex-nowrap shrink-0 items-center justify-space-between gap-2', className)}
            ref={ref}
        >
            <h3
                className={clsx(
                    'flex flex-nowrap text-bold items-center gap-2 w-full ',
                    wrapText ? 'text-rg' : 'text-lg '
                )}
            >
                <PassIcon status={PassIconStatus.ACTIVE} size={5.5} className="shrink-0" />
                <span className={clsx(!wrapText && 'text-ellipsis')}>{title}</span>
            </h3>

            <div className="flex shrink-0 gap-1">
                {extra}
                <Button
                    key="close-button"
                    icon
                    pill
                    shape="solid"
                    color="weak"
                    size="small"
                    className="shrink-0"
                    onClick={() => {
                        onClose?.();
                        if (!noClose) controller.close({ discard: discardOnClose });
                    }}
                    title={c('Action').t`Cancel`}
                >
                    <IcCross alt={c('Action').t`Cancel`} size={4} />
                </Button>
            </div>
        </div>
    );
};

export const ToastHeader = forwardRef(ToastHeaderRender);
