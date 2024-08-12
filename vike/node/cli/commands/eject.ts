import { resolve } from 'path'
import fs from 'fs'

export function eject(dependencies: string[]) {
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
}

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
