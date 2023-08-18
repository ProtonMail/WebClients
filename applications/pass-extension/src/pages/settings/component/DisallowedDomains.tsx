import type { KeyboardEvent } from 'react';
import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Checkbox, Icon, InputFieldTwo } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { selectDisallowedDomains, settingEditIntent } from '@proton/pass/store';
import type { DisallowCritera } from '@proton/pass/types/worker/settings';
import { DisallowCriteriaMasks } from '@proton/pass/types/worker/settings';
import { merge } from '@proton/pass/utils/object';
import { hasCriteria, toggleCriteria } from '@proton/pass/utils/settings/criteria';
import { isValidURL } from '@proton/pass/utils/url';

const criterias = Object.keys(DisallowCriteriaMasks) as DisallowCritera[];

export const DisallowedDomains: VFC = () => {
    const disallowedDomains = useSelector(selectDisallowedDomains);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const [url, setUrl] = useState<string>('');

    const addDisallowedUrl = (url: string) => {
        const maybeUrl = isValidURL(url);
        if (!maybeUrl.valid) return createNotification({ text: c('Error').t`Invalid url`, type: 'error' });

        const { hostname } = new URL(maybeUrl.url);
        if (disallowedDomains[hostname]) return;

        dispatch(settingEditIntent({ disallowedDomains: merge(disallowedDomains, { [hostname]: 15 }) }));
        setUrl('');
    };

    const toggleUrlMask = (hostname: string, criteria: DisallowCritera) => {
        const setting = disallowedDomains[hostname];

        dispatch(
            settingEditIntent({
                disallowedDomains: merge(disallowedDomains, {
                    [hostname]: toggleCriteria(setting, criteria),
                }),
            })
        );
    };

    const deleteDisallowedUrl = (hostname: string) => {
        const update = { ...disallowedDomains };
        delete update[hostname];

        dispatch(settingEditIntent({ disallowedDomains: update }));
    };

    return (
        <Card key="settings-section-disallowed" rounded className="mb-4 p-3">
            <strong className="color-norm block">{c('Label').t`Pause list`}</strong>
            <hr className="my-2 border-weak" />
            <div>URL |  Autofill | Autofill 2FA | Autosuggest | Autosave </div>
            <ul className="unstyled">
                {Object.entries(disallowedDomains).map(([url, mask], i) => (
                    <li
                        key={`${url}-${i}`}
                        className="flex flex-align-items-center flex-justify-space-between button button-ghost-weak text-left"
                    >
                        <span>{url}</span>
                        <div>
                            {criterias.map((criteria) => (
                                <Checkbox
                                    key={criteria}
                                    checked={hasCriteria(mask, criteria)}
                                    onChange={() => toggleUrlMask(url, criteria)}
                                />
                            ))}
                        </div>

                        <button
                            className="button button-pill button-for-icon button-solid-weak"
                            onClick={() => deleteDisallowedUrl(url)}
                        >
                            <Icon name="cross" size={12} />
                        </button>
                    </li>
                ))}
            </ul>

            <InputFieldTwo
                value={url}
                onValue={setUrl}
                onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && addDisallowedUrl(url)}
            />
        </Card>
    );
};
