import { exec } from 'child_process'
import { existsSync, readFileSync, readSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

try {
  const scriptPath = fileURLToPath(import.meta.url)
  const vendorPath = path.resolve(scriptPath, '..', '..', '..', '..', 'vendor')
  if (existsSync(vendorPath)) {
    process.chdir(vendorPath)
    const envFile = path.resolve(vendorPath, '.env')
    const exportScript = path.resolve(import.meta.dirname, 'export-vars-from-env.sh')
    const baseCommand = 'yarn install'
    exec(
      existsSync(envFile) ? `env $(cat ${envFile} | xargs) ${baseCommand}` : baseCommand,
      (error, stdout, stderr) => {
        // eslint-disable-next-line no-console
        console.log(stdout)
        console.error(stderr)
      },
    )
  }
} catch {}
