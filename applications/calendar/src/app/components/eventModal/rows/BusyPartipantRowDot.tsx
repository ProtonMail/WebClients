import type { CSSProperties } from 'react';

import { CircleLoader } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    display: 'loader' | 'half-circle' | 'circle' | 'bordered-circle';
    color: string | undefined;
    tooltipText: string;
    onClick: () => void;
    classname?: string;
}

const BusyParticipantRowDot = ({ color, display, tooltipText, onClick, classname }: Props) => {
    if (display === 'loader') {
        return (
            <Tooltip title={tooltipText}>
                <div className="flex">
                    <CircleLoader
                        size="tiny"
                        className="m-auto"
                        style={{ color: color || 'black' }}
                        onClick={onClick}
                    />
                </div>
            </Tooltip>
        );
    }

    const colorStyle = ((): CSSProperties => {
        if (display === 'half-circle') {
            return {
                backgroundColor: 'transparent',
            };
        }

        if (display === 'bordered-circle') {
            return {
                border: `0.0625rem solid ${color}`,
            };
        }

        return {
            backgroundColor: color,
        };
    })();

    return (
        <Tooltip title={tooltipText}>
            <div
                className={clsx('m-auto relative flex rounded-full', classname)}
                style={{
                    width: '0.625rem',
                    height: '0.625rem',
                    ...colorStyle,
                }}
                onClick={onClick}
            >
                {display === 'half-circle' && (
                    <Icon name={'circle-half-filled'} size={2.5} className={clsx('opacity-70 rotateZ-45')} />
                )}
            </div>
        </Tooltip>
    );
};

export default BusyParticipantRowDot;
