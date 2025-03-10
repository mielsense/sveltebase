import type { RecordModel, RecordSubscription } from 'pocketbase';
import { PocketBaseState, type PocketBaseStateOptions } from '../utils/pb-state.svelte.js';

export type CollectionStateOptions = PocketBaseStateOptions & {
	collection: string;
	filter?: string;
	sort?: string;
	expand?: string;
	fields?: string[];
	pageSize?: number;
};

export class CollectionState<RecordType extends RecordModel = RecordModel> extends PocketBaseState<
	RecordType[]
> {
	protected readonly collectionName: string;
	protected readonly filterQuery?: string;
	protected readonly sortQuery?: string;
	protected readonly expandQuery?: string;
	protected readonly fieldsQuery?: string[];
	protected readonly pageSizeValue?: number;

	// Track the current page for pagination
	public page = $state(1);
	public totalPages = $state(1);
	public totalItems = $state(0);

	constructor({
		pb,
		collection,
		filter,
		sort,
		expand,
		fields,
		pageSize,
		listen = false
	}: CollectionStateOptions) {
		super({ pb, listen });

		this.collectionName = collection;
		this.filterQuery = filter;
		this.sortQuery = sort;
		this.expandQuery = expand;
		this.fieldsQuery = fields;
		this.pageSizeValue = pageSize;
	}

	protected async fetch_data(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const options: Record<string, any> = {
				page: this.page
			};

			if (this.filterQuery) options.filter = this.filterQuery;
			if (this.sortQuery) options.sort = this.sortQuery;
			if (this.expandQuery) options.expand = this.expandQuery;
			if (this.fieldsQuery) options.fields = this.fieldsQuery.join(',');
			if (this.pageSizeValue) options.perPage = this.pageSizeValue;

			const response = await this.pb
				.collection(this.collectionName)
				.getList<RecordType>(this.page, this.pageSizeValue || 50, options);

			this.data = response.items;
			this.totalPages = response.totalPages;
			this.totalItems = response.totalItems;
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
			this.data = [];
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
			// Then set up the real-time subscription
			try {
				const subscription = this.pb
					.collection(this.collectionName)
					.subscribe<RecordType>(
						this.filterQuery || '*',
						(data: RecordSubscription<RecordType>) => {
							if (!this.data) {
								this.data = [];
							}

							// Handle different types of events
							if (data.action === 'create') {
								this.data = [...this.data, data.record];
							} else if (data.action === 'update') {
								this.data = this.data.map((item) =>
									item.id === data.record.id ? data.record : item
								);
							} else if (data.action === 'delete') {
								this.data = this.data.filter((item) => item.id !== data.record.id);
							}
						}
					);

				this.unsubscribe = () => {
					this.pb.collection(this.collectionName).unsubscribe();
				};
			} catch (err) {
				this.error = err instanceof Error ? err : new Error(String(err));
			}
		});
	}

	// Helper method to get a specific record by ID
	public getById(id: string): RecordType | undefined {
		return this.data?.find((record) => record.id === id);
	}

	// CRUD operations
	public async add(data: Partial<RecordType>): Promise<RecordType> {
		this.loading = true;
		this.error = null;

		try {
			const record = await this.pb.collection(this.collectionName).create<RecordType>(data);

			// Optimistic update if not using real-time
			if (!this.listen && this.data) {
				this.data = [...this.data, record];
			}

			return record;
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
			throw this.error;
		} finally {
			this.loading = false;
		}
	}

	public async update(id: string, data: Partial<RecordType>): Promise<RecordType> {
		this.loading = true;
		this.error = null;

		try {
			const record = await this.pb.collection(this.collectionName).update<RecordType>(id, data);

			// Optimistic update if not using real-time
			if (!this.listen && this.data) {
				this.data = this.data.map((item) => (item.id === id ? { ...item, ...record } : item));
			}

			return record;
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
			throw this.error;
		} finally {
			this.loading = false;
		}
	}

	public async remove(id: string): Promise<boolean> {
		this.loading = true;
		this.error = null;

		try {
			await this.pb.collection(this.collectionName).delete(id);

			// Optimistic update if not using real-time
			if (!this.listen && this.data) {
				this.data = this.data.filter((item) => item.id !== id);
			}

			return true;
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
			throw this.error;
		} finally {
			this.loading = false;
		}
	}

	// Pagination methods
	public async nextPage(): Promise<void> {
		if (this.page < this.totalPages) {
			this.page++;
			await this.fetch_data();
		}
	}

	public async prevPage(): Promise<void> {
		if (this.page > 1) {
			this.page--;
			await this.fetch_data();
		}
	}

	public async goToPage(page: number): Promise<void> {
		if (page >= 1 && page <= this.totalPages) {
			this.page = page;
			await this.fetch_data();
		}
	}
}
