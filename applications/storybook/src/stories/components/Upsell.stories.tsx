import { useState } from 'react';

import { Button } from '@proton/atoms/Button';
import { Checkbox, UpsellModal } from '@proton/components';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import type { UpsellModalProps } from '@proton/components/components/upsell/modal/UpsellModal';
import { upsellFeatures } from '@proton/components/components/upsell/modal/constants';

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

export const Basic = () => {
    const [opened, setOpened] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<UpsellModalProps['features']>([
        'auto-delete-trash-and-spam',
    ]);

    return (
        <div className="flex items-stretch justify-space-between py-7">
            <div className="w-1/2">
                <strong className="block mb-4">Upsell Features</strong>
                <ul className="unstyled">
                    {Object.entries(upsellFeatures).map(([fakeKey, feature]) => {
                        const key = fakeKey as unknown as UpsellModalProps['features'][number];
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
        </div>
    );
};
