import type { FC } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import emptyDevicesImg from '@proton/styles/assets/img/illustrations/empty-devices.svg';

import useDesktopDownloads from '../../../hooks/drive/useDesktopDownloads';
import { DriveEmptyView } from '../../layout/DriveEmptyView';

type Props = {};

const EmptyDevices: FC<Props> = () => {
    const { isLoading, downloads } = useDesktopDownloads();

    return (
        <DriveEmptyView
            image={emptyDevicesImg}
            title={
                // translator: Shown as a call to action when there are no computers synced
                c('Info').t`Want to sync files faster?`
            }
            subtitle={
                // translator: Shown as a call to action when there are no computers synced
                c('Info').t`Get the desktop app to sync files from your computer.`
            }
        >
            {!isLoading && (
                <div className="flex flex-column gap-2">
                    {downloads.map(({ platform, icon, name, url, startDownload }, index) => {
                        return (
                            <Button
                                key={platform}
                                onClick={startDownload}
                                className="mx-auto flex items-center justify-center gap-2 w-2/3"
                                disabled={!url}
                                color="norm"
                                shape={index === 0 ? 'solid' : 'outline'}
                            >
                                <Icon name={icon} />
                                <span>
                                    {
                                        // translator: Download button for Drive desktop: "Download Windows app"
                                        c('Info').t`Download ${name} app`
                                    }
                                </span>
                            </Button>
                        );
                    })}
                </div>
            )}
        </DriveEmptyView>
    );
};

export default EmptyDevices;
