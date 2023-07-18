import type { VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';

import { PassIcon } from '../../../../../shared/components/icon/PassIcon';
import type { IFrameCloseOptions } from '../../../../types';

type Props = { title: string; onClose?: (options?: IFrameCloseOptions) => void };

export const NotificationHeader: VFC<Props> = ({ title, onClose }) => {
    return (
        <div className="flex flex-nowrap flex-item-noshrink flex-align-items-center flex-justify-space-between">
            <h3 className="flex text-bold text-2xl flex-align-items-center gap-3">
                <PassIcon status={PassIconStatus.ACTIVE} size={24} /> {title}
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
