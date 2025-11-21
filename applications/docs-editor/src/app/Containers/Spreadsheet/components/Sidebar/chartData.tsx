import type { ChartSpec } from '@rowsncolumns/spreadsheet'
import omit from 'lodash/omit'

export function getBaseChartSpecData(spec: Partial<ChartSpec>): Partial<ChartSpec> {
  return omit(spec, ...(['chartType', 'smooth', 'stackedType', 'radius'] satisfies (keyof ChartSpec)[]))
}

type ChartType = {
  name: string
  icon: JSX.Element
  spec: Partial<ChartSpec>
}

const line: ChartType = {
  name: 'Line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path stroke="#A16A4A" d="m25 35.5 9-6.5 9 3.75 7.5-8 10.5-1.5"></path>
      <path stroke="#D1CFCD" strokeWidth="0.5" d="M8.5 51.25H81"></path>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth="0.5"
        d="M25 33.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61 21.25a2 2 0 1 1-.197.01zM43 30.25a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 30.25ZM50.5 22.75a2 2 0 1 1-.197.01zM34 27.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: false,
  },
}

const stackedLine: ChartType = {
  name: 'Stacked line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path stroke="#5E9C76" d="m25 26.25 9-7 9 4.25 7.5-8.75 11 3"></path>
      <path stroke="#A16A4A" d="m25 43.25 9-6.5 9 3.75 7.5-8L61 31"></path>
      <path stroke="#D1CFCD" strokeWidth="0.5" d="M8.5 51.25H81"></path>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth="0.5"
        d="M25 41a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61 29a2 2 0 1 1-.197.01zM43 38a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 38ZM50.5 30.5a2 2 0 1 1-.197.01zM34 35a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      ></path>
      <path
        fill="#BAE0BD"
        stroke="#5E9C76"
        strokeWidth="0.5"
        d="M25 24.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61.5 15.75a2 2 0 1 1-.197.01zM43 21.25a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 21.25ZM50.5 12.75a2 2 0 1 1-.197.01zM34 17.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: false,
    stackedType: 'STACKED',
  },
}

const smoothLine: ChartType = {
  name: 'Smooth line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        stroke="#5E9C76"
        d="m16.75 44 11.932-16.13a3 3 0 0 1 3.871-.837l17.289 9.626a3 3 0 0 0 3.947-.946L69.25 12.75"
      ></path>
      <path
        stroke="#A16A4A"
        d="m17 33.5 14.908-.864a4 4 0 0 1 3.604 1.842l6.104 9.568a4 4 0 0 0 5.06 1.475L72.5 33.5"
      ></path>
      <path stroke="#D1CFCD" strokeWidth="0.5" d="M8.5 51.25H81"></path>
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: true,
  },
}

const LINE_CHART_TYPES: ChartType[] = [line, stackedLine, smoothLine]

const clusteredColumn: ChartType = {
  name: 'Clustered Column',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path fill="#FFC49C" stroke="#A16A4A" d="M25.5 28.5V46h-7V28.5zM57.5 33v13h-7V33z"></path>
      <path fill="#BAE0BD" stroke="#5E9C76" d="M36 18v28h-7V18zM68 18v28h-7V18z"></path>
      <path stroke="#D1CFCD" strokeWidth="0.5" d="M8.5 51.25H81"></path>
    </svg>
  ),
  spec: {
    chartType: 'bar',
    stackedType: 'UNSTACKED',
  },
}

const stackedColumn: ChartType = {
  name: 'Stacked column',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path fill="#BAE0BD" stroke="#5E9C76" d="M31 18v8h-7v-8z"></path>
      <path fill="#FFC49C" stroke="#A16A4A" d="M31 28v18h-7V28z"></path>
      <path fill="#BAE0BD" stroke="#5E9C76" d="M41.5 23.5V33h-7v-9.5z"></path>
      <path fill="#FFC49C" stroke="#A16A4A" d="M41.5 35v11h-7V35z"></path>
      <path fill="#BAE0BD" stroke="#5E9C76" d="M52 28v8h-7v-8z"></path>
      <path fill="#FFC49C" stroke="#A16A4A" d="M52 38v8h-7v-8z"></path>
      <path fill="#BAE0BD" stroke="#5E9C76" d="M62.5 20.5V33h-7V20.5z"></path>
      <path fill="#FFC49C" stroke="#A16A4A" d="M62.5 35v11h-7V35z"></path>
      <path stroke="#D1CFCD" strokeWidth="0.5" d="M8.5 51.25H81"></path>
    </svg>
  ),
  spec: {
    chartType: 'bar',
    stackedType: 'STACKED',
  },
}

const COLUMN_CHART_TYPES: ChartType[] = [clusteredColumn, stackedColumn]

const _2DPie: ChartType = {
  name: '2D Pie',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <mask
        id="mask0_2_97"
        width="20"
        height="21"
        x="48"
        y="7"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M48.25 8c0-.276.224-.5.5-.494 2.423.063 4.816.576 7.058 1.516a19.7 19.7 0 0 1 6.407 4.336 20 20 0 0 1 4.282 6.488A20.2 20.2 0 0 1 67.994 27a.49.49 0 0 1-.494.5H48.75a.5.5 0 0 1-.5-.5z"
        ></path>
      </mask>
      <g mask="url(#mask0_2_97)">
        <path
          fill="#FFC49C"
          stroke="#A16A4A"
          strokeWidth="2"
          d="M48.25 8c0-.276.224-.5.5-.494 2.423.063 4.816.576 7.058 1.516a19.7 19.7 0 0 1 6.407 4.336 20 20 0 0 1 4.282 6.488A20.2 20.2 0 0 1 67.994 27a.49.49 0 0 1-.494.5H48.75a.5.5 0 0 1-.5-.5z"
        ></path>
      </g>
      <path
        fill="#BAE0BD"
        d="M62 31.75c.276 0 .5.224.494.5a19.43 19.43 0 0 1-3.196 10.195 19.06 19.06 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.92 18.92 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.5 19.5 0 0 1 1.081-11.122 19.2 19.2 0 0 1 6.998-8.639A18.83 18.83 0 0 1 43 12.507a.49.49 0 0 1 .5.493v18.25a.5.5 0 0 0 .5.5z"
      ></path>
      <mask
        id="mask1_2_97"
        width="41"
        height="42"
        x="23"
        y="11"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path fill="#fff" d="M63.5 11.5h-40v41h40z"></path>
        <path
          fill="#000"
          d="M62 31.75c.276 0 .5.224.494.5a19.43 19.43 0 0 1-3.196 10.195 19.06 19.06 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.92 18.92 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.5 19.5 0 0 1 1.081-11.122 19.2 19.2 0 0 1 6.998-8.639A18.83 18.83 0 0 1 43 12.507a.49.49 0 0 1 .5.493v18.25a.5.5 0 0 0 .5.5z"
        ></path>
      </mask>
      <g mask="url(#mask1_2_97)">
        <path
          stroke="#5E9C76"
          strokeWidth="2"
          d="M62 31.75c.276 0 .5.224.494.5a19.43 19.43 0 0 1-3.196 10.195 19.06 19.06 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.92 18.92 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.5 19.5 0 0 1 1.081-11.122 19.2 19.2 0 0 1 6.998-8.639A18.83 18.83 0 0 1 43 12.507a.49.49 0 0 1 .5.493v18.25a.5.5 0 0 0 .5.5z"
        ></path>
      </g>
    </svg>
  ),
  spec: {
    chartType: 'pie',
    stackedType: 'UNSTACKED',
    radius: [0, '75%'],
  },
}

const doughnut: ChartType = {
  name: 'Doughnut',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <mask
        id="mask0_2_110"
        width="19"
        height="20"
        x="47"
        y="9"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M47.25 10c0-.276.224-.5.5-.493 2.292.062 4.554.55 6.675 1.44a18.7 18.7 0 0 1 6.083 4.118 19 19 0 0 1 4.065 6.164A19.2 19.2 0 0 1 65.993 28a.49.49 0 0 1-.493.5h-8.833a.52.52 0 0 1-.513-.5 9.1 9.1 0 0 0-.665-2.958 9.05 9.05 0 0 0-1.933-2.932 8.9 8.9 0 0 0-2.893-1.958 8.8 8.8 0 0 0-2.913-.674.523.523 0 0 1-.5-.514z"
        ></path>
      </mask>
      <g mask="url(#mask0_2_110)">
        <path
          fill="#FFC49C"
          stroke="#A16A4A"
          strokeWidth="2"
          d="M47.25 10c0-.276.224-.5.5-.493 2.292.062 4.554.55 6.675 1.44a18.7 18.7 0 0 1 6.083 4.118 19 19 0 0 1 4.065 6.164A19.2 19.2 0 0 1 65.993 28a.49.49 0 0 1-.493.5h-8.833a.52.52 0 0 1-.513-.5 9.1 9.1 0 0 0-.665-2.958 9.05 9.05 0 0 0-1.933-2.932 8.9 8.9 0 0 0-2.893-1.958 8.8 8.8 0 0 0-2.913-.674.523.523 0 0 1-.5-.514z"
        ></path>
      </g>
      <path
        fill="#BAE0BD"
        d="M62 31.75c.276 0 .5.224.494.5a19.43 19.43 0 0 1-3.196 10.195 19.06 19.06 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.92 18.92 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.5 19.5 0 0 1 1.081-11.122 19.2 19.2 0 0 1 6.998-8.639A18.83 18.83 0 0 1 43 12.507a.49.49 0 0 1 .5.493v3.65c0 .277-.224.5-.5.51a14.3 14.3 0 0 0-7.506 2.451 14.56 14.56 0 0 0-5.307 6.552 14.8 14.8 0 0 0-.82 8.435 14.66 14.66 0 0 0 3.944 7.475 14.35 14.35 0 0 0 7.378 3.996c2.795.563 5.692.274 8.325-.83a14.45 14.45 0 0 0 6.467-5.378 14.73 14.73 0 0 0 2.42-7.611c.01-.276.233-.5.509-.5z"
      ></path>
      <mask
        id="mask1_2_110"
        width="41"
        height="42"
        x="23"
        y="11"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path fill="#fff" d="M63.5 11.5h-40v41h40z"></path>
        <path
          fill="#000"
          d="M62 31.75c.276 0 .5.224.494.5a19.43 19.43 0 0 1-3.196 10.195 19.06 19.06 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.92 18.92 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.5 19.5 0 0 1 1.081-11.122 19.2 19.2 0 0 1 6.998-8.639A18.83 18.83 0 0 1 43 12.507a.49.49 0 0 1 .5.493v3.65c0 .277-.224.5-.5.51a14.3 14.3 0 0 0-7.506 2.451 14.56 14.56 0 0 0-5.307 6.552 14.8 14.8 0 0 0-.82 8.435 14.66 14.66 0 0 0 3.944 7.475 14.35 14.35 0 0 0 7.378 3.996c2.795.563 5.692.274 8.325-.83a14.45 14.45 0 0 0 6.467-5.378 14.73 14.73 0 0 0 2.42-7.611c.01-.276.233-.5.509-.5z"
        ></path>
      </mask>
      <g mask="url(#mask1_2_110)">
        <path
          stroke="#5E9C76"
          strokeWidth="2"
          d="M62 31.75c.276 0 .5.224.494.5a19.43 19.43 0 0 1-3.196 10.195 19.06 19.06 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.92 18.92 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.5 19.5 0 0 1 1.081-11.122 19.2 19.2 0 0 1 6.998-8.639A18.83 18.83 0 0 1 43 12.507a.49.49 0 0 1 .5.493v3.65c0 .277-.224.5-.5.51a14.3 14.3 0 0 0-7.506 2.451 14.56 14.56 0 0 0-5.307 6.552 14.8 14.8 0 0 0-.82 8.435 14.66 14.66 0 0 0 3.944 7.475 14.35 14.35 0 0 0 7.378 3.996c2.795.563 5.692.274 8.325-.83a14.45 14.45 0 0 0 6.467-5.378 14.73 14.73 0 0 0 2.42-7.611c.01-.276.233-.5.509-.5z"
        ></path>
      </g>
    </svg>
  ),
  spec: {
    chartType: 'pie',
    stackedType: 'STACKED',
    radius: ['40%', '70%'],
  },
}

const PIE_CHART_TYPES: ChartType[] = [_2DPie, doughnut]

const treemap: ChartType = {
  name: 'Treemap',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path fill="#BAE0BD" stroke="#5E9C76" d="M42 17.5v14H23v-14zM53 24.5V46h-9V24.5zM64 24.5v14h-9v-14z"></path>
      <path fill="#FFC49C" stroke="#A16A4A" d="M42 33.5V46H23V33.5zM64 17.5v5H44v-5zM64 40.5V46h-9v-5.5z"></path>
    </svg>
  ),
  spec: {
    chartType: 'treemap',
    stackedType: 'UNSTACKED',
    radius: undefined,
  },
}

const sunburst: ChartType = {
  name: 'Sunburst',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <mask
        id="mask0_2_132"
        width="28"
        height="24"
        x="30"
        y="22"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M57.408 33.075c.274.033.471.281.43.554A14 14 0 1 1 33.03 22.8a.486.486 0 0 1 .698-.062l4.96 4.23c.21.18.233.495.07.718A6.48 6.48 0 1 0 50.36 32.75a.53.53 0 0 1 .574-.435z"
        ></path>
      </mask>
      <g mask="url(#mask0_2_132)">
        <path
          fill="#BAE0BD"
          stroke="#5E9C76"
          strokeWidth="2"
          d="M57.408 33.075c.274.033.471.281.43.554A14 14 0 1 1 33.03 22.8a.486.486 0 0 1 .698-.062l4.96 4.23c.21.18.233.495.07.718A6.48 6.48 0 1 0 50.36 32.75a.53.53 0 0 1 .574-.435z"
        ></path>
      </g>
      <mask
        id="mask1_2_132"
        width="38"
        height="30"
        x="25"
        y="21"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 1 1-35.236-10.357.49.49 0 0 1 .685-.153l4.118 2.65c.232.149.298.458.158.695A13.103 13.103 0 1 0 57.094 32c.01-.276.233-.5.51-.5z"
        ></path>
      </mask>
      <g mask="url(#mask1_2_132)">
        <path
          fill="#BAE0BD"
          stroke="#5E9C76"
          strokeWidth="2"
          d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 1 1-35.236-10.357.49.49 0 0 1 .685-.153l4.118 2.65c.232.149.298.458.158.695A13.103 13.103 0 1 0 57.094 32c.01-.276.233-.5.51-.5z"
        ></path>
      </g>
      <mask
        id="mask2_2_132"
        width="24"
        height="20"
        x="39"
        y="31"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 0 1-23.166 18.036.49.49 0 0 1-.364-.601l1.227-4.852a.515.515 0 0 1 .61-.371A12.995 12.995 0 0 0 56.986 32c.01-.276.233-.5.51-.5z"
        ></path>
      </mask>
      <g mask="url(#mask2_2_132)">
        <path
          fill="#BAE0BD"
          stroke="#5E9C76"
          strokeWidth="2"
          d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 0 1-23.166 18.036.49.49 0 0 1-.364-.601l1.227-4.852a.515.515 0 0 1 .61-.371A12.995 12.995 0 0 0 56.986 32c.01-.276.233-.5.51-.5z"
        ></path>
      </g>
      <mask
        id="mask3_2_132"
        width="38"
        height="35"
        x="25"
        y="12"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M32.493 45.986a.49.49 0 0 1-.699.075A19 19 0 1 1 62.97 30.41a.49.49 0 0 1-.478.515l-4.926.153a.515.515 0 0 1-.525-.484 13.07 13.07 0 1 0-21.556 10.822c.21.18.246.493.074.71z"
        ></path>
      </mask>
      <g mask="url(#mask3_2_132)">
        <path
          fill="#BAE0BD"
          stroke="#5E9C76"
          strokeWidth="2"
          d="M32.493 45.986a.49.49 0 0 1-.699.075A19 19 0 1 1 62.97 30.41a.49.49 0 0 1-.478.515l-4.926.153a.515.515 0 0 1-.525-.484 13.07 13.07 0 1 0-21.556 10.822c.21.18.246.493.074.71z"
        ></path>
      </g>
      <mask
        id="mask4_2_132"
        width="24"
        height="13"
        x="27"
        y="12"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M28.114 22.02a.49.49 0 0 1-.168-.683 19 19 0 0 1 22.664-7.65.49.49 0 0 1 .28.644l-1.853 4.618a.515.515 0 0 1-.653.286 13.024 13.024 0 0 0-15.304 5.166.515.515 0 0 1-.694.168z"
        ></path>
      </mask>
      <g mask="url(#mask4_2_132)">
        <path
          fill="#FFC49C"
          stroke="#A16A4A"
          strokeWidth="2"
          d="M28.114 22.02a.49.49 0 0 1-.168-.683 19 19 0 0 1 22.664-7.65.49.49 0 0 1 .28.644l-1.853 4.618a.515.515 0 0 1-.653.286 13.024 13.024 0 0 0-15.304 5.166.515.515 0 0 1-.694.168z"
        ></path>
      </g>
      <mask
        id="mask5_2_132"
        width="15"
        height="24"
        x="48"
        y="13"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M49.74 13.913a.49.49 0 0 1 .63-.314 19 19 0 0 1 12.086 22.417.49.49 0 0 1-.608.353l-4.751-1.296a.515.515 0 0 1-.36-.617 13.075 13.075 0 0 0-8.207-15.222.515.515 0 0 1-.317-.639z"
        ></path>
      </mask>
      <g mask="url(#mask5_2_132)">
        <path
          fill="#FFC49C"
          stroke="#A16A4A"
          strokeWidth="2"
          d="M49.74 13.913a.49.49 0 0 1 .63-.314 19 19 0 0 1 12.086 22.417.49.49 0 0 1-.608.353l-4.751-1.296a.515.515 0 0 1-.36-.617 13.075 13.075 0 0 0-8.207-15.222.515.515 0 0 1-.317-.639z"
        ></path>
      </g>
      <path fill="#BAE0BD" stroke="#5E9C76" d="M44 38.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"></path>
      <mask
        id="mask6_2_132"
        width="26"
        height="19"
        x="32"
        y="17"
        maskUnits="userSpaceOnUse"
        style={{ maskType: 'luminance' }}
      >
        <path
          fill="#fff"
          d="M32.39 24.61a.486.486 0 0 1-.167-.68 14 14 0 0 1 25.422 10.705.487.487 0 0 1-.604.356l-6.266-1.677a.53.53 0 0 1-.372-.617 6.514 6.514 0 0 0-11.733-4.941.53.53 0 0 1-.701.165z"
        ></path>
      </mask>
      <g mask="url(#mask6_2_132)">
        <path
          fill="#FFC49C"
          stroke="#A16A4A"
          strokeWidth="2"
          d="M32.39 24.61a.486.486 0 0 1-.167-.68 14 14 0 0 1 25.422 10.705.487.487 0 0 1-.604.356l-6.266-1.677a.53.53 0 0 1-.372-.617 6.514 6.514 0 0 0-11.733-4.941.53.53 0 0 1-.701.165z"
        ></path>
      </g>
    </svg>
  ),
  spec: {
    chartType: 'sunburst',
    stackedType: 'UNSTACKED',
    radius: undefined,
  },
}

const HIERARCHY_CHART_TYPES: ChartType[] = [treemap, sunburst]

export const CHART_TYPES: [string, ChartType[]][] = [
  ['Column', COLUMN_CHART_TYPES],
  ['Line', LINE_CHART_TYPES],
  ['Pie', PIE_CHART_TYPES],
  ['Hierarchy', HIERARCHY_CHART_TYPES],
]

/**
 * Maps a generic ChartSpec object to a specific ChartType.
 *
 * This function is necessary because chart variations (e.g., smooth line vs. stacked line)
 * are defined by a combination of properties (`chartType`, `smooth`, `stackedType`) rather
 * than a single, unique identifier.
 *
 * Ideally, if each ChartType had a unique ID that was stored in the spec, this logic
 * could be replaced with a simple and direct lookup, making it more robust and easier
 * to extend.
 */
export function getChartTypeBySpec(spec: Partial<ChartSpec>): ChartType | undefined {
  switch (spec.chartType) {
    case 'line':
      if (spec.smooth) {
        return smoothLine
      }
      if (spec.stackedType === 'STACKED') {
        return stackedLine
      }
      return line

    case 'bar':
      if (spec.stackedType === 'STACKED') {
        return stackedColumn
      }
      return clusteredColumn

    case 'pie':
      if (spec.stackedType === 'STACKED') {
        return doughnut
      }
      return _2DPie

    case 'treemap':
      return treemap

    case 'sunburst':
      return sunburst

    default:
      return undefined
  }
}

export function getChartTypeByName(name: string): ChartType | undefined {
  for (const [, chartTypes] of CHART_TYPES) {
    for (const chartType of chartTypes) {
      if (chartType.name === name) {
        return chartType
      }
    }
  }
  return undefined
}
