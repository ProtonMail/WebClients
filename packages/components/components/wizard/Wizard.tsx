import { classnames } from '../../helpers';
import Icon from '../icon/Icon';

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
            className={classnames([
                'wizard-container relative pt0 pb1 mb1',
                hideText && 'wizard-container--no-text-displayed',
            ])}
        >
            <ul className="wizard mt0 unstyled flex flex-nowrap flex-justify-space-between">
                {steps.map((text = '', index) => {
                    return (
                        <li
                            key={index.toString()}
                            className={classnames(['wizard-item', index < step && 'is-complete'])}
                            aria-current={index === step ? 'step' : undefined}
                            title={text}
                        >
                            <span className="wizard-marker flex">
                                {index < step && <Icon name="on" size={12} className="z10 mauto wizard-marker-icon" />}
                            </span>
                        </li>
                    );
                })}
            </ul>
            {hideText === false && (
                <ul className="unstyled flex flex-nowrap m0">
                    {steps.map((text = '', index) => {
                        return (
                            <li
                                key={`wizard-label-${index.toString()}`}
                                className={classnames(['wizard-label', index < step && 'is-complete'])}
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
