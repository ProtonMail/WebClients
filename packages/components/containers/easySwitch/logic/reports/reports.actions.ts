import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { deleteImportReport, getImportReportsList, rollbackImport } from '@proton/shared/lib/api/easySwitch';

import { EasySwitchThunkExtra } from '../store';
import { ApiImportReportListResponse } from '../types/api.types';
import { ReportSummaryID } from './reports.interface';

export const loadReports = createAsyncThunk<ApiImportReportListResponse, undefined, EasySwitchThunkExtra>(
    'reports/load',
    async (_, thunkApi) => {
        const activeImports = await thunkApi.extra.api<ApiImportReportListResponse>(getImportReportsList());
        return activeImports;
    }
);

export const deleteReportSummary = createAsyncThunk<void, { reportSummaryID: ReportSummaryID }, EasySwitchThunkExtra>(
    'reports/delete',
    async ({ reportSummaryID }, thunkApi) => {
        const state = thunkApi.getState();
        const reportSummary = state.reports.summaries[reportSummaryID];

        await thunkApi.extra.api(deleteImportReport(reportSummary.reportID, reportSummary.product));
        await thunkApi.extra.eventManager.call();
        thunkApi.extra.notificationManager.createNotification({ text: c('Success').t`Import record deleted` });
    }
);

export const rollbackReportSummary = createAsyncThunk<void, { reportSummaryID: ReportSummaryID }, EasySwitchThunkExtra>(
    'reports/rollback',
    async ({ reportSummaryID }, thunkApi) => {
        const state = thunkApi.getState();
        const reportSummary = state.reports.summaries[reportSummaryID];

        await thunkApi.extra.api(rollbackImport(reportSummary.reportID, [reportSummary.product]));
        await thunkApi.extra.eventManager.call();
        thunkApi.extra.notificationManager.createNotification({ text: c('Success').t`Undo in progress` });
    }
);
