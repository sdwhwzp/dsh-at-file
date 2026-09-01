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

  it('targets the Alpha.3 client platform without the removed client runtime', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
      dsh?: { client?: { inject?: string[] } }
    }
    const clientSource = await readFile(new URL('../src/client/index.ts', import.meta.url), 'utf8')

    expect(manifest.dsh?.client?.inject).toContain('@deepseek-ai/dsh-client-store')
    expect(JSON.stringify(manifest)).not.toContain('@deepseek-ai/dsh-client-runtime')
    expect(clientSource).not.toContain('@deepseek-ai/dsh-client-runtime')
  })
})
