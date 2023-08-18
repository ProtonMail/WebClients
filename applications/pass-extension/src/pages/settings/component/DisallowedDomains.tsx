import type { KeyboardEvent } from 'react';
import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Checkbox, Icon, InputFieldTwo, Label } from '@proton/components/components';
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
        if (disallowedDomains[hostname]) {
            return createNotification({ text: c('Error').t`The url is in the list`, type: 'error' });
        }

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
            <hr className="border-weak my-2" />
            <p className="color-norm block">{c('Description')
                .t`This is a list of domains where auto functions (Autofill, Autofill 2FA, Autosuggestion or Autosave) are dissallowed`}</p>
            <hr className="my-2 border-weak" />
            <div className="flex flex-align-items-center flex-justify-space-between px-6 text-semibold">
                <div className="flex-item-fluid">URL</div>
                <div className="flex flex-justify-space-between">
                    <span className="pr-4">Autofill</span>
                    <span className="pr-4">Autofill 2FA</span>
                    <span className="pr-4">Autosuggest</span>
                    <span className="pr-4">Autosave</span>
                    <Icon name="pass-trash" size={18} />
                </div>
            </div>
            <hr className="border-weak mt-2" />
            <ul className="unstyled">
                {Object.entries(disallowedDomains).map(([url, mask], i) => (
                    <>
                        <li
                            key={`${url}-${i}`}
                            className="flex flex-align-items-center flex-justify-space-between button button-ghost-weak text-left"
                        >
                            <div className="flex-item-fluid overflow-x-auto">{url}</div>
                            <div className="w-1/2 flex flex-justify-space-between pr-8">
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
                        <hr className="border-weak my-2" />
                    </>
                ))}
            </ul>
            <div className="pt-6">
                <Label>
                    <strong>{c('Label').t`Insert new domain`}</strong>
                </Label>
                <hr className="border-weak my-2" />
                <InputFieldTwo
                    value={url}
                    onValue={setUrl}
                    onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && addDisallowedUrl(url)}
                />
                <button
                    type="submit"
                    onClick={() => addDisallowedUrl(url)}
                    className="button button-pill button-outline-norm "
                >
                    {c('Action').t`Add a domain`}
                </button>
            </div>
        </Card>
    );
};
