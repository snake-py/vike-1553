import extract from 'extract-zip'
import fs from 'fs'
import { resolve } from 'path'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import { execSync } from 'child_process'

export async function scaffold(dependency: string) {
  const configs = getDependencyInfo(dependency)
  console.log('Scaffolding dependency:', dependency)
  console.log('Configs:', configs)
  const localDownloadPathZipped = resolve('./ejected/tmp/zipped.zip')
  const localDownloadPathUnzipped = resolve('./ejected/tmp/unzipped')
  await downloadSourceCode(configs.downloadPath, localDownloadPathZipped)
  await unpackZip(localDownloadPathZipped, localDownloadPathUnzipped)
  await ejectDependency(configs.packagePath, dependency)
  await deleteTemp()
  await setUpEjectedPackageJson(dependency, configs.cli.eject.exports)
  removeUnwantedFiles(dependency, configs.cli.eject.remove)
  setUpAsEjectedDependency(dependency)
  console.log('Done')
}

function getDependencyInfo(dependency: string) {
  // here I would need to add the code to resolve properly from node_modules
  return {
    downloadPath: 'https://github.com/vikejs/vike-react/archive/refs/heads/main.zip',
    packagePath: 'vike-react-main/packages/vike-react-query',
    cli: {
      eject: {
        exports: {
          './': './src/index.ts'
        },
        remove: ['./CHANGELOG.md']
      }
    }
  }
}

async function downloadSourceCode(repoUrl: string, downloadPath: string) {
  console.log('Downloading: ', repoUrl)

  if (!fs.existsSync('./ejected/tmp')) {
    fs.mkdirSync('./ejected/tmp', { recursive: true })
  }

  const outStream = fs.createWriteStream(downloadPath, { flags: 'w' })
  console.log('Downloading...')
  const response = await fetch(repoUrl)
  if (!response.ok) {
    throw new Error('Failed to download source code')
  }
  const stream = response.body
  if (!stream) {
    throw new Error('Failed to get response body')
  }
  // @ts-ignore
  await finished(Readable.fromWeb(stream).pipe(outStream))
}

async function unpackZip(zipPath: string, outPath: string) {
  try {
    await extract(zipPath, { dir: outPath })
    console.log('Extraction complete')
  } catch (err) {}
}

async function ejectDependency(packagePath: string, dependency: string) {
  const pathToScaffold = resolve('./ejected/tmp/unzipped/', packagePath + '/')
  console.log('Copying scaffold to ejected folder...', pathToScaffold)
  fs.cpSync(pathToScaffold, resolve('./ejected', dependency), { recursive: true })
}

async function deleteTemp() {
  fs.rmSync('./ejected/tmp', { recursive: true })
}

async function setUpEjectedPackageJson(dependency: string, exports: Record<string, string>) {
  const pathToPackageJson = resolve('./ejected', dependency, 'package.json')
  const packageJson = require(pathToPackageJson)
  console.log('Setting up package.json...')
  console.log(packageJson)
  packageJson.exports = exports
  // we could consider to rename the package so that it doesn't conflict with the original package
  // packageJson.name = `ejected-${dependency}`
  fs.writeFileSync(pathToPackageJson, JSON.stringify(packageJson, null, 2))
}

async function removeUnwantedFiles(dependency: string, remove: string[]) {
  remove.forEach((path) => {
    fs.rmSync(resolve('./ejected', dependency, path))
  })
}

async function setUpAsEjectedDependency(dependency: string) {
  const packageManager = detectPackageManager()
  execSync(`${packageManager} install`, { cwd: resolve('./ejected', dependency) })
}

function detectPackageManager() {
  // Check npm_config_user_agent first
  const agent = process.env.npm_config_user_agent
  if (agent) {
    const [program] = agent.toLowerCase().split('/')
    if (program === 'yarn') return 'yarn'
    if (program === 'pnpm') return 'pnpm'
    if (program === 'npm') return 'npm'
    if (program === 'bun') return 'bun'
  }

  // Check npm_execpath for yarn
  if (process.env.npm_execpath && process.env.npm_execpath.endsWith('yarn.js')) {
    return 'yarn'
  }

  // Check npm_command for npm
  if (process.env.npm_command) {
    return 'npm'
  }

  // Check _ environment variable as a last resort
  const parent = process.env._
  if (parent) {
    if (parent.endsWith('pnpx') || parent.endsWith('pnpm')) return 'pnpm'
    if (parent.endsWith('yarn')) return 'yarn'
    if (parent.endsWith('npm')) return 'npm'
    if (parent.endsWith('bun')) return 'bun'
  }

  // If all else fails, assume npm
  return 'npm'
}
