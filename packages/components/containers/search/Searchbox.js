import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SearchInput, Icon, Button } from '../../components';
import { classnames } from '../../helpers';

const Searchbox = ({ delay, className = '', advanced, placeholder = '', value = '', onSearch, onChange, onFocus }) => {
    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch?.(value);
    };

    const handleReset = (event) => {
        event.preventDefault();
        onChange('');
        onSearch?.('');
    };

    return (
        <form
            role="search"
            name="searchbox"
            className={classnames([
                'searchbox-container relative flex-item-centered-vert',
                className,
                value !== '' && advanced && 'searchbox-container--reset-advanced',
            ])}
            onSubmit={handleSubmit}
            onReset={handleReset}
        >
            <label htmlFor="global_search">
                <span className="sr-only">{placeholder}</span>
                <SearchInput
                    delay={delay}
                    value={value}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.target.blur();
                        }
                    }}
                    onChange={onChange}
                    id="global_search"
                    placeholder={placeholder}
                    className="searchbox-field"
                    iconSearchDisplayed={false}
                    data-shorcut-target="searchbox-field"
                    onFocus={onFocus}
                />
            </label>
            <Button
                type="submit"
                icon
                shape="ghost"
                color="weak"
                className="searchbox-search-button flex"
                title={c('Action').t`Search`}
            >
                <Icon name="search" size={22} className="mauto searchbox-search-button-icon" />
                <span className="sr-only">{c('Action').t`Search`}</span>
            </Button>
            {value.length ? (
                <Button type="reset" icon shape="ghost" color="weak" className="searchbox-advanced-search-button flex">
                    <Icon name="close" className="mauto searchbox-search-button-icon" />
                    <span className="sr-only">{c('Action').t`Clear`}</span>
                </Button>
            ) : null}
            {advanced}
        </form>
    );
};

Searchbox.propTypes = {
    delay: PropTypes.number,
    className: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onSearch: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    advanced: PropTypes.node,
};

export default Searchbox;
