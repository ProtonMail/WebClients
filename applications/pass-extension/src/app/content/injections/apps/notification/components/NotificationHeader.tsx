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
        <div className="flex flex-nowrap flex-item-noshrink flex-align-items-center flex-justify-space-between gap-2">
            <h3 className="flex text-bold text-lg flex-align-items-center gap-2">
                <PassIcon status={PassIconStatus.ACTIVE} size={22} />
                <span className="flex-item-fluid text-ellipsis">{title}</span>
            </h3>

            <div className="flex flex-item-noshrink gap-1">
                {extra}
                <Button
                    key="close-button"
                    icon
                    pill
                    shape="solid"
                    color="weak"
                    className="flex-item-noshrink"
                    onClick={() => onClose?.({ discard: true })}
                    title={c('Action').t`Cancel`}
                >
                    <Icon name="cross" alt={c('Action').t`Cancel`} size={16} />
                </Button>
            </div>
        </div>
    );
};
