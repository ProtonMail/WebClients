import { type FC, useEffect, useState } from 'react';

import app from 'proton-authenticator/lib/app';
import {
    AUTHENTICATOR_DESKTOP_CHANGELOG_URL,
    AUTHENTICATOR_LINUX_DOWNLOAD_URL,
} from 'proton-authenticator/lib/constants';
import { useAppSelector } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Icon from '@proton/components/components/icon/Icon';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';
import { isMac, isWindows } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

export const UpdateBar: FC = () => {
    const [show, setShow] = useState(false);
    const [updating, setUpdating] = useState(false);
    const latestVersion = useAppSelector(({ update }) => update.updatePackage);
    const canAutoupdate = isWindows() || isMac();

    useEffect(() => {
        setShow(Boolean(latestVersion));
    }, [latestVersion]);

    if (!latestVersion) return;

    const onUpdateClick = async () => {
        try {
            setUpdating(true);
            await app.updateTo(latestVersion);
        } catch {
            setShow(false);
            setUpdating(false);
        }
    };

    return (
        <div
            className={clsx(
                show ? 'opacity-1' : 'opacity-0',
                'w-full bg-primary fixed bottom-0 p-2 flex justify-space-between items-center'
            )}
        >
            <div className="flex flex-1 justify-space-between items-center">
                <div>
                    <Icon name="arrows-rotate" size={6} />
                    <InlineLinkButton
                        className="text-semibold ml-2"
                        onClick={() => app.openUrl(AUTHENTICATOR_DESKTOP_CHANGELOG_URL)}
                    >
                        {c('authenticator-2025:Info').t`New version ${latestVersion.version} is available`}
                    </InlineLinkButton>
                </div>

                {canAutoupdate ? (
                    <Button
                        className="button-xs"
                        color="norm"
                        pill
                        shape="solid"
                        size="small"
                        disabled={updating}
                        loading={updating}
                        onClick={onUpdateClick}
                    >
                        {c('authenticator-2025:Action').t`Update and relaunch`}
                    </Button>
                ) : (
                    <Button
                        className="button-xs"
                        color="norm"
                        pill
                        shape="solid"
                        size="small"
                        onClick={() => app.openUrl(AUTHENTICATOR_LINUX_DOWNLOAD_URL)}
                    >
                        {c('authenticator-2025:Action').t`How to update ${AUTHENTICATOR_APP_NAME} on Linux`}
                    </Button>
                )}
            </div>

            <Button
                className="shrink-0 ml-2"
                pill
                size="small"
                shape="ghost"
                onClick={() => setShow(!show)}
                disabled={updating}
            >
                <Icon name="cross" />
            </Button>
        </div>
    );
};
