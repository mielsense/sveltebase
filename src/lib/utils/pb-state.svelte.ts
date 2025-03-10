import type PocketBase from 'pocketbase';
import { WritableState } from './state.svelte.js';

export type PocketBaseStateOptions = {
	pb: PocketBase;
	listen?: boolean;
};

export class PocketBaseState<DataType> {
	protected readonly pb: PocketBase;
	protected readonly listen: boolean;
	protected readonly dataState: WritableState<DataType | null | undefined>;
	protected readonly initPromise: Promise<void>;

	public loading = $state(false);
	public error = $state<Error | null>(null);
	protected unsubscribe?: () => void;

	constructor({ pb, listen = false }: PocketBaseStateOptions) {
		this.dataState = new WritableState<DataType | undefined | null>(undefined, () => {
			this.start();
			return this.stop;
		});

		this.pb = pb;
		this.listen = listen;

		this.initPromise = this.init();
	}

	async start(): Promise<void> {
		await this.initPromise;

		if (this.listen) {
			this.subscribe_to_data();
		} else {
			this.fetch_data();
		}
	}

	private stop = () => {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = undefined;
		}
	};

	get data(): DataType | null | undefined {
		return this.dataState.value;
	}

	set data(data: DataType | null | undefined) {
		this.dataState.value = data;
	}

	protected async init(): Promise<void> {
		return;
	}

	protected async fetch_data(): Promise<void> {}

	protected subscribe_to_data(): void {}

	public refetch(): Promise<void> {
		return this.fetch_data();
	}
}
