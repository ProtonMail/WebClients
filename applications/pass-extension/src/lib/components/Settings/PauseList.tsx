import type { KeyboardEvent } from 'react';
import { type FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
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
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { hasCriteria, toggleCriteria } from '@proton/pass/lib/settings/criteria';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectDisallowedDomains } from '@proton/pass/store/selectors';
import type { CriteriaMasks } from '@proton/pass/types/worker/settings';
import { CRITERIAS_SETTING_CREATE, CRITERIA_MASKS } from '@proton/pass/types/worker/settings';
import { merge } from '@proton/pass/utils/object/merge';
import { intoCleanHostname } from '@proton/pass/utils/url/is-valid-url';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import './PauseList.scss';

const criterias = Object.keys(CRITERIA_MASKS) as CriteriaMasks[];

export const PauseList: FC = () => {
    const disallowedDomains = useSelector(selectDisallowedDomains);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const [url, setUrl] = useState<string>('');

    const addDisallowedUrl = (url: string) => {
        const hostname = intoCleanHostname(url);

        if (!hostname) return createNotification({ text: c('Error').t`Invalid URL`, type: 'error' });

        if (disallowedDomains[hostname]) {
            return createNotification({
                text: c('Error').t`The URL is in the list`,
                type: 'error',
            });
        }

        dispatch(
            settingsEditIntent('pause-list', {
                disallowedDomains: merge(disallowedDomains, {
                    [hostname]: CRITERIAS_SETTING_CREATE,
                }),
            })
        );
        setUrl('');
    };

    const toggleUrlMask = (hostname: string, criteria: CriteriaMasks) => {
        const setting = disallowedDomains[hostname];

        dispatch(
            settingsEditIntent('pause-list', {
                disallowedDomains: merge(disallowedDomains, {
                    [hostname]: toggleCriteria(setting, criteria),
                }),
            })
        );
    };

    const deleteDisallowedUrl = (hostname: string) => {
        const update = { ...disallowedDomains };
        delete update[hostname];

        dispatch(settingsEditIntent('pause-list', { disallowedDomains: update }));
    };

    const nonEmptyList = Object.keys(disallowedDomains).length > 0;
    const infoText = nonEmptyList ? ` ${c('Description').t`A checked box means the feature is disabled.`}` : '';

    return (
        <SettingsPanel
            title={c('Label').t`Pause list`}
            subTitle={c('Description')
                .t`List of domains where certain auto functions in ${PASS_SHORT_APP_NAME} (Autofill, Autosuggest, Autosave) should not be run.${infoText}`}
        >
            {Object.keys(disallowedDomains).length > 0 && (
                <Table responsive="cards" hasActions>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell className="w-1/4">
                                <small className="text-xs">{c('Label').t`Domain`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small className="text-xs">{c('Label').t`Autofill`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small className="text-xs">{c('Label').t`Autofill 2FA`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small className="text-xs">{c('Label').t`Autosuggest`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small className="text-xs">{c('Label').t`Autosave`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <small className="text-xs">{c('Label').t`Passkeys`}</small>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <Icon name="pass-trash" size={4} className="mr-2" />
                            </TableHeaderCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {Object.entries(disallowedDomains).map(([url, mask], i) => (
                            <TableRow key={`${url}-${i}`}>
                                <TableCell label={c('Label').t`Domains`}>
                                    <div className="text-ellipsis">{url}</div>
                                </TableCell>
                                {criterias.map((criteria) => (
                                    <TableCell
                                        key={criteria}
                                        label={(() => {
                                            switch (criteria) {
                                                case 'Autofill':
                                                    return c('Label').t`Autofill`;
                                                case 'Autofill2FA':
                                                    return c('Label').t`Autofill 2FA`;
                                                case 'Autosuggest':
                                                    return c('Label').t`Autosuggest`;
                                                case 'Autosave':
                                                    return c('Label').t`Autosave`;
                                            }
                                        })()}
                                    >
                                        <Checkbox
                                            checked={hasCriteria(mask, criteria)}
                                            onChange={() => toggleUrlMask(url, criteria)}
                                        />
                                    </TableCell>
                                ))}

                                <TableCell className="pass-pause-list--remove">
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => deleteDisallowedUrl(url)}
                                            aria-label={c('Action').t`Remove`}
                                            color="weak"
                                            size="medium"
                                            shape="solid"
                                            icon
                                            pill
                                        >
                                            <Icon name="cross" size={3} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className="flex mt-2">
                <div className="flex-1 mr-2">
                    <InputFieldTwo
                        value={url}
                        onValue={setUrl}
                        onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && addDisallowedUrl(url)}
                        dense
                        placeholder={'https://domain.com/path'}
                    />
                </div>
                <Button color="norm" shape="solid" onClick={() => addDisallowedUrl(url)}>
                    {c('Action').t`Add domain`}
                </Button>
            </div>
        </SettingsPanel>
    );
};
