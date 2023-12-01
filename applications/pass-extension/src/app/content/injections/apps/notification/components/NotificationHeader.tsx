import type { ReactElement, VFC } from 'react';

import type { IFrameCloseOptions } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';

type Props = { extra?: ReactElement; title: string; onClose?: (options?: IFrameCloseOptions) => void };

export const NotificationHeader: VFC<Props> = ({ extra, title, onClose }) => {
    return (
        <div className="flex flex-nowrap shrink-0 items-center justify-space-between gap-2">
            <h3 className="flex text-bold text-lg items-center gap-2">
                <PassIcon status={PassIconStatus.ACTIVE} size={22} />
                <span className="flex-1 text-ellipsis">{title}</span>
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
                    onClick={() => onClose?.({ discard: true })}
                    title={c('Action').t`Cancel`}
                >
                    <Icon name="cross" alt={c('Action').t`Cancel`} size={16} />
                </Button>
            </div>
        </div>
    );
};
