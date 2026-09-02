#!/usr/bin/env node
/** Materialize the Host peers that a profile `link:` package cannot inherit. */
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, symlinkSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Host packages imported by the built entry points at runtime. */
export const RUNTIME_PEERS = [
  '@deepseek-ai/dsh-typert-protocol',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-invariants',
]

/** Return whether `directory` contains the requested package manifest. */
function isPackage(directory, name) {
  const manifest = join(directory, 'package.json')
  if (!existsSync(manifest)) return false
  try {
    return JSON.parse(readFileSync(manifest, 'utf8')).name === name
  } catch {
    return false
  }
}

/** Locate one package in a pnpm node_modules tree. */
export function findRuntimePeer(nodeModules, name) {
  const direct = join(nodeModules, ...name.split('/'))
  if (isPackage(direct, name)) return direct
  const store = join(nodeModules, '.pnpm')
  if (!existsSync(store)) return undefined
  for (const entry of readdirSync(store)) {
    const candidate = join(store, entry, 'node_modules', ...name.split('/'))
    if (isPackage(candidate, name)) return candidate
  }
  return undefined
}

/** lstat without following a broken link. */
function lstatExists(path) {
  try {
    lstatSync(path)
    return true
  } catch {
    return false
  }
}

/** Link every required Host peer into one local plugin checkout. */
export function linkRuntimePeers(pluginRoot, runtimeNodeModules, peers = RUNTIME_PEERS) {
  for (const name of peers) {
    const destination = join(pluginRoot, 'node_modules', ...name.split('/'))
    if (isPackage(destination, name)) continue
    const source = findRuntimePeer(runtimeNodeModules, name)
    if (source === undefined) {
      throw new Error(`dsh-at-file: runtime peer ${name} not found under ${runtimeNodeModules}`)
    }
    mkdirSync(dirname(destination), { recursive: true })
    if (existsSync(destination) || lstatExists(destination)) unlinkSync(destination)
    symlinkSync(source, destination, process.platform === 'win32' ? 'junction' : 'dir')
  }
}

/** Resolve the runtime node_modules directory for a deployment or developer checkout. */
export function runtimeNodeModules(pluginRoot, environment = process.env) {
  const candidates = [
    environment.DSH_RUNTIME_NODE_MODULES,
    join(pluginRoot, 'node_modules'),
    join(homedir(), 'apps', 'dsh-runtime', 'current', 'node_modules'),
    resolve(pluginRoot, '../deepseek-harness/node_modules'),
  ].filter(value => typeof value === 'string' && value.trim() !== '')
  const found = candidates.find(candidate => RUNTIME_PEERS.every(peer => findRuntimePeer(candidate, peer) !== undefined))
  if (found === undefined) {
    throw new Error('dsh-at-file: cannot locate DSH runtime peers; set DSH_RUNTIME_NODE_MODULES')
  }
  return found
}

const ownPath = fileURLToPath(import.meta.url)
if (process.argv[1] !== undefined && resolve(process.argv[1]) === ownPath) {
  const pluginRoot = resolve(dirname(ownPath), '..')
  linkRuntimePeers(pluginRoot, runtimeNodeModules(pluginRoot))
}
