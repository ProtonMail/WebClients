import { useState } from 'react';

import { Button } from '@proton/atoms';
import {
    AuthenticationProvider,
    Checkbox,
    ConfigProvider,
    type PrivateAuthenticationStore,
    UpsellModal,
} from '@proton/components';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import type { UpsellModalProps } from '@proton/components/components/upsell/modal/UpsellModal';
import { upsellFeatures } from '@proton/components/components/upsell/modal/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { getTitle } from '../../helpers/title';
import mdx from './Upsell.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Icon = () => {
    return <UpsellIcon />;
};

const config = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const authentication = {
    getUID: () => 'uid',
    getLocalID: noop,
    getPassword: noop,
    onLogout: noop,
    mode: '',
} as unknown as PrivateAuthenticationStore;

export const Basic = () => {
    const [opened, setOpened] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<UpsellModalProps['features']>([
        'auto-delete-trash-and-spam',
    ]);

    return (
        <div className="flex items-stretch justify-space-between py-7">
            <ConfigProvider config={config}>
                <AuthenticationProvider store={authentication}>
                    <div className="w-1/2">
                        <strong className="block mb-4">Upsell Features</strong>
                        <ul className="unstyled">
                            {Object.entries(upsellFeatures).map(([fakeKey, feature]) => {
                                const key = fakeKey as unknown as UpsellModalProps['features'][number];
                                if (typeof feature === 'function') {
                                    return null;
                                }
                                return (
                                    <li>
                                        <Checkbox
                                            name="selected-color"
                                            onChange={() => {
                                                if (selectedFeatures.includes(key)) {
                                                    const nextSelected = selectedFeatures.filter((f) => f !== key);
                                                    setSelectedFeatures(nextSelected);
                                                } else {
                                                    const nextSelected = [...selectedFeatures, key];
                                                    setSelectedFeatures(nextSelected);
                                                }
                                            }}
                                            value={key}
                                            checked={selectedFeatures.includes(key)}
                                        >
                                            {feature.getText()}
                                        </Checkbox>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="">
                        <UpsellModal
                            modalProps={{
                                onClose: () => {
                                    setOpened(false);
                                },
                                onExit: () => {
                                    setOpened(false);
                                },
                                open: opened,
                            }}
                            description={'A description to write'}
                            features={selectedFeatures}
                            title="A title"
                            upgradePath="/upgrade?ref=account-banner"
                            sourceEvent="BUTTON_MORE_ADDRESSES"
                        />
                        <Button
                            className="mx-auto"
                            size="large"
                            fullWidth
                            color="norm"
                            onClick={() => {
                                setOpened(!opened);
                            }}
                        >
                            {'Open'}
                        </Button>
                    </div>
                </AuthenticationProvider>
            </ConfigProvider>
        </div>
    );
};
