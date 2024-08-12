// import http from 'https'
import extract from 'extract-zip'
import fs from 'fs'
import { resolve } from 'path'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
// const response = await fetch(NPM_REGISTRY_BASE_URL + dependency)
// if (!response.ok) {
//   throw new Error('Failed to fetch dependency info')
// }
// const repoData = await response.json()
// const repoUrl = repoData.repository.url.replace('git+', '').replace('.git', '')
// const repoUrlWithBranch = repoUrl + '/archive/refs/heads/main.zip'

const NPM_REGISTRY_BASE_URL = 'https://registry.npmjs.org/'
const VIKE_REPO_URL = 'https://github.com/vikejs/vike-react'
const VIKE_MAIN_BRANCH = 'main'
const VIKE_DOWNLOAD_URL = VIKE_REPO_URL + '/archive/refs/heads/' + VIKE_MAIN_BRANCH + '.zip'

export async function scaffold(dependency: string) {
  console.log('Scaffolding dependency:', dependency)
  const zipPath = resolve('./ejected/tmp/packed', 'vike-react' + '.zip')
  const outPath = resolve('./ejected/tmp/unpacked', 'vike-react')
  await downloadSourceCode(VIKE_DOWNLOAD_URL, zipPath)
  await unpackZip(zipPath, outPath)
  await ejectDependency(dependency)
  await deleteTemp()
  console.log('Done')
}

async function ejectDependency(dependency: string) {
  const pathToScaffold = resolve(
    './ejected/tmp/unpacked/vike-react/' + 'vike-react-' + VIKE_MAIN_BRANCH + '/packages/' + dependency + '/'
  )
  console.log('Copying scaffold to ejected folder...', pathToScaffold)
  fs.cpSync(pathToScaffold, resolve('./ejected', dependency), { recursive: true })
}

async function deleteTemp() {
  fs.rmSync('./ejected/tmp', { recursive: true })
}

async function unpackZip(zipPath: string, outPath: string) {
  try {
    await extract(zipPath, { dir: outPath })
    console.log('Extraction complete')
  } catch (err) {}
}

async function downloadSourceCode(repoUrl: string, downloadPath: string) {
  console.log('Downloading: ', repoUrl)

  if (!fs.existsSync('./ejected/tmp/packed')) {
    fs.mkdirSync('./ejected/tmp/packed', { recursive: true })
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
