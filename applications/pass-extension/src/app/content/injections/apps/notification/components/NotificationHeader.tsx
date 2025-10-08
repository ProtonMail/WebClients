import { type ForwardRefRenderFunction, type ReactElement, type ReactNode, forwardRef } from 'react';

import { useIFrameAppController } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';

type Props = {
    discardOnClose?: boolean;
    extra?: ReactElement;
    title: ReactNode;
    onClose?: () => void;
};

const NotificationHeaderRender: ForwardRefRenderFunction<HTMLDivElement, Props> = (
    { discardOnClose, extra, title, onClose },
    ref
) => {
    const controller = useIFrameAppController();

    return (
        <div className="flex flex-nowrap shrink-0 items-center justify-space-between gap-2" ref={ref}>
            <h3 className="flex flex-nowrap text-bold text-lg items-center gap-2 w-full">
                <PassIcon status={PassIconStatus.ACTIVE} size={5.5} className="shrink-0" />
                <span className="text-ellipsis">{title}</span>
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
                        controller.close({ discard: discardOnClose });
                    }}
                    title={c('Action').t`Cancel`}
                >
                    <Icon name="cross" alt={c('Action').t`Cancel`} size={4} />
                </Button>
            </div>
        </div>
    );
};

export const NotificationHeader = forwardRef(NotificationHeaderRender);
