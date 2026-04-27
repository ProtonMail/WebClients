import type { KeyboardEvent } from 'react';
import { type FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import type { CriteriaMasks } from '@proton/pass/lib/settings/pause-list';
import {
    CRITERIAS_SETTING_CREATE,
    CRITERIA_MASKS,
    hasCriteria,
    toggleCriteria,
} from '@proton/pass/lib/settings/pause-list';
import { settingsEditIntent } from '@proton/pass/store/actions/creators/settings';
import { selectOrgDisallowedDomains } from '@proton/pass/store/selectors/organization';
import { selectDisallowedDomains } from '@proton/pass/store/selectors/settings';
import { merge } from '@proton/pass/utils/object/merge';
import { intoCleanHostname } from '@proton/pass/utils/url/utils';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import './PauseList.scss';

const criterias = Object.keys(CRITERIA_MASKS) as CriteriaMasks[];

export const PauseList: FC = () => {
    const disallowedDomains = useSelector(selectDisallowedDomains);
    const orgDomains = useSelector(selectOrgDisallowedDomains);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const [url, setUrl] = useState<string>('');

    const allHostnames = Array.from(new Set([...Object.keys(orgDomains), ...Object.keys(disallowedDomains)]));

    const addDisallowedUrl = (url: string) => {
        const hostname = intoCleanHostname(url);

        if (!hostname) return createNotification({ text: c('Error').t`Invalid URL`, type: 'error' });

        if (orgDomains[hostname]) {
            return createNotification({
                text: c('Error').t`This domain is already managed by your organization`,
                type: 'error',
            });
        }

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
        dispatch(
            settingsEditIntent('pause-list', {
                disallowedDomains: merge(disallowedDomains, {
                    [hostname]: toggleCriteria(disallowedDomains[hostname] ?? 0, criteria),
                }),
            })
        );
    };

    const deleteDisallowedUrl = (hostname: string) => {
        const update = { ...disallowedDomains };
        delete update[hostname];

        dispatch(settingsEditIntent('pause-list', { disallowedDomains: update }));
    };

    const nonEmptyList = allHostnames.length > 0;
    const infoText = nonEmptyList ? ` ${c('Description').t`A checked box means the feature is disabled.`}` : '';

    return (
        <SettingsPanel
            title={c('Label').t`Pause list`}
            subTitle={c('Description')
                .t`List of domains where certain auto functions in ${PASS_SHORT_APP_NAME} (Autofill, Autosuggest, Autosave) should not be run.${infoText}`}
        >
            {nonEmptyList && (
                <Table responsive="cards" hasActions borderWeak>
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
                        {allHostnames.map((hostname, i) => {
                            const isLocked = hostname in orgDomains;
                            const orgMask = orgDomains[hostname] ?? 0;
                            const userMask = disallowedDomains[hostname] ?? 0;
                            const effectiveMask = orgMask | userMask;

                            return (
                                <TableRow key={`${hostname}-${i}`}>
                                    <TableCell label={c('Label').t`Domains`}>
                                        <div className="flex items-center gap-1">
                                            {isLocked && <Icon name="lock" size={3} className="color-weak shrink-0" />}
                                            <div className="text-ellipsis">{hostname}</div>
                                        </div>
                                    </TableCell>
                                    {criterias.map((criteria) => {
                                        const criterionLocked = hasCriteria(orgMask, criteria);
                                        return (
                                            <TableCell
                                                key={criteria}
                                                label={((): string => {
                                                    switch (criteria) {
                                                        case 'Autofill':
                                                            return c('Label').t`Autofill`;
                                                        case 'Autofill2FA':
                                                            return c('Label').t`Autofill 2FA`;
                                                        case 'Autosuggest':
                                                            return c('Label').t`Autosuggest`;
                                                        case 'Autosave':
                                                            return c('Label').t`Autosave`;
                                                        case 'Passkey':
                                                            return c('Label').t`Passkey`;
                                                    }
                                                })()}
                                            >
                                                <Checkbox
                                                    checked={hasCriteria(effectiveMask, criteria)}
                                                    disabled={criterionLocked}
                                                    onChange={() =>
                                                        !criterionLocked && toggleUrlMask(hostname, criteria)
                                                    }
                                                />
                                            </TableCell>
                                        );
                                    })}

                                    <TableCell className="pass-pause-list--remove">
                                        <div className="flex justify-end">
                                            {!isLocked && (
                                                <Button
                                                    onClick={() => deleteDisallowedUrl(hostname)}
                                                    aria-label={c('Action').t`Remove`}
                                                    color="weak"
                                                    size="medium"
                                                    shape="solid"
                                                    icon
                                                    pill
                                                >
                                                    <Icon name="cross" size={3} />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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
