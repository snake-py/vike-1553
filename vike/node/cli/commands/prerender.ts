import { runPrerenderFromCLI, runPrerender_forceExit } from '../../prerender/runPrerender.js'
import pc from '@brillout/picocolors'
import { resolve } from 'path'
import { projectInfo, assertUsage, assertWarning } from '../utils.js'

export async function prerender(options: {
  root?: string
  partial?: boolean
  noExtraDir?: boolean
  base?: string
  parallel?: number
  outDir?: string
  configFile?: string
}) {
  assertOptions()
  const { partial, noExtraDir, base, parallel, outDir, configFile } = options
  const root = options.root && resolve(options.root)
  await runPrerenderFromCLI({ partial, noExtraDir, base, root, parallel, outDir, configFile })
  runPrerender_forceExit()
}

function assertOptions() {
  // Using process.argv because cac convert names to camelCase
  const rawOptions = process.argv.slice(3)
  Object.values(rawOptions).forEach((option) => {
    assertUsage(
      !option.startsWith('--') ||
        [
          '--root',
          '--partial',
          '--noExtraDir',
          '--clientRouter',
          '--base',
          '--parallel',
          '--outDir',
          '--configFile'
        ].includes(option),
      'Unknown option: ' + option
    )
    assertWarning(
      false,
      `You set ${pc.cyan(option)}, but passing options to ${pc.cyan(
        '$ vike prerender'
      )} is deprecated: use the config file instead. See https://vike.dev/command-prerender.`,
      { onlyOnce: true }
    )
  })
}
