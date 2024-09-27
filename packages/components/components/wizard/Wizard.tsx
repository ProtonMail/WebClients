import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

interface Props {
    // current step
    step: number;
    // steps
    steps: string[];
    // hide text for steps
    hideText?: boolean;
}

const Wizard = ({ step = 0, steps = [], hideText = false }: Props) => {
    return (
        <div
            className={clsx([
                'wizard-container relative pt-0 pb-4 mb-4',
                hideText && 'wizard-container--no-text-displayed',
            ])}
        >
            <ul className="wizard mt-0 unstyled flex flex-nowrap justify-space-between">
                {steps.map((text = '', index) => {
                    return (
                        <li
                            key={index.toString()}
                            className={clsx(['wizard-item', index < step && 'is-complete'])}
                            aria-current={index === step ? 'step' : undefined}
                            title={text}
                        >
                            <span className="wizard-marker flex">
                                {index < step && (
                                    <Icon name="checkmark" size={3} className="z-up m-auto wizard-marker-icon" />
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
            {hideText === false && (
                <ul className="unstyled flex flex-nowrap m-0">
                    {steps.map((text = '', index) => {
                        return (
                            <li
                                key={`wizard-label-${index.toString()}`}
                                className={clsx(['wizard-label', index < step && 'is-complete'])}
                                aria-current={index === step ? 'step' : undefined}
                            >
                                <span>{text}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default Wizard;
