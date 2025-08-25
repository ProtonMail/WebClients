import { escapeCsvValue } from "@proton/components/helpers/escapeCsvValue";
import type { B2BAuthLog } from "@proton/shared/lib/authlog";
import downloadFile from "@proton/shared/lib/helpers/downloadFile";
import type { EnhancedMember, OrganizationExtended, Recipient } from "@proton/shared/lib/interfaces";
import { fromUnixTime } from "date-fns";
import { convertEnhancedMembersToContactEmails, convertGroupMemberToRecipient } from "../../organization/groups/NewGroupMemberInput";

export const handleDownload = async (logs: B2BAuthLog[], organization: OrganizationExtended) => {
    const data = logs.reduce((acc, log) => {
        const {
            Time,
            Description,
            Status,
            User,
            IP,
            Location,
            InternetProvider,
            AppVersion,
            Device,
            ProtectionDesc,
        } = log;

        const row = [
            fromUnixTime(Time).toISOString(),
            Description,
            Status || '',
            User?.Name || '',
            User?.Email || '',
            IP || '',
            Location || '',
            InternetProvider || '',
            AppVersion || '',
            Device || '',
        ];

        if (organization?.Settings?.HighSecurity === 1) {
            row.push(ProtectionDesc || '');
        }

        acc.push(row.map(escapeCsvValue).join(','));
        return acc;
    }, [
        [
            'Time',
            'Event',
            'Status',
            'User Name',
            'User Email',
            'IP',
            'Location',
            'InternetProvider',
            'AppVersion',
            'Device',
            'Protection',
        ].map(escapeCsvValue).join(','),
    ]);

    const filename = 'events.csv';
    const csvString = data.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });

    downloadFile(blob, filename);
};

export interface AuthLogsQueryParams {
    Emails: string[];
    StartTime?: string;
    EndTime?: string;
    IP?: string;
}

export const mapMembersToRecipients = (members: EnhancedMember[], Emails: string[]): Recipient[] => {
    const filteredMembers = convertEnhancedMembersToContactEmails(
        members.filter((member) => member.Addresses?.some((address) => Emails.includes(address.Email)))
    );
    const uniqueMembers = Array.from(
        new Map(filteredMembers.map((m) => [m.ContactID, m])).values()
    );
    const newRecipients = convertGroupMemberToRecipient(uniqueMembers);

    return newRecipients;
}