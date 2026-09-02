/**
 * The profile bundle owns the complete `@` candidate surface: the Harness
 * reference source must be disabled before the file-only source is inserted.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('profile bundle', () => {
  it('replaces the built-in reference menu with the file-only source', async () => {
    const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    const disableAt = patch.indexOf('- id: ui-reference\n  disabled: true')
    const insertAt = patch.indexOf('- insert:\n    - id: dsh-at-file')

    expect(disableAt).toBeGreaterThanOrEqual(0)
    expect(insertAt).toBeGreaterThan(disableAt)
  })

  it('declares Alpha.4 peers while retaining the upstream client-layout fallback', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
      dsh?: { engines?: { dsh?: string } }
      peerDependencies?: Record<string, string>
      peerDependenciesMeta?: Record<string, { optional?: boolean }>
    }
    const buildSource = await readFile(new URL('../build.mjs', import.meta.url), 'utf8')
    const dshPeers = Object.fromEntries(
      Object.entries(manifest.peerDependencies ?? {}).filter(([name]) => name.startsWith('@deepseek-ai/dsh-')),
    )

    expect(manifest.dsh?.engines?.dsh).toBe('>=0.1.2-alpha.4 <0.2.0')
    expect(dshPeers).toEqual({
      '@deepseek-ai/dsh-agent': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-api-remotes': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-connection': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-locale': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-store': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-ui-conversation': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-ui-input-trigger': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-ui-settings': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-client-ui-slots': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-llm': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-settings': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-typert-protocol': '^0.1.2-alpha.4',
      '@deepseek-ai/dsh-typert-registry': '^0.1.2-alpha.4',
    })
    expect(manifest.peerDependencies).not.toHaveProperty('@deepseek-ai/dsh-client-runtime')
    expect(manifest.peerDependenciesMeta).not.toHaveProperty('@deepseek-ai/dsh-client-runtime')
    expect(buildSource).toContain("require('@deepseek-ai/dsh-client-runtime/client')")
  })
})
