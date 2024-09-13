import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Icon } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_DESKTOP_CHANGELOG_URL, PASS_LINUX_DOWNLOAD_URL, PASS_LINUX_VERSION_URL } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';
import { semver } from '@proton/pass/utils/string/semver';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { TopBar } from './TopBar';

type Release = {
    CategoryName: 'EarlyAccess' | 'Stable';
    Version: string;
    RolloutPercentage?: number;
};

type Releases = {
    Releases: Release[];
};

export const LinuxUpdateBar: FC = () => {
    const { config, onLink } = usePassCore();
    const autoUpdateEnabled = useFeatureFlag(PassFeature.PassEnableDesktopAutoUpdate);

    const [show, setShow] = useState(false);
    const installedVersion = config.APP_VERSION;
    const [latestVersion, setLatestVersion] = useState<string>(installedVersion);

    useEffect(() => {
        if (!autoUpdateEnabled) return;

        fetch(PASS_LINUX_VERSION_URL)
            .then((response) => response.json())
            .then(({ Releases }: Releases) => {
                const availableVersion = Releases.find(
                    (release) =>
                        release.CategoryName === 'Stable' &&
                        release.RolloutPercentage === 1 &&
                        semver(release.Version) > semver(installedVersion)
                );
                if (availableVersion) {
                    setLatestVersion(availableVersion.Version);
                    setShow(true);
                }
            })
            .catch(noop);
    }, []);

    const changelogLink = (
        <Href href={PASS_DESKTOP_CHANGELOG_URL}>
            {
                // translator: the text here is a link for the full sentence "The changelog can be found here."
                c('Info').t`here`
            }
        </Href>
    );

    return (
        <TopBar visible={show} onClose={() => setShow(false)}>
            <Icon name="arrows-rotate" size={6} />
            <div>
                <span className="text-bold mr-1">{c('Info').t`New version ${latestVersion} is available.`}</span>
                <span className="color-weak">{c('Info').jt`The changelog can be found ${changelogLink}.`}</span>
            </div>
            <Button pill size="small" shape="solid" color="norm" onClick={() => onLink(PASS_LINUX_DOWNLOAD_URL)}>
                {c('Action').t`How to update ${PASS_APP_NAME} on Linux`}
            </Button>
        </TopBar>
    );
};
