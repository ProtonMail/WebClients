export type ThemeFileType = 'light' | 'dark'

export interface FileConfig {
  path: string;
  type: ThemeFileType;
}

export interface ThemeConfig {
  output: string;
  files: FileConfig []
}

const config: ThemeConfig [] = [
  {
    output: './themes/contrast.css',
    files: [
      {
        path: './themes/contrast-standard-base.css',
        type: 'light'
      }
    ]
  },
  {
    output: './themes/dark.css',
    files: [
      {
        path: './themes/dark-standard-base.css',
        type: 'dark'
      },
      {
        path: './themes/dark-prominent-base.css',
        type: 'light'
      }
    ]
  },
  {
    output: './themes/default.css',
    files: [
      {
        path: './themes/default-standard-base.css',
        type: 'light'
      },
      {
        path: './themes/default-prominent-base.css',
        type: 'dark'
      }
    ]
  },
  {
    output: './themes/legacy.css',
    files: [
      {
        path: './themes/legacy-standard-base.css',
        type: 'light'
      },
      {
        path: './themes/legacy-prominent-base.css',
        type: 'dark'
      }
    ]
  },
  {
    output: './themes/light.css',
    files: [
      {
        path: './themes/light-standard-base.css',
        type: 'light'
      }
    ]
  },
  {
    output: './themes/monokai.css',
    files: [
      {
        path: './themes/monokai-standard-base.css',
        type: 'dark'
      },
      {
        path: './themes/monokai-prominent-base.css',
        type: 'dark'
      }
    ]
  }
]

export default config
