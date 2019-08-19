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
    const color = usedPercent < 60 ? 'global-success' : usedPercent < 80 ? 'global-attention' : 'global-warning';

    return (
        <>
            <CircularProgress
                className="center"
                progress={usedPercent}
                aria-describedby={uid}
                rootRef={anchorRef}
                onClick={toggle}
                color={color}
            >
                <text
                    className="stroke-white"
                    x="50%"
                    y="50%"
                    fontFamily="Constantia"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    i
                </text>
            </CircularProgress>
            <span className="center opacity-40 smaller storage">{usedSpaceFormatted}</span>
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
                                    backgroundColor="global-light"
                                    color={color}
                                />
                                <span className="centered-absolute">{usedPercent}%</span>
                            </div>
                        </div>
                        <div className="w150p">
                            <div className="big mt0 mb0">{c('Title').t`Storage`}</div>
                            <div className="small color-black mt0 mb0">
                                {c('Info').jt`${usedSpaceFormatted} of ${maxSpaceFormatted} used`}
                            </div>
                            <p className="smaller opacity-40 mt0 mb1">
                                {c('Info').t`Your storage space is shared across all Proton products.`}
                            </p>
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
