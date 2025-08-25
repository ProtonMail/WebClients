import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { endOfDay, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { organizationActions } from '@proton/account/organization';
import { Button } from '@proton/atoms';
import AddressesInput, { AddressesInputItem } from '@proton/components/components/addressesInput/AddressesInput';
import DateInput from '@proton/components/components/input/DateInput';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Pagination from '@proton/components/components/pagination/Pagination';
import usePaginationAsync from '@proton/components/components/pagination/usePaginationAsync';
import Toggle from '@proton/components/components/toggle/Toggle';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import InputField from '@proton/components/components/v2/field/InputField';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { OrganizationExtended, OrganizationSettings, Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import SettingsSectionWide from '../account/SettingsSectionWide';
import RecipientsLimitationModal from '../b2bDashboard/ActivityMonitor/RecipientsLimitationModal';
import { updateMonitoringSetting } from '../b2bDashboard/ActivityMonitor/api';
import { getLocalTimeStringFromDate, getSearchType } from '../b2bDashboard/Pass/helpers';
import B2BAuthLogsTable from '../logs/B2BAuthLogsTable';
import { convertEnhancedMembersToContactEmails } from './groups/NewGroupMemberInput';
import useAuthLogsDateFilter from './useAuthLogsFilter';
import useOrgAuthLogs from './useOrgAuthLogs';
import Icon from '@proton/components/components/icon/Icon';
import { type AuthLogsQueryParams, handleDownload, mapMembersToRecipients } from '../b2bDashboard/ActivityMonitor/helpers';

interface Props {
    organization?: OrganizationExtended;
    activityMonitorSection?: boolean;
    wipeLogs?: boolean;
    monitoring?: boolean;
}

const AuthenticationLogs = ({
    organization,
    activityMonitorSection = true,
    wipeLogs = false,
    monitoring = false,
}: Props) => {
    const api = useApi();
    const [members] = useMembers();
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();
    const { page, onNext, onPrevious, onSelect, reset } = usePaginationAsync(1);
    const [query, setQuery] = useState<AuthLogsQueryParams>({ Emails: [] });
    const { authLogs, total, loading, error } = useOrgAuthLogs(api, query, page, wipeLogs);
    const { filter, handleStartDateChange, handleEndDateChange } = useAuthLogsDateFilter();
    const [recipients, setRecipient] = useState<Recipient[]>([]);
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);
    const [detailedMonitoringLoading, withLoadingDetailedMonitoring] = useLoading();
    const [recipientsModalProps, recipientsModalOpen, recipientsModalRender] = useModalState();
    const [loadingDownload, withLoadingDownload] = useLoading();
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const dispatch = useDispatch();

    const detailedMonitoring = organization?.Settings?.LogAuth === 2;

    const { viewportWidth } = useActiveBreakpoint();

    const items = useMemo(() => {
        return recipients.map((recipient) => {
            return (
                <span className="flex">
                    <AddressesInputItem
                        key={recipient.Address}
                        label={recipient.Address}
                        onClick={(event) => event.stopPropagation()}
                        onRemove={() => {
                            setRecipient(recipients.filter((rec) => rec.Address !== recipient.Address));
                        }}
                    />
                </span>
            );
        });
    }, [recipients]);

    const handleSetDetailedMonitoring = async () => {
        const enabling = !detailedMonitoring;

        try {
            const newValue = enabling ? 2 : 1;
            await api<OrganizationSettings>(updateMonitoringSetting(newValue));
            dispatch(organizationActions.updateOrganizationSettings({ value: { LogAuth: newValue } }));
        } catch (e) {
            createNotification({ type: 'error', text: c('Error').t`Failed to update detailed monitoring.` });
        }
    };

    const today = new Date();

    const handleAddEmail = (newRecipients: Recipient[]) => {
        if (recipients.length > 50) {
            recipientsModalOpen(true);
            return;
        }
        setRecipient([...recipients, ...newRecipients]);
    };

    const handleSearchSubmit = (initialLoad?: boolean): Promise<void> | undefined => {
        if (members) {
            if (members.length > 100) {
                createNotification({ text: c('error').t`Select users to view their activity` });
                return Promise.resolve();
            }

            let Emails: string[] = [];

            if (initialLoad || recipients.length === 0) {
                const membersArray = convertEnhancedMembersToContactEmails(members);
                Emails = membersArray.map((member) => member.Email);
            } else {
                Emails = recipients.map((recipient) => recipient.Address);
            }

            const StartTime = filter.start ? getLocalTimeStringFromDate(filter.start) : undefined;
            const EndTime = filter.end ? getLocalTimeStringFromDate(endOfDay(filter.end)) : undefined;

            setQuery({
                Emails,
                StartTime,
                EndTime,
            });
            const newRecipients = mapMembersToRecipients(members, Emails);
            setRecipient(newRecipients);
            reset();
        }
    };

    useEffect(() => {
        withSubmitting(handleSearchSubmit(true)).catch(noop);
    }, [reloadTrigger]);

    if (!organization || !members) {
        return <Loader />;
    }

    const isFilterEmpty = () => {
        return filter.start === undefined && filter.end === undefined && recipients.length === 0;
    };

    const resetFilter = () => {
        handleStartDateChange(undefined);
        handleEndDateChange(undefined);

        // Map members and display them in the user filter
        const membersArray = convertEnhancedMembersToContactEmails(members);
        const Emails = membersArray.map((member) => member.Email);
        const newRecipients = mapMembersToRecipients(members, Emails);
        setRecipient(newRecipients);
        
        setQuery({ Emails: [] });
        reset();
    };

    const triggerReload = () => {
        setReloadTrigger((prev) => prev + 1);
    };

    const handleClickableTime = (time: string | number) => {
        const date = new Date(Number(time) * 1000);
        const start = getLocalTimeStringFromDate(startOfDay(date));
        const end = getLocalTimeStringFromDate(endOfDay(date));

        handleStartDateChange(date);
        handleEndDateChange(date);

        setQuery({ ...query, StartTime: start, EndTime: end });
        reset();
    };

    const handleClickableEmailOrIP = (keyword: string) => {
        const searchType = getSearchType(keyword);

        if (searchType !== 'email' && searchType !== 'ip') {
            return;
        }

        const newQuery: AuthLogsQueryParams =
            searchType === 'email' ? { Emails: [keyword] } : { Emails: [], IP: keyword };

        setQuery(newQuery);
        setRecipient(recipients.filter((rec) => rec.Address === keyword));
        reset();
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        withSubmitting(handleSearchSubmit()).catch(noop);
    };

    return (
        <SettingsSectionWide customWidth={clsx(activityMonitorSection ? '90rem' : '82rem')} className="grow">
            {recipientsModalRender && (
                <RecipientsLimitationModal {...recipientsModalProps} onChange={() => recipientsModalOpen(false)} />
            )}
            <div className="flex flex-column">
                <div className="flex flex-row justify-space-between mt-2">
                    <div className="w-full flex flex-row justify-space-between">
                        <div className="flex flex-column w-full">
                            <form
                                onSubmit={handleSubmit}
                                className="flex flex-column md:flex-row gap-2 justify-space-between"
                                style={{ '--max-w-custom': '90rem' }}
                            >
                                <div className="flex flex-column md:flex-row gap-2 *:min-size-auto md:flex-shrink">
                                    <div className="md:flex-1 flex flex-column *:min-size-auto w-full leading-10 w-custom" style={{ '--w-custom': '16rem' }}>
                                        <Label className="text-semibold p-0 h-6 mb-1" htmlFor="search">
                                            {c('Label').t`Search`}
                                        </Label>
                                        <InputField
                                            as={AddressesInput}
                                            ref={addressesAutocompleteRef}
                                            inputContainerClassName=""
                                            autocomplete={
                                                <AddressesAutocompleteTwo
                                                    id="auth-log-autocomplete"
                                                    anchorRef={addressesAutocompleteRef}
                                                    recipients={recipients}
                                                    onAddRecipients={handleAddEmail}
                                                    contactEmails={
                                                        members && convertEnhancedMembersToContactEmails(members)
                                                    }
                                                    inputClassName={clsx(!!recipients.length && 'p-0 rounded-none')}
                                                    validate={(email: string) => {
                                                        if (!validateEmailAddress(email)) {
                                                            return c('Input Error').t`Not a valid email address`;
                                                        }
                                                    }}
                                                    unstyled
                                                    placeholder={c('Label').t`Search for a name or email`}
                                                    limit={50}
                                                />
                                            }
                                            className={clsx([
                                                'multi-select-container h-custom content-center',
                                                !!recipients.length && 'px-2',
                                            ])}
                                            assistContainerClassName="empty:hidden"
                                            rootStyle={{ '--h-custom': '2.25rem' }}
                                        />
                                    </div>
                                    <div
                                        className={clsx([
                                            'md:flex-1 md:max-w-1/2 flex flex-column justify-space-between sm:flex-row gap-2',
                                            viewportWidth['<=small'] && '*:min-size-auto flex-nowrap',
                                        ])}
                                    >
                                        <div className="flex-1 flex flex-column *:min-size-auto leading-10 w-custom" style={{ '--w-custom': '8rem' }}>
                                            <Label className="text-semibold p-0 h-6 mb-1" htmlFor="begin-date">
                                                {c('Label (begin date/advanced search)').t`From`}
                                            </Label>
                                            <DateInput
                                                id="start"
                                                placeholder={c('Placeholder').t`Start date`}
                                                value={filter.start}
                                                onChange={handleStartDateChange}
                                                max={today}
                                            />
                                        </div>
                                        <span
                                            className="hidden sm:flex text-bold self-end h-custom shrink-0"
                                            style={{ '--h-custom': '2rem' }}
                                        >
                                            -
                                        </span>
                                        <div className="flex-1 flex flex-column *:min-size-auto leading-10 w-custom" style={{ '--w-custom': '8rem' }}>
                                            <Label className="text-semibold p-0 h-6 mb-1" htmlFor="end-date">
                                                {c('Label (end date/advanced search)').t`To`}
                                            </Label>
                                            <DateInput
                                                id="end"
                                                placeholder={c('Placeholder').t`End date`}
                                                value={filter.end}
                                                onChange={handleEndDateChange}
                                                max={today}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex lg:inline-flex flex-nowrap flex-row gap-2 shrink-0 items-end">
                                        <div className="flex content-center">
                                            <Button color="norm" type="submit" loading={submitting} className="self-end">
                                                {c('Action').t`Search`}
                                            </Button>
                                        </div>
                                        <div className="flex content-center">
                                            <Button
                                                color="norm"
                                                shape="ghost"
                                                type="submit"
                                                loading={submitting}
                                                className="self-end"
                                                disabled={isFilterEmpty()}
                                                onClick={resetFilter}
                                            >
                                                {c('Action').t`Reset`}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-2 flex-shrink-0">
                                    <Button
                                        shape="outline"
                                        className="self-end"
                                        onClick={triggerReload}
                                        loading={loadingDownload}
                                        title={c('Action').t`Refresh`}
                                    >
                                        <Icon name="arrow-rotate-right" className="mr-2" />
                                        {c('Action').t`Refresh`}
                                    </Button>
                                    <Button
                                        shape="outline"
                                        className="self-end"
                                        onClick={() => withLoadingDownload(handleDownload(authLogs, organization))}
                                        loading={loadingDownload}
                                        title={c('Action').t`Export`}
                                    >
                                        <Icon name="arrow-down-line" className="mr-2" />
                                        {c('Action').t`Export`}
                                    </Button>
                                </div>
                            </form>
                            <div className="flex mb-4">{items.slice(0, 50)}</div>
                        </div>
                    </div>
                </div>
                <div className='flex self-end mb-4'>
                    <div className="flex flex-row flex-nowrap items-center gap-2">
                        <Toggle
                            id="detailed-monitoring-toggle"
                            loading={detailedMonitoringLoading}
                            checked={detailedMonitoring}
                            disabled={!monitoring}
                            onChange={() => withLoadingDetailedMonitoring(handleSetDetailedMonitoring())}
                        />
                        <div className="flex items-center">
                            {c('Info').t`Include device, location, and IP details`}
                            <Info
                                className="ml-2 shrink-0"
                                title={c('Info')
                                    .t`Allow logging of location and connection details`}
                            />
                        </div>
                    </div>
                    <div className="h-custom" style={{ '--h-custom': '2.5rem' }}></div>
                </div>
            </div>
            <B2BAuthLogsTable
                logs={authLogs}
                loading={loading}
                error={error}
                onTimeClick={handleClickableTime}
                onEmailOrIPClick={handleClickableEmailOrIP}
            />
            <div className="flex flex-column items-center justify-space-around">
                <Pagination
                    page={page}
                    total={total}
                    limit={10}
                    onSelect={onSelect}
                    onNext={onNext}
                    onPrevious={onPrevious}
                />
            </div>
        </SettingsSectionWide>
    );
};

export default AuthenticationLogs;
