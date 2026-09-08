import { c } from 'ttag';

import { OptionButton } from '../../../atoms/OptionButton/OptionButton';
import { useLayoutOptions } from './useLayoutOptions';

export const LayoutOptions = ({ onClose }: { onClose: () => void }) => {
    const { options } = useLayoutOptions();

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div role="listbox" aria-label={c('Aria').t`Layouts`} className="flex flex-column gap-1 px-4 py-2">
            {options.map(({ key, label, Icon, isSelected, onSelect }) => (
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                <OptionButton
                    key={key}
                    label={label}
                    LabelIcon={Icon}
                    showIcon={isSelected}
                    role="option"
                    ariaSelected={isSelected}
                    onClick={() => {
                        onSelect();
                        onClose();
                    }}
                />
            ))}
        </div>
    );
};
