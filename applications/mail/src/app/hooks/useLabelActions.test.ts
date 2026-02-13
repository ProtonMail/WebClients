import { renderHook } from '@testing-library/react-hooks';

import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useLabelActions } from './useLabelActions';

jest.mock('@proton/mail/store/labels/hooks');

describe('useLabelActions', () => {
    const useFoldersMock = useFolders as jest.Mock;
    const useLabelsMock = useLabels as jest.Mock;

    beforeEach(() => {
        useFoldersMock.mockReturnValue([[], jest.fn()]);
        useLabelsMock.mockReturnValue([[], jest.fn()]);
    });

    afterEach(() => {
        useFoldersMock.mockClear();
        useLabelsMock.mockClear();
    });

    it('should render correct action for inbox label', () => {
        const { result } = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.INBOX));
        expect(result.current[0]).toEqual(['trash', 'archive', 'spam']);
    });

    it('should render correct action for drafts and all drafts label', () => {
        const resDrafts = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.DRAFTS));
        expect(resDrafts.result.current[0]).toEqual(['trash', 'archive', 'delete']);

        const resAllDrafts = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.ALL_DRAFTS));
        expect(resAllDrafts.result.current[0]).toEqual(['trash', 'archive', 'delete']);
    });

    it('should render correct action for sent and all sent label', () => {
        const resSent = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.SENT));
        expect(resSent.result.current[0]).toEqual(['trash', 'archive', 'delete']);

        const resAllSent = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.ALL_SENT));
        expect(resAllSent.result.current[0]).toEqual(['trash', 'archive', 'delete']);
    });

    it('should render correct action for scheduled and snooze label', () => {
        const resScheduled = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.SCHEDULED));
        expect(resScheduled.result.current[0]).toEqual(['trash', 'archive']);

        const resSnoozed = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.SNOOZED));
        expect(resSnoozed.result.current[0]).toEqual(['trash', 'archive']);
    });

    it('should render correct action for starred label', () => {
        const { result } = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.STARRED));
        expect(result.current[0]).toEqual(['trash', 'archive', 'spam']);
    });

    it('should render correct action for archive label', () => {
        const { result } = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.ARCHIVE));
        expect(result.current[0]).toEqual(['trash', 'inbox', 'spam']);
    });

    it('should render correct action for spam label', () => {
        const { result } = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.SPAM));
        expect(result.current[0]).toEqual(['trash', 'nospam', 'delete']);
    });

    it('should render correct action for trash label', () => {
        const { result } = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.TRASH));
        expect(result.current[0]).toEqual(['inbox', 'archive', 'delete']);
    });

    it('should render correct action for all mail and almost all mail label', () => {
        const resAllMail = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.ALL_MAIL));
        expect(resAllMail.result.current[0]).toEqual(['trash', 'archive', 'spam']);

        const resAlmostAllMail = renderHook(() => useLabelActions(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL));
        expect(resAlmostAllMail.result.current[0]).toEqual(['trash', 'archive', 'spam']);
    });

    it('should render correct action for custom folder label', () => {
        const customFolder = 'customFolder';
        const customLabel = 'customLabel';

        useFoldersMock.mockReturnValue([[{ ID: customFolder }], jest.fn()]);
        useLabelsMock.mockReturnValue([[{ ID: customLabel }], jest.fn()]);

        const resFolders = renderHook(() => useLabelActions(customFolder));
        expect(resFolders.result.current[0]).toEqual(['trash', 'archive', 'spam']);

        const resLabels = renderHook(() => useLabelActions(customLabel));
        expect(resLabels.result.current[0]).toEqual(['trash', 'archive', 'spam']);
    });
});
