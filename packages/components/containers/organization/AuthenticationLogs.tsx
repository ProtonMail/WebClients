import { useMemo, useRef, useState } from 'react';

import { endOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import AddressesInput, { AddressesInputItem } from '@proton/components/components/addressesInput/AddressesInput';
import DateInput from '@proton/components/components/input/DateInput';
import Loader from '@proton/components/components/loader/Loader';
import Pagination from '@proton/components/components/pagination/Pagination';
import usePaginationAsync from '@proton/components/components/pagination/usePaginationAsync';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import InputField from '@proton/components/components/v2/field/InputField';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import useApi from '@proton/components/hooks/useApi';
import { useMembers } from '@proton/components/hooks/useMembers';
import useNotifications from '@proton/components/hooks/useNotifications';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { type Organization } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { getLocalTimeStringFromDate } from '../b2bDashboard/Pass/helpers';
import B2BAuthLogsTable from '../logs/B2BAuthLogsTable';
import { convertEnhancedMembersToContactEmails } from './groups/NewGroupMemberInput';
import useAuthLogsDateFilter from './useAuthLogsFilter';
import useOrgAuthLogs from './useOrgAuthLogs';

interface Props {
    organization?: Organization;
}
export interface AuthLogsQueryParams {
    Emails: string[];
    StartTime?: string;
    EndTime?: string;
}

const AuthenticationLogs = ({ organization }: Props) => {
    const api = useApi();
    const [members] = useMembers();
    const { createNotification } = useNotifications();
    const { page, onNext, onPrevious, onSelect, reset } = usePaginationAsync(1);
    const [query, setQuery] = useState<AuthLogsQueryParams>({ Emails: [] });
    const { authLogs, total, loading, error } = useOrgAuthLogs(api, query, page);
    const { filter, handleStartDateChange, handleEndDateChange } = useAuthLogsDateFilter();
    const [recipients, setRecipient] = useState<Recipient[]>([]);
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);

    const items = useMemo(() => {
        return recipients.map((recipient) => {
            return (
                <AddressesInputItem
                    key={recipient.Address}
                    label={recipient.Address}
                    onClick={(event) => event.stopPropagation()}
                    onRemove={() => {
                        setRecipient(recipients.filter((rec) => rec.Address !== recipient.Address));
                    }}
                />
            );
        });
    }, [recipients]);

    const today = new Date();

    if (!organization || !members) {
        return <Loader />;
    }

    const handleAddEmail = (newRecipients: Recipient[]) => {
        setRecipient([...recipients, ...newRecipients]);
    };

    const handleSearchSubmit = () => {
        if (!recipients.length) {
            createNotification({ text: c('error').t`Enter an email address` });
            return;
        }
        reset();
        const Emails = recipients.map((recipient) => recipient.Address);
        const StartTime = filter.start ? getLocalTimeStringFromDate(filter.start) : undefined;
        const EndTime = filter.end ? getLocalTimeStringFromDate(endOfDay(filter.end)) : undefined;
        setQuery({ Emails, StartTime, EndTime });
    };

    return (
        <SettingsSectionExtraWide>
            <div className="flex flex-column md:flex-row gap-0 md:gap-4 flex-nowrap items-start justify-space-between *:min-size-auto my-6">
                <InputField
                    as={AddressesInput}
                    ref={addressesAutocompleteRef}
                    rootClassName="flex-1"
                    inputContainerClassName=""
                    autocomplete={
                        <AddressesAutocompleteTwo
                            id="auth-log-autocomplete"
                            anchorRef={addressesAutocompleteRef}
                            recipients={recipients}
                            onAddRecipients={handleAddEmail}
                            contactEmails={members && convertEnhancedMembersToContactEmails(members)}
                            inputClassName={clsx([
                                !recipients.length && 'my-0.5',
                                !!recipients.length && 'p-0 rounded-none',
                            ])}
                            validate={(email: string) => {
                                if (!validateEmailAddress(email)) {
                                    return c('Input Error').t`Not a valid email address`;
                                }
                            }}
                            unstyled
                            placeholder={recipients.length ? '' : c('Label').t`Search by email`}
                            limit={10}
                        />
                    }
                    items={items}
                    className={clsx(['multi-select-container', !!recipients.length && 'px-2 py-0.5'])}
                />
                <div className="flex-1 flex flex-column gap-2 *:min-size-auto">
                    <div className="flex flex-1 flex-row flex-nowrap gap-2">
                        <DateInput
                            id="start"
                            placeholder={c('Placeholder').t`Start date`}
                            value={filter.start}
                            onChange={handleStartDateChange}
                            className="flex-1"
                            max={today}
                        />
                        <DateInput
                            id="end"
                            placeholder={c('Placeholder').t`End date`}
                            value={filter.end}
                            onChange={handleEndDateChange}
                            className="flex-1"
                            max={today}
                        />
                        <Button color="norm" onClick={handleSearchSubmit} disabled={loading}>
                            {c('Action').t`Search`}
                        </Button>
                    </div>
                    <div className="self-end">
                        <Pagination
                            page={page}
                            total={total}
                            limit={10}
                            onSelect={onSelect}
                            onNext={onNext}
                            onPrevious={onPrevious}
                        />
                    </div>
                </div>
            </div>
            <B2BAuthLogsTable logs={authLogs} loading={loading} error={error} />
        </SettingsSectionExtraWide>
    );
};

export default AuthenticationLogs;
