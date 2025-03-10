import type PocketBase from 'pocketbase';
import type { AuthModel } from 'pocketbase';
import { WritableState } from '../utils/state.svelte.js';

type CurrentUserStateOptions = {
	pb: PocketBase;
};

export class CurrentUserState {
	private readonly pb: PocketBase;
	public userState: WritableState<AuthModel | null | undefined>;
	public loading = $state(false);

	constructor({ pb }: CurrentUserStateOptions) {
		this.pb = pb;

		this.userState = new WritableState<AuthModel | null | undefined>(undefined, () => {
			this.start();
			return this.stop;
		});
	}

	private start() {
		this.loading = true;

		// Initialize with current auth state
		this.userState.value = this.pb.authStore.model;
		this.loading = false;

		// Set up listener for auth state changes
		this.pb.authStore.onChange((token, model) => {
			this.userState.value = model;
		});
	}

	private stop = () => {};

	public get data() {
		return this.userState.value;
	}

	public get isLoggedIn() {
		return this.pb.authStore.isValid;
	}

	public async login(email: string, password: string) {
		this.loading = true;
		try {
			await this.pb.collection('users').authWithPassword(email, password);
		} catch (error) {
			throw error;
		} finally {
			this.loading = false;
		}
	}

	public async logout() {
		this.loading = true;
		try {
			this.pb.authStore.clear();
		} finally {
			this.loading = false;
		}
	}
}
