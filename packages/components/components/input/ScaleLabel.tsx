import { ComponentPropsWithRef } from 'react';

interface ScaleLabelProps extends ComponentPropsWithRef<'div'> {
    fromLabel: string;
    toLabel: string;
}

const ScaleLabel = ({ fromLabel, toLabel, ...rest }: ScaleLabelProps) => {
    return (
        <div className="flex flex-justify-space-between flex-align-items-start flex-gap-1" {...rest}>
            <span className="text-sm m0">{fromLabel}</span>
            <span className="text-sm m0">{toLabel}</span>
        </div>
    );
};

export default ScaleLabel;
