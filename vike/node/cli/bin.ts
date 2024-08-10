import { cac } from 'cac'
import { resolve } from 'path'
import { runPrerenderFromCLI, runPrerender_forceExit } from '../prerender/runPrerender.js'
import { projectInfo, assertUsage, assertWarning } from './utils.js'
import pc from '@brillout/picocolors'
import fs from 'fs'

const cli = cac(projectInfo.projectName)

cli
  .command('prerender', 'Pre-render the HTML of your pages', { allowUnknownOptions: true })
  .option('--configFile <path>', '[string] Path to vite.config.js')
  .action(async (options) => {
    assertOptions()
    const { partial, noExtraDir, base, parallel, outDir, configFile } = options
    const root = options.root && resolve(options.root)
    await runPrerenderFromCLI({ partial, noExtraDir, base, root, parallel, outDir, configFile })
    runPrerender_forceExit()
  })

cli
  .command('eject [...dependencies]', 'Ejects a dependency from node_modules', { allowUnknownOptions: true })
  .action((dependencies) => {
    const successFullEjections = []
    for (const dependency of dependencies) {
      try {
        copyDependency(dependency)
        successFullEjections.push(dependency)
      } catch (error) {
        console.log('Error ejecting dependency:', dependency)
      }
    }
    console.log('Ejected dependencies:', successFullEjections)
    if (successFullEjections.length > 0) {
      updatePackageJson(successFullEjections)
      console.log('we updated your package.json and linked the dependencies to the ejected folder')
      console.log('finalize the ejection by running npm install')
    } else {
      console.log('No dependencies ejected')
    }
  })

function updatePackageJson(successFullEjections: string[]) {
  const packageJson = require(resolve('./package.json'))
  const updatedDependencies: Record<string, string> = {}
  for (const key in packageJson.dependencies) {
    if (!successFullEjections.includes(key)) {
      updatedDependencies[key] = packageJson.dependencies[key]
    } else {
      updatedDependencies[key] = packageJson.dependencies[`file:./ejected/${key}`]
    }
  }
  packageJson.dependencies = updatedDependencies
  fs.writeFile(resolve('./package.json'), JSON.stringify(packageJson, null, 2), (err) => {
    if (err) {
      // console.log('Error Found:', err)
    } else {
      console.log('Updated package.json')
    }
  })
}

function copyDependency(dependency: string) {
  const dependencyPath = resolve('./node_modules', dependency)
  console.log('Dependency path:', dependencyPath)
  if (!fs.existsSync(dependencyPath)) {
    throw new Error('Dependency not found in node_modules')
  }

  if (!fs.existsSync('./ejected')) {
    fs.mkdirSync('./ejected')
  }
  if (fs.existsSync(resolve('./ejected', dependency))) {
    throw new Error('Dependency already ejected')
  }

  fs.cpSync(dependencyPath, resolve('./ejected', dependency), {
    recursive: true,
    force: true
  })
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

// Listen to unknown commands
cli.on('command:*', () => {
  assertUsage(false, 'Unknown command: ' + cli.args.join(' '))
})

cli.help()
cli.version(projectInfo.projectVersion)

cli.parse(process.argv.length === 2 ? [...process.argv, '--help'] : process.argv)

process.on('unhandledRejection', (rejectValue) => {
  throw rejectValue
})
