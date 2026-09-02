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

  it('targets Alpha.4 while retaining the upstream client-layout fallback', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
      dsh?: { engines?: { dsh?: string } }
      peerDependencies?: Record<string, string>
    }
    const clientSource = await readFile(new URL('../src/client/index.ts', import.meta.url), 'utf8')

    expect(manifest.dsh?.engines?.dsh).toBe('>=0.1.2-alpha.4 <0.2.0')
    expect(manifest.peerDependencies).toHaveProperty('@deepseek-ai/dsh-client-store')
    expect(manifest.peerDependencies).toHaveProperty('@deepseek-ai/dsh-client-runtime')
    expect(clientSource).not.toContain('@deepseek-ai/dsh-client-runtime')
  })
})
