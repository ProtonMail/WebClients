import { c } from 'ttag';
import { classnames, DropdownMenu, DropdownMenuButton, Icon, useMailSettings, ToolbarButton } from '@proton/components';
import { MESSAGE_BUTTONS } from '@proton/shared/lib/constants';
import { Vr } from '@proton/atoms';
import { Filter } from '../../models/tools';
import ToolbarDropdown from './ToolbarDropdown';

const { READ_UNREAD } = MESSAGE_BUTTONS;

interface Props {
    icon: boolean;
    filter: Filter;
    onFilter: (filter: Filter) => void;
}

const FilterActions = ({ icon, filter, onFilter }: Props) => {
    const [{ MessageButtons = READ_UNREAD } = {}] = useMailSettings();

    const noFilterApply = !Object.values(filter).length;

    const FILTER_OPTIONS = {
        SHOW_ALL: c('Filter option').t`All`,
        SHOW_UNREAD: c('Filter option').t`Unread`,
        SHOW_READ: c('Filter option').t`Read`,
        SHOW_MOVED_MESSAGE: c('Filter option').t`Show moved message`,
        HIDE_MOVED_MESSAGE: c('Filter option').t`Hide moved message`,
    };

    const readUnreadButtons = [
        {
            text: FILTER_OPTIONS.SHOW_READ,
            ID: 'filter-dropdown:show-read',
            isActive: filter.Unread === 0,
            onClick() {
                if (filter.Unread !== 0) {
                    onFilter({ Unread: 0 });
                }
            },
        },
        {
            text: FILTER_OPTIONS.SHOW_UNREAD,
            ID: 'filter-dropdown:show-unread',
            isActive: filter.Unread === 1,
            onClick() {
                if (filter.Unread !== 1) {
                    onFilter({ Unread: 1 });
                }
            },
        },
    ];

    const buttons = [
        {
            text: FILTER_OPTIONS.SHOW_ALL,
            ID: 'filter-dropdown:show-all',
            isActive: noFilterApply,
            onClick() {
                if (!noFilterApply) {
                    onFilter({});
                }
            },
        },
        ...(MessageButtons === READ_UNREAD ? readUnreadButtons : readUnreadButtons.reverse()),
    ];

    if (icon) {
        const getTextContent = () => {
            const { text = '' } = buttons.find(({ isActive }) => isActive) || {};
            return text;
        };

        return (
            <ToolbarDropdown
                hasCaret={false}
                title={getTextContent()}
                content={
                    <span className="flex flex-align-items-center flex-nowrap" data-testid="toolbar:filter-dropdown">
                        <Icon
                            className={classnames(['toolbar-icon mr0-5', !noFilterApply && 'color-primary'])}
                            name="filter"
                        />
                    </span>
                }
            >
                {() => (
                    <DropdownMenu>
                        <div className="text-bold w100 pr1 pl1 pt0-5 pb0-5">{c('Filter').t`Show:`}</div>
                        {buttons.map(({ ID, text, isActive, onClick }) => {
                            return (
                                <DropdownMenuButton
                                    key={ID}
                                    data-testid={ID}
                                    onClick={onClick}
                                    className="text-left"
                                    isSelected={isActive}
                                >
                                    {text}
                                </DropdownMenuButton>
                            );
                        })}
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
        );
    }

    return (
        <>
            <Vr />
            <div className="text-bold flex flex-align-items-center ml1 mr1">{c('Filter').t`Show:`}</div>
            {buttons.map(({ ID, text, isActive, onClick }) => {
                return (
                    <ToolbarButton
                        key={ID}
                        data-testid={ID}
                        aria-pressed={isActive}
                        className={classnames(['flex-align-items-center', isActive && 'no-pointer-events bg-strong'])}
                        onClick={onClick}
                    >
                        {text}
                    </ToolbarButton>
                );
            })}
        </>
    );
};

export default FilterActions;
