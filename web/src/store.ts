import { writable, Writable } from 'svelte/store';
import type { OpenWhisk } from "./openwhisk";

export const inspector = writable([{n: 0, req: "", res:"", state:""},{n: 0, req: "", res:"", state:""}])

export const source = writable("")

export const submitting = writable("")

export const rewards = writable(0)

export const share = writable("")

export const ow: Writable<OpenWhisk> = writable(undefined);
