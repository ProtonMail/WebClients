import React from 'react';
import {
    MainLogo,
    UpgradeButton,
    useUser,
    Hamburger,
    TopNavbar,
    TopNavbarLink,
    FloatingButton,
} from 'react-components';
import { c } from 'ttag';

interface Props {
    title: string;
    url: string;
    inSettings: boolean;
    onCreateEvent?: () => void;
    expanded: boolean;
    onToggleExpand: () => void;
    isNarrow: boolean;
}

const PrivateHeader = ({ title, url, inSettings, onCreateEvent, expanded, onToggleExpand, isNarrow }: Props) => {
    const [{ hasPaidMail }] = useUser();
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url={url} className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="big lh-standard mtauto mbauto ellipsis">{title}</span> : null}
            <TopNavbar>
                {hasPaidMail || isNarrow ? null : <UpgradeButton external />}
                {isNarrow && !inSettings ? null : (
                    <TopNavbarLink
                        data-test-id="calendar-view:calendar-icon-top-bar"
                        className="nomobile"
                        to={url}
                        icon="calendar"
                        text={c('Title').t`Calendar`}
                        aria-current={!inSettings}
                    />
                )}
                {isNarrow && inSettings ? null : (
                    <TopNavbarLink
                        data-test-id="calendar-view:general-calendar-settings-icon"
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

export default PrivateHeader;
