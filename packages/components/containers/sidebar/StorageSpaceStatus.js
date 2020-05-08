import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    CircularProgress,
    Dropdown,
    Icon,
    Loader,
    generateUID,
    useUser,
    usePopperAnchor,
    useSubscription
} from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { hasVisionary, hasLifetime } from 'proton-shared/lib/helpers/subscription';

import { classnames } from '../../helpers/component';

const StorageSpaceStatus = ({ upgradeButton }) => {
    const [{ MaxSpace, UsedSpace }] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();
    const canUpgradeStorage = !hasVisionary(subscription) && !hasLifetime(subscription);

    // round with 0.01 precision
    const usedPercent = Math.round((UsedSpace / MaxSpace) * 10000) / 100;
    const maxSpaceFormatted = humanSize(MaxSpace);
    const usedSpaceFormatted = humanSize(UsedSpace);
    const color = usedPercent < 60 ? 'circle-bar--low' : usedPercent < 80 ? 'circle-bar--medium' : 'circle-bar--full';

    return (
        <>
            <button type="button" aria-describedby={uid} onClick={toggle} ref={anchorRef}>
                <CircularProgress progress={usedPercent} className={color}>
                    <g className="circle-chart__info">
                        <rect x="17" y="14" width="1.55" height="9.1" className="circle-chart__percent fill-white" />
                        <rect x="17" y="11" width="1.55" height="1.53" className="circle-chart__percent fill-white" />
                    </g>
                </CircularProgress>
                <span className="smallest mt0 mb0-5 mlauto mrauto lh100 circle-chart-info opacity-40 bl">
                    {usedSpaceFormatted}
                </span>
            </button>

            <Dropdown
                id={uid}
                isOpen={isOpen}
                noMaxSize={true}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="right-bottom"
                size="auto"
            >
                <div className="absolute top-right mt0-5r mr0-5r">
                    <button type="button" className="flex flex-items-center" title={c('Action').t`Close`}>
                        <Icon name="close" />
                        <span className="sr-only">{c('Action').t`Close`}</span>
                    </button>
                </div>
                <div className="flex p1">
                    <div className="pr1 flex flex-items-center">
                        <div className="relative">
                            <CircularProgress
                                progress={usedPercent}
                                size={100}
                                className={classnames(['circle-chart__background--bigger', color])}
                            />
                            <span className="centered-absolute">{usedPercent}%</span>
                        </div>
                    </div>
                    <div className="w150p">
                        <b className="flex">{c('Title').t`Storage`}</b>
                        <small>{c('Info').jt`${usedSpaceFormatted} of ${maxSpaceFormatted} used`}</small>
                        <div className="mb1">
                            <span className="opacity-50 small">
                                {c('Info').t`Your storage space is shared across all Proton products.`}
                            </span>
                        </div>
                        {loadingSubscription ? <Loader /> : canUpgradeStorage ? upgradeButton : null}
                    </div>
                </div>
            </Dropdown>
        </>
    );
};

StorageSpaceStatus.propTypes = {
    upgradeButton: PropTypes.node.isRequired
};

export default StorageSpaceStatus;
