import { writable } from 'svelte/store';

export const inspector = writable([{n: 0, req: "", res:"", state:""},{n: 0, req: "", res:"", state:""}])

export const source = writable("")

export const submitting = writable("")

export const rewards = writable(0)

export const share = writable("")