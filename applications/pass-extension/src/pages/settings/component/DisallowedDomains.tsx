import type { KeyboardEvent } from 'react';
import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import {
    Checkbox,
    Icon,
    InputFieldTwo,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { selectDisallowedDomains, settingEditIntent } from '@proton/pass/store';
import type { DisallowCritera } from '@proton/pass/types/worker/settings';
import { DisallowCriteriaMasks } from '@proton/pass/types/worker/settings';
import { merge } from '@proton/pass/utils/object';
import { hasCriteria, toggleCriteria } from '@proton/pass/utils/settings/criteria';
import { isValidURL } from '@proton/pass/utils/url';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

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

        dispatch(settingEditIntent('pause-list', { disallowedDomains: merge(disallowedDomains, { [hostname]: 15 }) }));
        setUrl('');
    };

    const toggleUrlMask = (hostname: string, criteria: DisallowCritera) => {
        const setting = disallowedDomains[hostname];

        dispatch(
            settingEditIntent('pause-list', {
                disallowedDomains: merge(disallowedDomains, {
                    [hostname]: toggleCriteria(setting, criteria),
                }),
            })
        );
    };

    const deleteDisallowedUrl = (hostname: string) => {
        const update = { ...disallowedDomains };
        delete update[hostname];

        dispatch(settingEditIntent('pause-list', { disallowedDomains: update }));
    };

    return (
        <Card key="settings-section-disallowed" rounded className="mb-4 p-3">
            <strong className="color-norm block">{c('Label').t`Pause list`}</strong>
            <hr className="border-weak my-2" />
            <em className="block text-sm color-weak mb-3 m-1">{c('Description')
                .t`List of domains where certain auto functions in ${PASS_SHORT_APP_NAME} (Autofill, Autosuggest, Autosave) should not be run.`}</em>

            {Object.keys(disallowedDomains).length > 0 && (
                <Table responsive="cards" hasActions>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell className="w-1/3">
                                <small>{c('Label').t`Domains`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small>{c('Label').t`Autofill`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small>{c('Label').t`Autofill 2FA`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small>{c('Label').t`Autosuggest`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small>{c('Label').t`Autosave`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <Icon name="pass-trash" size={16} className="mr-2" />
                            </TableHeaderCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {Object.entries(disallowedDomains).map(([url, mask], i) => (
                            <TableRow key={`${url}-${i}`}>
                                <TableCell>
                                    <div className="text-ellipsis">{url}</div>
                                </TableCell>
                                {criterias.map((criteria) => (
                                    <TableCell key={criteria}>
                                        <Checkbox
                                            checked={hasCriteria(mask, criteria)}
                                            onChange={() => toggleUrlMask(url, criteria)}
                                        />
                                    </TableCell>
                                ))}

                                <TableCell>
                                    <button
                                        className="button button-pill button-for-icon button-solid-weak"
                                        onClick={() => deleteDisallowedUrl(url)}
                                    >
                                        <Icon name="cross" size={12} />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className="flex mt-2">
                <div className="flex-item-fluid mr-2">
                    <InputFieldTwo
                        value={url}
                        onValue={setUrl}
                        onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && addDisallowedUrl(url)}
                        dense
                        placeholder={'https://domain.com/path'}
                    />
                </div>
                <Button color="norm" shape="solid" onClick={() => addDisallowedUrl(url)}>
                    {c('Action').t`Add domain to pause list`}
                </Button>
            </div>
        </Card>
    );
};
