import { ComponentPropsWithRef } from 'react';

interface ScaleLabelProps extends ComponentPropsWithRef<'div'> {
    fromLabel: string;
    toLabel: string;
}

const ScaleLabel = ({ fromLabel, toLabel, ...rest }: ScaleLabelProps) => {
    return (
        <div className="flex justify-space-between items-start gap-4" {...rest}>
            <span className="text-sm m-0">{fromLabel}</span>
            <span className="text-sm m-0">{toLabel}</span>
        </div>
    );
};

export default ScaleLabel;
