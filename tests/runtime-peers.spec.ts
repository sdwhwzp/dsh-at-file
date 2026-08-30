import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findRuntimePeer, linkRuntimePeers } from '../scripts/link-runtime-peers.mjs'

describe('runtime peer materialization', () => {
  it('finds pnpm store packages and links them into a local plugin', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-at-file-peers-'))
    const runtime = join(root, 'runtime', 'node_modules')
    const plugin = join(root, 'plugin')
    const name = '@deepseek-ai/dsh-settings'
    const source = join(runtime, '.pnpm', 'settings', 'node_modules', '@deepseek-ai', 'dsh-settings')
    try {
      await mkdir(source, { recursive: true })
      await writeFile(join(source, 'package.json'), JSON.stringify({ name }))
      expect(findRuntimePeer(runtime, name)).toBe(source)
      linkRuntimePeers(plugin, runtime, [name])
      expect(JSON.parse(await readFile(
        join(plugin, 'node_modules', '@deepseek-ai', 'dsh-settings', 'package.json'),
        'utf8',
      ))).toEqual({ name })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('fails clearly when a required runtime package is absent', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-at-file-peers-'))
    try {
      expect(() => linkRuntimePeers(join(root, 'plugin'), join(root, 'runtime'), ['missing']))
        .toThrow(/runtime peer missing not found/)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
