import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { TrendChart } from '../charts/TrendChart/TrendChart';
import { ChartCard } from './ChartCard';

vi.mock('react-chartjs-2', () => ({
    Line: () => <div data-testid="line" />,
}));

const chart = () => screen.queryByTestId('line');

const data = [
    { label: 'Zurich', value: 42 },
    { label: 'Paris', value: 91 },
];

describe('ChartCard', () => {
    it('keeps the chart out of the accessibility tree, and the heading it was given in', () => {
        render(
            <ChartCard>
                <ChartCard.Row>
                    <h3>Load per location</h3>
                </ChartCard.Row>
                <ChartCard.Row className="flex-auto min-h-0">
                    <TrendChart data={data} />
                </ChartCard.Row>
            </ChartCard>
        );

        expect(screen.getByRole('heading', { name: 'Load per location', level: 3 })).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(chart()).toBeInTheDocument();
    });

    it('imposes no heading of its own on what it is given', () => {
        render(
            <ChartCard>
                <ChartCard.Row>Load</ChartCard.Row>
            </ChartCard>
        );

        expect(screen.getByText('Load')).toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders as many rows as it is given, in the order they were written', () => {
        render(
            <ChartCard>
                <ChartCard.Row className="justify-space-between">
                    <h3>Load</h3>
                    <button type="button">Download</button>
                </ChartCard.Row>
                <ChartCard.Row>Peak 99%</ChartCard.Row>
                <ChartCard.Row className="flex-auto min-h-0">
                    <TrendChart data={data} />
                </ChartCard.Row>
                <ChartCard.Row>Current load 72%</ChartCard.Row>
            </ChartCard>
        );

        const rows = screen.getByRole('heading', { name: 'Load' }).parentElement?.parentElement;

        expect(rows?.children).toHaveLength(4);
        expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        expect(screen.getByText('Peak 99%')).toBeInTheDocument();
        expect(screen.getByText('Current load 72%')).toBeInTheDocument();
    });

    it('spaces the rows a step apart, and takes another step when asked', () => {
        const { container, rerender } = render(
            <ChartCard>
                <ChartCard.Row>Load</ChartCard.Row>
            </ChartCard>
        );

        const rows = () => screen.getByText('Load').parentElement;

        expect(rows()).toHaveClass('gap-4');

        rerender(
            <ChartCard gap={6}>
                <ChartCard.Row>Load</ChartCard.Row>
            </ChartCard>
        );

        expect(rows()).toHaveClass('gap-6');
        expect(container.querySelector('.gap-4')).not.toBeInTheDocument();
    });

    it('passes a class through to the row, so the caller lays out what is inside it', () => {
        render(
            <ChartCard>
                <ChartCard.Row className="flex justify-space-between">Load</ChartCard.Row>
            </ChartCard>
        );

        expect(screen.getByText('Load')).toHaveClass('flex', 'justify-space-between');
    });

    it('renders whatever a caller puts in a row, chart or not', () => {
        render(
            <ChartCard>
                <ChartCard.Row className="flex-auto min-h-0">
                    <p>No load recorded for this server yet</p>
                </ChartCard.Row>
            </ChartCard>
        );

        expect(screen.getByText('No load recorded for this server yet')).toBeInTheDocument();
        expect(chart()).not.toBeInTheDocument();
    });
});
