import { ComponentProps, useEffect, useState } from 'react';

import { differenceInMilliseconds } from 'date-fns';

import { SECOND } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../Button';

import './CoolDownButton.scss';

interface Props extends ComponentProps<typeof CoreButton> {
    max?: number;
    buttonClassName?: string;
    start?: Date;
    end?: Date;
}

const MAX = 100;

export const CoolDownButton = ({ className, buttonClassName, start, end, ...rest }: Props) => {
    const [progress, setProgress] = useState<number>();
    const coolDownDuration = start && end && differenceInMilliseconds(end, start);

    useEffect(() => {
        if (coolDownDuration && end) {
            const i = setInterval(() => {
                const remainingDuration = differenceInMilliseconds(end, new Date());
                setProgress(((coolDownDuration - remainingDuration) / coolDownDuration) * 100);
            }, 0.5 * SECOND);
            return () => clearInterval(i);
        }
    }, [coolDownDuration, end]);

    return (
        <div className={clsx('relative', className)}>
            {progress && progress < MAX ? (
                <div className="cooldown-circle-progress" style={{ '--progress-value': progress }}>
                    <progress id="css" max={MAX} value={progress}></progress>
                </div>
            ) : null}

            <CoreButton {...rest} className={buttonClassName} disabled={Boolean(progress && progress < MAX)} />
        </div>
    );
};
