# RecordState

`RecordState` manages a single PocketBase record, providing reactive access to its data, real-time updates, and simplified update operations.

## Usage

```typescript
import { RecordState } from 'svelte-pocketbase-state';
import { pb } from './pocketbase';

interface Profile {
	id: string;
	name: string;
	bio: string;
	avatar: string;
	created: string;
	updated: string;
	// Other PocketBase record fields
}

// Create by ID
const profile = new RecordState<Profile>({
	pb,
	collection: 'profiles',
	id: 'RECORD_ID',
	listen: true,
	autosave: false
});

// Or create by filter (fetches first matching record)
const currentUserProfile = new RecordState<Profile>({
	pb,
	collection: 'profiles',
	filter: 'user = "{$pb.authStore.model?.id}"',
	listen: true
});
```

## Parameters

| Parameter  | Type       | Required | Default | Description                                 |
| ---------- | ---------- | -------- | ------- | ------------------------------------------- |
| pb         | PocketBase | Yes      | -       | The PocketBase client instance              |
| collection | string     | Yes      | -       | Name of the PocketBase collection           |
| id         | string     | No\*     | -       | ID of the specific record to fetch          |
| filter     | string     | No\*     | -       | Filter query to find a single record        |
| expand     | string     | No       | -       | Relations to expand (e.g., "user,category") |
| fields     | string[]   | No       | -       | Specific fields to return                   |
| listen     | boolean    | No       | false   | Whether to subscribe to real-time updates   |
| autosave   | boolean    | No       | false   | Automatically save changes to the record    |

\*Either `id` or `filter` must be provided

## Properties

| Property | Type                            | Description                                  |
| -------- | ------------------------------- | -------------------------------------------- |
| data     | RecordType \| null \| undefined | Reactive record data                         |
| loading  | boolean                         | Whether data is currently being loaded       |
| error    | Error \| null                   | Any error that occurred during data fetching |

## Methods

### Data Operations

#### `save(): Promise<RecordType | null>`

Save changes to the record.

```typescript
// Update local data
profile.data.name = 'New Name';
profile.data.bio = 'Updated bio';

// Save changes to PocketBase
await profile.save();
```

#### `updateField<K>(field: K, value: RecordType[K]): Promise<RecordType | null>`

Update a specific field.

```typescript
await profile.updateField('name', 'New Name');
```

#### `refetch(): Promise<void>`

Manually refresh the record data.

```typescript
await profile.refetch();
```

## Real-time Updates

When `listen: true` is set, the RecordState will automatically:

1. Subscribe to real-time changes on the specific record
2. Update the reactive state when the record is updated or deleted
3. Clean up subscriptions when the component is destroyed

## Autosave

When `autosave: true` is set, any changes to `data` will be automatically saved to the database.

```typescript
const profile = new RecordState<Profile>({
	pb,
	collection: 'profiles',
	id: 'RECORD_ID',
	listen: true,
	autosave: true
});

// This will automatically save to the database
profile.data.name = 'New Name';
```

## Example: User Profile Component

```svelte
<script>
	import { RecordState } from 'svelte-pocketbase-state';
	import { pb } from './pocketbase';

	const profile = new RecordState({
		pb,
		collection: 'profiles',
		filter: 'user = "{$pb.authStore.model?.id}"',
		listen: true
	});

	async function saveProfile() {
		try {
			await profile.save();
			alert('Profile saved!');
		} catch (error) {
			console.error('Failed to save profile:', error);
		}
	}
</script>

{#if profile.loading}
	<p>Loading profile...</p>
{:else if profile.error}
	<p>Error: {profile.error.message}</p>
{:else if profile.data}
	<form on:submit|preventDefault={saveProfile}>
		<div>
			<label for="name">Name</label>
			<input id="name" bind:value={profile.data.name} />
		</div>

		<div>
			<label for="bio">Bio</label>
			<textarea id="bio" bind:value={profile.data.bio}></textarea>
		</div>

		<button type="submit">Save</button>
	</form>
{:else}
	<p>Profile not found</p>
{/if}
```
