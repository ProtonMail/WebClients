import type { FocusEventHandler, MouseEventHandler } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { RecipientType } from '../../../models/address';

interface Props {
    type: Exclude<RecipientType, 'ToList'>;
    classNames?: string;
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    onFocus?: FocusEventHandler<HTMLButtonElement>;
    title?: string;
}

const AddressesCCButton = ({ type, onClick, onFocus, disabled, classNames }: Props) => {
    const title = (() => {
        if (type === 'CCList') {
            return c('Action').t`Carbon Copy`;
        }
        if (type === 'BCCList') {
            return c('Action').t`Blind Carbon Copy`;
        }
    })();
    const tooltipTitle = (() => {
        if (type === 'CCList') {
            return c('Action').t`Add Cc recipients`;
        }
        if (type === 'BCCList') {
            return c('Action').t`Add Bcc recipients`;
        }
    })();
    const dataTestId = (() => {
        if (type === 'CCList') {
            return 'composer:recipients:cc-button';
        }
        if (type === 'BCCList') {
            return 'composer:recipients:bcc-button';
        }
    })();
    const content = (() => {
        if (type === 'CCList') {
            return 'CC';
        }
        if (type === 'BCCList') {
            return 'BCC';
        }
    })();

    return (
        <Tooltip title={tooltipTitle}>
            <Button
                color="norm"
                shape="ghost"
                size="small"
                tabIndex={-1}
                icon
                title={title}
                onClick={onClick}
                onFocus={onFocus}
                disabled={disabled}
                data-testid={dataTestId}
                className={clsx('text-left text-no-decoration text-strong relative', classNames)}
            >
                {content}
            </Button>
        </Tooltip>
    );
};

export default AddressesCCButton;
