import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const developerDir = process.env.DEVELOPER_DIR ?? '/Applications/Xcode.app/Contents/Developer'
const deviceHub = path.resolve(developerDir, '../Applications/DeviceHub.app')
const commandEnv = { ...process.env, DEVELOPER_DIR: developerDir }

function execute(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    env: commandEnv,
    encoding: options.capture ? 'utf8' : undefined,
    stdio: options.capture ? 'pipe' : 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0 && !options.allowFailure) {
    const details = options.capture ? `\n${result.stderr || result.stdout}` : ''
    throw new Error(`${command} exited with code ${result.status}${details}`)
  }

  return result
}

function readOption(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

function getAvailableSimulators() {
  const result = execute('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], { capture: true })
  const groups = JSON.parse(result.stdout).devices

  return Object.entries(groups).flatMap(([runtime, devices]) =>
    devices
      .filter((device) => device.isAvailable)
      .map((device) => ({ ...device, runtime, sdkVersion: runtime.match(/iOS-(\d+-\d+)/)?.[1]?.replace('-', '.') })),
  )
}

async function chooseSimulator(simulators) {
  const targetId = readOption('--target')
  const targetName = readOption('--target-name')
  const targetSdkVersion = readOption('--target-name-sdk-version')

  if (targetId) return simulators.find((simulator) => simulator.udid === targetId)
  if (targetName) {
    return simulators.find(
      (simulator) => simulator.name === targetName && (!targetSdkVersion || simulator.sdkVersion === targetSdkVersion),
    )
  }

  const defaultIndex = Math.max(
    0,
    simulators.findIndex((simulator) => simulator.state === 'Booted' || simulator.name === 'iPhone 16 Pro'),
  )

  if (!process.stdin.isTTY) return simulators[defaultIndex]

  console.log('\nAvailable iOS simulators:')
  simulators.forEach((simulator, index) => {
    const marker = index === defaultIndex ? ' (default)' : ''
    console.log(`  ${index + 1}. ${simulator.name} — iOS ${simulator.sdkVersion}${marker}`)
  })

  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await prompt.question(`Choose a simulator [${defaultIndex + 1}]: `)
  prompt.close()

  const selectedIndex = answer.trim() === '' ? defaultIndex : Number(answer) - 1
  return simulators[selectedIndex]
}

async function main() {
  if (!existsSync(developerDir)) throw new Error(`Xcode developer directory not found: ${developerDir}`)
  if (!existsSync(deviceHub)) throw new Error(`Xcode Device Hub not found: ${deviceHub}`)

  execute('npm', ['run', 'build'])
  execute('npm', ['run', 'cap:sync'])

  const simulators = getAvailableSimulators()
  if (simulators.length === 0) throw new Error('No available iOS simulators found')

  const simulator = await chooseSimulator(simulators)
  if (!simulator) throw new Error('The requested iOS simulator was not found')

  const configuration = 'Debug'
  const scheme = 'App'
  const iosRoot = path.join(projectRoot, 'ios', 'App')
  const derivedData = path.join(projectRoot, 'ios', 'DerivedData', simulator.udid)
  const appBundle = path.join(derivedData, 'Build', 'Products', 'Debug-iphonesimulator', `${scheme}.app`)

  console.log(`\nBuilding ${scheme} for ${simulator.name}…`)
  execute(
    'xcrun',
    [
      'xcodebuild',
      '-project',
      'App.xcodeproj',
      '-scheme',
      scheme,
      '-configuration',
      configuration,
      '-destination',
      `id=${simulator.udid}`,
      '-derivedDataPath',
      derivedData,
    ],
    { cwd: iosRoot },
  )

  execute('open', [deviceHub])

  const boot = execute('xcrun', ['simctl', 'boot', simulator.udid], { capture: true, allowFailure: true })
  if (boot.status !== 0 && !boot.stderr.includes('current state: Booted')) {
    throw new Error(`Unable to boot ${simulator.name}:\n${boot.stderr}`)
  }

  execute('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b'])
  execute('xcrun', ['simctl', 'install', simulator.udid, appBundle])
  execute('xcrun', ['simctl', 'launch', simulator.udid, 'app.petworth.mobile'])

  console.log(`\nPet Worth is running on ${simulator.name}.`)
}

main().catch((error) => {
  console.error(`\n${error.message}`)
  process.exitCode = 1
})
