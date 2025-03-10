# CurrentUserState

`CurrentUserState` manages the current authenticated user in a PocketBase application, providing reactive access to the user data and authentication state.

## Usage

```typescript
import { CurrentUserState } from 'svelte-pocketbase-state';
import { pb } from './pocketbase';

const auth = new CurrentUserState({
	pb
});

// Use in a reactive context
$effect(() => {
	console.log('Current user:', auth.data);
	console.log('Is logged in:', auth.isLoggedIn);
});
```

## Parameters

| Parameter | Type       | Required | Description                    |
| --------- | ---------- | -------- | ------------------------------ |
| pb        | PocketBase | Yes      | The PocketBase client instance |

## Properties

| Property   | Type                           | Description                               |
| ---------- | ------------------------------ | ----------------------------------------- |
| data       | AuthModel \| null \| undefined | Reactive user data                        |
| loading    | boolean                        | Whether an auth operation is in progress  |
| isLoggedIn | boolean                        | Whether a user is currently authenticated |

## Methods

### Authentication

#### `login(email: string, password: string): Promise<void>`

Log in with email and password.

```typescript
try {
	await auth.login('user@example.com', 'password123');
	console.log('Logged in successfully');
} catch (error) {
	console.error('Login failed:', error);
}
```

#### `logout(): Promise<void>`

Log out the current user.

```typescript
await auth.logout();
```

## Real-time Authentication Updates

The CurrentUserState automatically listens to PocketBase's authentication state changes and updates the reactive state accordingly.

## Example: Login Component

```svelte
<script>
	import { CurrentUserState } from 'svelte-pocketbase-state';
	import { pb } from './pocketbase';

	const auth = new CurrentUserState({ pb });

	let email = $state('');
	let password = $state('');
	let errorMessage = $state('');

	async function handleLogin() {
		try {
			errorMessage = '';
			await auth.login(email, password);
		} catch (error) {
			errorMessage = error.message;
		}
	}

	async function handleLogout() {
		await auth.logout();
	}
</script>

{#if auth.isLoggedIn}
	<div>
		<h2>Welcome, {auth.data?.email}</h2>
		<button on:click={handleLogout} disabled={auth.loading}>
			{auth.loading ? 'Logging out...' : 'Log out'}
		</button>
	</div>
{:else}
	<form on:submit|preventDefault={handleLogin}>
		<h2>Log in</h2>

		{#if errorMessage}
			<div class="error">{errorMessage}</div>
		{/if}

		<div>
			<label for="email">Email</label>
			<input id="email" type="email" bind:value={email} required />
		</div>

		<div>
			<label for="password">Password</label>
			<input id="password" type="password" bind:value={password} required />
		</div>

		<button type="submit" disabled={auth.loading}>
			{auth.loading ? 'Logging in...' : 'Log in'}
		</button>
	</form>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 15px;
		max-width: 400px;
		margin: 0 auto;
	}

	.error {
		color: red;
		margin-bottom: 10px;
	}

	button {
		padding: 10px;
		background-color: #4caf50;
		color: white;
		border: none;
		cursor: pointer;
	}

	button:disabled {
		background-color: #cccccc;
	}
</style>
```

## Using with Other State Classes

You can use the `CurrentUserState` alongside other state classes to create auth-aware data fetching:

```typescript
import { CurrentUserState, CollectionState } from 'svelte-pocketbase-state';
import { pb } from './pocketbase';

// Auth state
const auth = new CurrentUserState({ pb });

// User-specific data with dynamic filter
const userTasks = new CollectionState({
	pb,
	collection: 'tasks',
	filter: 'user = "{$pb.authStore.model?.id}"',
	listen: true
});

// Use $effect to respond to auth changes
$effect(() => {
	if (auth.isLoggedIn) {
		// Refresh the tasks when user logs in
		userTasks.refetch();
	}
});
```
