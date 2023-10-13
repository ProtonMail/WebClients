import type { VFC } from 'react';

import type { IFrameCloseOptions } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { PassIcon } from '@proton/pass/components/Layout/Icon/PassIcon';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';

type Props = { title: string; onClose?: (options?: IFrameCloseOptions) => void };

export const NotificationHeader: VFC<Props> = ({ title, onClose }) => {
    return (
        <div className="flex flex-nowrap flex-item-noshrink flex-align-items-center flex-justify-space-between">
            <h3 className="flex text-bold text-2xl flex-align-items-center gap-3">
                <PassIcon status={PassIconStatus.ACTIVE} size={24} />
                <span className="flex-item-fluid text-ellipsis">{title}</span>
            </h3>

            <Button
                key="close-button"
                icon
                pill
                shape="solid"
                color="weak"
                onClick={() => onClose?.({ discard: true })}
                title={c('Action').t`Cancel`}
            >
                <Icon name="cross" alt={c('Action').t`Cancel`} />
            </Button>
        </div>
    );
};
