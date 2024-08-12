import { cac } from 'cac'
import { projectInfo, assertUsage } from './utils.js'
import { prerender } from './commands/prerender.js'
import { eject } from './commands/eject.js'
import { scaffold } from './commands/scaffold.js'

const cli = cac(projectInfo.projectName)

cli
  .command('prerender', 'Pre-render the HTML of your pages', { allowUnknownOptions: true })
  .option('--configFile <path>', '[string] Path to vite.config.js')
  .action(prerender)

cli
  .command('eject [...dependencies]', 'Ejects a dependency from node_modules', { allowUnknownOptions: true })
  .action(eject)

cli.command('scaffold <dependency>', 'Scaffolds a vike dependency', { allowUnknownOptions: true }).action(scaffold)

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
