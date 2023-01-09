import React, { useRef } from 'react';

import { FeatureCode, Tooltip, classnames, useSpotlightOnFeature } from '@proton/components';
import useUser from '@proton/components/hooks/useUser';
import { MONTH } from '@proton/shared/lib/constants';
import { isSent } from '@proton/shared/lib/mail/messages';

import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import { MessageState } from '../../../logic/messages/messagesTypes';
import LoadContentSpotlight from '../../message/LoadContentSpotlight';
import SpyTrackerIcon from './SpyTrackerIcon';

interface Props {
    message: MessageState;
    className?: string;
    onClickIcon?: () => void;
}

const ItemSpyTrackerIcon = ({ message, className, onClickIcon }: Props) => {
    // TODO On the first part of the SL integration we will not have the change on the icon. We already started the implementation so we will hide it for now
    // const { feature: simpleLoginIntegration, loading: loadingSimpleLoginIntegration } = useFeature(
    //     FeatureCode.SLIntegration
    // );

    const [user] = useUser();

    const anchorRef = useRef(null);

    const sent = isSent(message.data);

    const isSimpleLoginIntegration = false; //TODO replace with when we will need simpleLoginIntegration?.Value;

    const { hasProtection, hasShowRemoteImage, numberOfTrackers, needsMoreProtection, title } = useMessageTrackers({
        message,
    });

    // Load content spotlight needs to be displayed if account is older than one month
    const userCreateTime = user.CreateTime || 0;
    const isAccountOlderThanOneMonth = Date.now() > userCreateTime * 1000 + MONTH;

    const { show: showLoadContentSpotlight, onDisplayed: onLoadContentSpotlightDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightLoadContent,
        isAccountOlderThanOneMonth
    );

    /*
     * Don't display the tracker icon on sent mails or when :
     * Loading remote images is automatic and email protection is OFF : We consider that the user don't want any protection at all.
     * But the user might have set recently the protection to OFF, so if we find trackers in previous emails, we still display the icon.
     */
    if (sent || (!hasProtection && hasShowRemoteImage && numberOfTrackers === 0)) {
        // TODO check also loadingSimpleLoginIntegrationFeature
        return null;
    }

    const spyTrackerIcon = (
        <div className={classnames(['flex', className])} ref={anchorRef}>
            <SpyTrackerIcon
                numberOfTrackers={numberOfTrackers}
                needsMoreProtection={needsMoreProtection}
                title={title}
                openSpyTrackerModal={onClickIcon}
            />
        </div>
    );

    return (
        <LoadContentSpotlight
            show={showLoadContentSpotlight}
            onDisplayed={onLoadContentSpotlightDisplayed}
            anchorRef={anchorRef}
        >
            {isSimpleLoginIntegration ? (
                <div className="flex flex-nowrap flex-align-items-center">
                    <span className="mr0-5 relative inline-flex item-spy-tracker-link flex-align-items-center">
                        {spyTrackerIcon}
                    </span>
                    <span className="pl0-25 flex-item-fluid" title={title}>
                        {title}
                    </span>
                </div>
            ) : (
                <div>
                    {/* Need to wrap the Tooltip by a div to avoid ref warning because Spotlight is cloning the element and applying refs on top of it */}
                    <Tooltip title={title} data-testid="privacy:icon-tooltip">
                        {spyTrackerIcon}
                    </Tooltip>
                </div>
            )}
        </LoadContentSpotlight>
    );
};

export default ItemSpyTrackerIcon;
