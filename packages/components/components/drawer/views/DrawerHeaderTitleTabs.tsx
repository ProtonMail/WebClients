import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    options: SelectedDrawerOption[];
    onClickOption?: (value: SelectedDrawerOption) => void;
}

const DrawerHeaderTitleTabs = ({ title, options, onClickOption }: Props) => {
    return (
        <div className="tabs tabs--underline mb-3">
            <nav className="tabs-container mt-2 pt-0.5">
                <ul className="tabs-list unstyled flex flex-nowrap relative m-0 p-0">
                    {options.map((option, index) => {
                        const selected = option.text === title;
                        return (
                            /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
                            <li
                                key={index}
                                className="tabs-list-item text-left border-bottom border-weak"
                                role="presentation"
                            >
                                <button
                                    onClick={() => onClickOption?.(option)}
                                    type="button"
                                    className="tabs-list-link flex flex-nowrap justify-center items-center gap-1 relative"
                                    id={`header-tab-${option.value}`}
                                    data-testid={`header-tab-${option.value}`}
                                    role="tab"
                                    aria-controls={`content-tab-${option.value}`}
                                    tabIndex={0}
                                    aria-selected={selected}
                                >
                                    <span className={clsx(selected && 'text-semibold')}>{option.text}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default DrawerHeaderTitleTabs;
