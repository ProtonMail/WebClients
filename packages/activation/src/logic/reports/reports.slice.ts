import { createSlice } from '@reduxjs/toolkit';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import * as globalAction from '../actions';
import * as action from './reports.actions';
import { normalizeReport, normalizeReports } from './reports.helpers';
import { ReportsState } from './reports.interface';

const initialState: ReportsState = { reports: {}, summaries: {}, loading: 'idle' };

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(action.loadReports.pending, (state) => {
            state.loading = 'pending';
        });
        builder.addCase(action.loadReports.rejected, (state) => {
            state.loading = 'failed';
        });
        builder.addCase(action.loadReports.fulfilled, (state, action) => {
            state.loading = 'success';
            if (action.payload) {
                const { reportsMap, reportSummariesMap } = normalizeReports(action.payload);
                state.reports = reportsMap;
                state.summaries = reportSummariesMap;
            }
        });

        builder.addCase(globalAction.event, (state, action) => {
            const reportEvents = action.payload.ImportReports;
            if (reportEvents) {
                reportEvents.forEach(({ ImportReport, Action, ID }) => {
                    if (ImportReport) {
                        if (EVENT_ACTIONS.CREATE === Action) {
                            const { report, reportSummaries } = normalizeReport(ImportReport);
                            state.reports[report.ID] = report;

                            reportSummaries.forEach((summary) => {
                                state.summaries[summary.localID] = summary;
                            });
                        }

                        if (EVENT_ACTIONS.UPDATE === Action) {
                            const { report, reportSummaries } = normalizeReport(ImportReport);

                            // Update reports
                            state.reports[report.ID] = report;

                            // Delete old summaries
                            const stateSummariesIds = Object.values(state.summaries)
                                .filter((summary) => summary.reportID === report.ID)
                                .map(({ localID }) => localID);
                            stateSummariesIds.forEach((stateSummaryID) => {
                                delete state.summaries[stateSummaryID];
                            });

                            // Create new summaries
                            reportSummaries.forEach((reportSummary) => {
                                state.summaries[reportSummary.localID] = reportSummary;
                            });
                        }
                    }

                    if (Action === EVENT_ACTIONS.DELETE) {
                        // Delete report and it's related summaries
                        delete state.reports[ID];
                        Object.values(state.summaries).forEach((summary) => {
                            if (summary.reportID === ID) {
                                delete state.summaries[summary.localID];
                            }
                        });
                    }
                });
            }
        });
    },
});

export default reportsSlice.reducer;
