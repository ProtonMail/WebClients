import React, { useState } from 'react';
import { c } from 'ttag';
import { Location, History } from 'history';
import {
    MainLogo,
    SupportDropdown,
    Hamburger,
    TopNavbar,
    TopNavbarLink,
    UpgradeButton,
    Searchbox,
    useUser,
    Icon,
    useLabels,
    useFolders
} from 'react-components';

import AdvancedSearchDropdown from './AdvancedSearchDropdown';
import { extractSearchParameters, setPathInUrl } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';
import { getLabelName } from '../../helpers/labels';

interface Props {
    labelID: string;
    elementID: string | undefined;
    location: Location;
    history: History;
    breakpoints: Breakpoints;
    onSearch: (keyword?: string, labelID?: string) => void;
    expanded?: boolean;
    onToggleExpand: () => void;
}

const PrivateHeader = ({
    labelID,
    elementID,
    location,
    history,
    breakpoints,
    expanded,
    onToggleExpand,
    onSearch
}: Props) => {
    const [{ hasPaidMail }] = useUser();
    const { keyword = '' } = extractSearchParameters(location);
    const [value, updateValue] = useState(keyword);
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const handleBack = () => history.push(setPathInUrl(location, labelID));

    const showBackButton = breakpoints.isNarrow && elementID;
    const showHamburger = breakpoints.isNarrow && !elementID;

    const labelName = getLabelName(labelID, labels, folders);

    return (
        <header className="header flex flex-nowrap flex-items-center reset4print">
            {showBackButton && (
                <button className="topnav-link flex" onClick={handleBack} title={c('Title').t`Back`}>
                    <Icon name="arrow-left" className="topnav-icon" />
                    <span className="h3 mb0 ml0-5 ellipsis">{c('Title').t`Back`}</span>
                </button>
            )}
            {showHamburger && (
                <>
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                    <span className="h3 mb0 ellipsis">{labelName}</span>
                </>
            )}
            {!breakpoints.isNarrow && (
                <>
                    <MainLogo url="/inbox" />
                    <Searchbox
                        delay={0}
                        placeholder={c('Placeholder').t`Search messages`}
                        onSearch={(keyword) => onSearch(keyword, keyword ? undefined : labelID)}
                        onChange={updateValue}
                        value={value}
                        advanced={
                            <AdvancedSearchDropdown
                                labelID={labelID}
                                keyword={value}
                                location={location}
                                history={history}
                                isNarrow={breakpoints.isNarrow}
                            />
                        }
                    />
                </>
            )}
            <TopNavbar>
                {!showBackButton && (
                    <>
                        {hasPaidMail ? null : <UpgradeButton external={true} />}
                        {!breakpoints.isNarrow && (
                            <TopNavbarLink
                                to="/inbox"
                                icon="mailbox"
                                text={c('Title').t`Mailbox`}
                                aria-current={true}
                            />
                        )}
                        {breakpoints.isNarrow ? (
                            <AdvancedSearchDropdown
                                labelID={labelID}
                                keyword={value}
                                location={location}
                                history={history}
                                isNarrow={breakpoints.isNarrow}
                            />
                        ) : null}
                        <TopNavbarLink
                            external={true}
                            to="/settings"
                            icon="settings-master"
                            text={c('Title').t`Settings`}
                            className="topnav-link"
                        />
                        <SupportDropdown className="topnav-link" />
                    </>
                )}
            </TopNavbar>
        </header>
    );
};

export default PrivateHeader;
