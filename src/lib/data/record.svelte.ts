import type { RecordModel, RecordSubscription } from 'pocketbase';
import { PocketBaseState, type PocketBaseStateOptions } from '../utils/pb-state.svelte.js';

export type RecordStateOptions = PocketBaseStateOptions & {
	collection: string;
	id?: string;
	filter?: string;
	expand?: string;
	fields?: string[];
	autosave?: boolean;
};

export class RecordState<
	RecordType extends RecordModel = RecordModel
> extends PocketBaseState<RecordType> {
	protected readonly collectionName: string;
	protected readonly recordId?: string;
	protected readonly filterQuery?: string;
	protected readonly expandQuery?: string;
	protected readonly fieldsQuery?: string[];
	protected readonly autosaveEnabled: boolean;

	constructor({
		pb,
		collection,
		id,
		filter,
		expand,
		fields,
		listen = false,
		autosave = false
	}: RecordStateOptions) {
		super({ pb, listen });

		this.collectionName = collection;
		this.recordId = id;
		this.filterQuery = filter;
		this.expandQuery = expand;
		this.fieldsQuery = fields;
		this.autosaveEnabled = autosave;

		// Validate that either an ID or a filter is provided
		if (!id && !filter) {
			console.warn('RecordState: Either id or filter should be provided to fetch a record');
		}
	}

	protected async fetch_data(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const options: Record<string, any> = {};

			if (this.expandQuery) options.expand = this.expandQuery;
			if (this.fieldsQuery) options.fields = this.fieldsQuery.join(',');

			let record: RecordType;

			if (this.recordId) {
				// Fetch by ID
				record = await this.pb
					.collection(this.collectionName)
					.getOne<RecordType>(this.recordId, options);
			} else if (this.filterQuery) {
				// Fetch first record matching filter
				const response = await this.pb.collection(this.collectionName).getList<RecordType>(1, 1, {
					filter: this.filterQuery,
					...options
				});

				if (response.items.length === 0) {
					this.data = null;
					return;
				}

				record = response.items[0];
			} else {
				// Neither ID nor filter provided
				this.data = null;
				return;
			}

			this.data = record;
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
			this.data = null;
		} finally {
			this.loading = false;
		}
	}

	protected subscribe_to_data(): void {
		if (this.unsubscribe) {
			return;
		}

		// First fetch the initial data
		this.fetch_data().then(() => {
			// If we have a record ID from the fetch, use it for subscription
			const id = this.data?.id || this.recordId;

			if (!id) {
				// Can't subscribe without an ID
				return;
			}

			try {
				// Set up the real-time subscription
				this.pb
					.collection(this.collectionName)
					.subscribe<RecordType>(id, (data: RecordSubscription<RecordType>) => {
						// Handle different types of events
						if (data.action === 'update') {
							this.data = data.record;
						} else if (data.action === 'delete') {
							this.data = null;
						}
					});

				this.unsubscribe = () => {
					this.pb.collection(this.collectionName).unsubscribe(id);
				};
			} catch (err) {
				this.error = err instanceof Error ? err : new Error(String(err));
			}
		});
	}

	// Save the current record
	public async save(): Promise<RecordType | null> {
		if (!this.data) {
			return null;
		}

		this.loading = true;
		this.error = null;

		try {
			const id = this.data.id;

			// Extract fields that can be updated (remove readonly fields like id, created, updated)
			const { id: _, created, updated, collectionId, collectionName, ...updateData } = this.data;

			const record = await this.pb
				.collection(this.collectionName)
				.update<RecordType>(id, updateData as any);

			// If not using real-time updates, update the data manually
			if (!this.listen) {
				this.data = record;
			}

			return record;
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
			throw this.error;
		} finally {
			this.loading = false;
		}
	}

	// Set data with optional autosave
	public set data(value: RecordType | null | undefined) {
		this.dataState.value = value;

		if (this.autosaveEnabled && value) {
			this.save().catch((err) => {
				console.error('Autosave failed:', err);
			});
		}
	}

	public get data(): RecordType | null | undefined {
		return this.dataState.value;
	}

	// Update a specific field
	public async updateField<K extends keyof RecordType>(
		field: K,
		value: RecordType[K]
	): Promise<RecordType | null> {
		if (!this.data) {
			return null;
		}

		// Update the local data
		this.data = { ...this.data, [field]: value } as RecordType;

		if (!this.autosaveEnabled) {
			// If autosave is disabled, explicitly save the changes
			return this.save();
		}

		return this.data;
	}
}
