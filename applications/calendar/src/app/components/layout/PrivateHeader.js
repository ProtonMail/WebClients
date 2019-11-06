import React from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    UpgradeButton,
    useUser,
    Hamburger,
    TopNavbar,
    TopNavbarLink,
    FloatingButton
} from 'react-components';
import { c } from 'ttag';

const PrivateHeader = ({ title, url, inSettings, onCreateEvent, expanded, onToggleExpand, isNarrow }) => {
    const [{ hasPaidMail }] = useUser();
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url={url} className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="big ellipsis">{title}</span> : null}
            <TopNavbar>
                {hasPaidMail || isNarrow ? null : <UpgradeButton external={true} />}
                {isNarrow && !inSettings ? null : (
                    <TopNavbarLink
                        className="nomobile"
                        to={url}
                        icon="calendar"
                        text={c('Title').t`Calendar`}
                        aria-current={!inSettings}
                    />
                )}
                {isNarrow && inSettings ? null : (
                    <TopNavbarLink
                        to={`${url}/settings/general`}
                        icon="settings-master"
                        text={c('Title').t`Settings`}
                        aria-current={inSettings}
                    />
                )}
            </TopNavbar>
            {isNarrow && !inSettings && onCreateEvent ? (
                <FloatingButton onClick={() => onCreateEvent()} icon="plus" />
            ) : null}
        </header>
    );
};

PrivateHeader.propTypes = {
    isNarrow: PropTypes.bool,
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func,
    onCreateEvent: PropTypes.func,
    inSettings: PropTypes.bool,
    url: PropTypes.string,
    title: PropTypes.string
};

export default PrivateHeader;
