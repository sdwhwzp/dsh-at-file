/**
 * The `at-file` settings namespace: the durable enable switch, pasted-mention
 * policy, and file-name filters managed from the Web settings page. Harness 0.1.7
 * stores them on the Loader profile entry; the runtime reads the live value on
 * every call, so changes take effect without a restart.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import type { AtFileSettings } from './contract.ts'
import type { FileIgnoreRule } from './contract.ts'
import { DEFAULT_IGNORE_FILES } from './defaults.ts'

/** The branded namespace name (the Web allowlist must list the same string). */
export const AT_FILE_NAMESPACE = 'at-file' as SettingsNamespace

/** Schemastery schema of the `at-file` namespace section. */
export const AtFileSettingsSchema: z<AtFileSettings> = z.object({
  enabled: z.boolean().default(true),
  ignoreFiles: z.array(z.union([
    z.string(),
    z.object({
      kind: z.union(['exact', 'regex'] as const),
      pattern: z.string(),
      caseSensitive: z.boolean(),
    }) as z<FileIgnoreRule>,
  ])).default([...DEFAULT_IGNORE_FILES]),
  ignoreFilesConfigured: z.boolean().default(false),
  workspaceIgnoreFiles: z.array(z.object({
    workspace: z.string(),
    ignoreFiles: z.array(z.union([
      z.string(),
      z.object({
        kind: z.union(['exact', 'regex'] as const),
        pattern: z.string(),
        caseSensitive: z.boolean(),
      }) as z<FileIgnoreRule>,
    ])),
  })).default([]),
  ignorePastedMentions: z.boolean().default(true),
})

/**
 * Register the namespace with the settings provider and return its owner scope.
 * @param ctx - the plugin context carrying the settings provider.
 * @returns the owner scope backing the runtime's live enable check.
 */
export function registerAtFileSettings(ctx: Context): {
  get(): AtFileSettings
  update(patch: Partial<AtFileSettings>): Promise<void>
} {
  const owner = ctx.fiber as typeof ctx.fiber & {
    entry?: { options: { id: string } }
    config?: { preferences?: AtFileSettings }
  }
  return {
    get: () => {
      const id = owner.entry?.options.id
      const row = id === undefined ? undefined : ctx.settings.describe().find(row => row.ns === id)
      const value = row?.value as { preferences?: AtFileSettings } | undefined
      return AtFileSettingsSchema(value?.preferences ?? owner.config?.preferences ?? {})
    },
    update: async (patch) => {
      const id = owner.entry?.options.id
      if (id === undefined) throw new Error('at-file settings require a Loader profile entry')
      const descriptor = ctx.settings.describe().find(row => row.ns === id)
      if (descriptor === undefined) throw new Error('at-file profile settings form is unavailable')
      await ctx.settings.update(id as SettingsNamespace, { preferences: patch }, descriptor.revision)
    },
  }
}
