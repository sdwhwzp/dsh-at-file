/**
 * The `at-file` settings namespace: the durable enable switch, pasted-mention
 * policy, and file-name filters managed from the Web settings page. Harness 0.1.7
 * stores them on the Loader profile entry; the runtime reads the live value on
 * every call, so changes take effect without a restart.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings';
import type { AtFileSettings } from './contract.ts';
/** The branded namespace name (the Web allowlist must list the same string). */
export declare const AT_FILE_NAMESPACE: SettingsNamespace;
/** Schemastery schema of the `at-file` namespace section. */
export declare const AtFileSettingsSchema: z<AtFileSettings>;
/**
 * Register the namespace with the settings provider and return its owner scope.
 * @param ctx - the plugin context carrying the settings provider.
 * @returns the owner scope backing the runtime's live enable check.
 */
export declare function registerAtFileSettings(ctx: Context): {
    get(): AtFileSettings;
    update(patch: Partial<AtFileSettings>): Promise<void>;
};
