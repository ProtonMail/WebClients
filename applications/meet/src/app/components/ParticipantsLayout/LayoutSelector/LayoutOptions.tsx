import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { OptionButton } from '../../../atoms/OptionButton/OptionButton';
import type { LayoutOption } from './useLayoutOptions';

interface Props {
    options: LayoutOption[];
    onClose: () => void;
    className: string;
}

export const LayoutOptions = ({ options, onClose, className }: Props) => (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <div role="listbox" aria-label={c('Aria').t`Layouts`} className={clsx('flex flex-column', className)}>
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
