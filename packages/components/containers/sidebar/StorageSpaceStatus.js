import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { CircularProgress, Dropdown, Icon, generateUID, useUser, usePopperAnchor } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const StorageSpaceStatus = ({ children }) => {
    const [{ MaxSpace, UsedSpace }] = useUser();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    const usedPercent = Math.round(UsedSpace / MaxSpace);
    const maxSpaceFormatted = humanSize(MaxSpace);
    const usedSpaceFormatted = humanSize(UsedSpace);
    const color =
        usedPercent < 60
            ? 'circle-bar--global-success'
            : usedPercent < 80
            ? 'circle-bar--global-attention'
            : 'circle-bar--global-warning';

    return (
        <>
            <button type="button" aria-describedby={uid} onClick={toggle} ref={anchorRef}>
                <CircularProgress progress={usedPercent} className={color}>
                    <text
                        className="circle-chart__percent fill-white"
                        x="16.91549431"
                        y="21"
                        fontFamily="Constantia"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        i
                    </text>
                </CircularProgress>
                <span className="smallest mt0 mb0-5 mlauto mrauto lh100 circle-chart-info opacity-40 bl">
                    {usedSpaceFormatted}
                </span>
            </button>

            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="right-bottom"
                size="auto"
            >
                <div className="dropDown-content">
                    <div className="absolute top-right mt0-5 mr0-5">
                        <button className="flex flex-items-center">
                            <Icon name="close" />
                        </button>
                    </div>
                    <div className="flex p1">
                        <div className="pr1 flex flex-items-center">
                            <div className="relative">
                                <CircularProgress
                                    progress={usedPercent}
                                    size={100}
                                    className={`circle-chart__background--bigger ${color}`}
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
                            {children}
                        </div>
                    </div>
                </div>
            </Dropdown>
        </>
    );
};

StorageSpaceStatus.propTypes = {
    children: PropTypes.node
};

export default StorageSpaceStatus;
