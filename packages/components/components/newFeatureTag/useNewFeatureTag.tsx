import { useState } from 'react';

import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

import NewFeatureTag, { NewFeatureTagProps } from './NewFeatureTag';

export default function useNewFeatureTag(key: string) {
    const [wasShown, setWasShown] = useState<boolean>(Boolean(getItem(key, 'false')));

    const onWasShown = () => {
        if (!wasShown) {
            setItem(key, 'true');
            setWasShown(true);
        }
    };

    const Component = (props: Omit<NewFeatureTagProps, 'featureKey'>) =>
        !wasShown ? <NewFeatureTag {...props} featureKey={key} /> : null;

    return {
        wasShown,
        onWasShown,
        Component,
    };
}
