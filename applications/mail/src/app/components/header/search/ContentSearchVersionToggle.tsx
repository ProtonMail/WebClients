import { c } from 'ttag';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import { useLocalStateSync } from '@proton/components/hooks/useLocalStateSync';
import { useFlag } from '@proton/unleash/useFlag';

type SearchVersion = 'v1' | 'v2';

export const ContentSearchVersionToggle = () => {
    const flag = useFlag('ContentSearch');
    const [searchVersion, setSearchVersion] = useLocalStateSync<SearchVersion>('v2', 'OVERRIDE_SEARCH_V2');

    if (!flag) {
        return;
    }

    return (
        <div className="mt-6">
            <span className="block text-semibold mb-2">{c('Label').t`Content search version to use`}</span>
            <RadioGroup<SearchVersion>
                name="assistant-runtime"
                className=""
                value={searchVersion ?? 'v2'}
                onChange={(value) => {
                    setSearchVersion(value);
                }}
                options={[
                    {
                        label: c('Label').t`v1`,
                        value: 'v1',
                    },
                    {
                        label: c('Label').t`v2`,
                        value: 'v2',
                    },
                ]}
            />
        </div>
    );
};
