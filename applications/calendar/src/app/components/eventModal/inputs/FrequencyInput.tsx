import { c } from 'ttag';

import {
    Dropdown,
    DropdownButton,
    DropdownMenuButton,
    Icon,
    Option,
    SelectTwo,
    usePopperAnchor,
} from '@proton/components';
import type { Props as SelectProps } from '@proton/components/components/selectTwo/SelectTwo';
import { FREQUENCY } from '@proton/shared/lib/calendar/constants';

const { ONCE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM } = FREQUENCY;

interface Props extends Omit<SelectProps<FREQUENCY>, 'onChange' | 'children'> {
    value: FREQUENCY;
    frequencyInputType?: 'dropdown' | 'select';
    onChange: (value: FREQUENCY) => void;
}

const FrequencyInput = ({ value, frequencyInputType = 'select', onChange, ...rest }: Props) => {
    const frequencies = [
        { text: c('Option').t`Does not repeat`, value: ONCE },
        { text: c('Option').t`Every day`, value: DAILY },
        { text: c('Option').t`Every week`, value: WEEKLY },
        { text: c('Option').t`Every month`, value: MONTHLY },
        { text: c('Option').t`Every year`, value: YEARLY },
        { text: c('Option').t`Custom`, value: CUSTOM },
    ];

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const selectedOption = frequencies.find((item) => item.value === value);

    if (frequencyInputType === 'dropdown') {
        const handleClick = () => {
            toggle();
        };

        return (
            <>
                <DropdownButton
                    as="button"
                    type="button"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={handleClick}
                    {...rest}
                >
                    <span>{selectedOption?.text}</span> <Icon name="arrows-rotate" />
                </DropdownButton>
                <Dropdown autoClose autoCloseOutside isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                    {frequencies.map(({ value, text }) => (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => onChange(value)}
                            aria-pressed={selectedOption?.value === value}
                            key={value}
                        >
                            <span className="flex-1 pr-4">{text}</span>
                            {selectedOption?.value === value && (
                                <span className="ml-auto flex color-primary">
                                    <Icon name="checkmark" />
                                </span>
                            )}
                        </DropdownMenuButton>
                    ))}
                </Dropdown>
            </>
        );
    }

    return (
        <SelectTwo
            value={value}
            onChange={({ value }) => {
                onChange(value as FREQUENCY);
            }}
            {...rest}
        >
            {frequencies.map(({ value, text }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

export default FrequencyInput;
