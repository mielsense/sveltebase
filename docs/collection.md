# CollectionState

`CollectionState` manages a PocketBase collection, providing reactive access to its records, real-time updates, and simplified CRUD operations.

## Usage

```typescript
import { CollectionState } from 'svelte-pocketbase-state';
import { pb } from './pocketbase';

interface Task {
	id: string;
	title: string;
	completed: boolean;
	user: string;
	created: string;
	updated: string;
	// Other PocketBase record fields
}

const tasks = new CollectionState<Task>({
	pb,
	collection: 'tasks',
	filter: 'user = "{$pb.authStore.model?.id}"',
	sort: '-created',
	listen: true
});
```

## Parameters

| Parameter  | Type       | Required | Default | Description                                 |
| ---------- | ---------- | -------- | ------- | ------------------------------------------- |
| pb         | PocketBase | Yes      | -       | The PocketBase client instance              |
| collection | string     | Yes      | -       | Name of the PocketBase collection           |
| filter     | string     | No       | -       | Filter query using PocketBase filter syntax |
| sort       | string     | No       | -       | Sort order (e.g., "-created,title")         |
| expand     | string     | No       | -       | Relations to expand (e.g., "user,category") |
| fields     | string[]   | No       | -       | Specific fields to return                   |
| pageSize   | number     | No       | 50      | Number of items per page                    |
| listen     | boolean    | No       | false   | Whether to subscribe to real-time updates   |

## Properties

| Property   | Type                              | Description                                  |
| ---------- | --------------------------------- | -------------------------------------------- |
| data       | RecordType[] \| null \| undefined | Reactive array of collection records         |
| loading    | boolean                           | Whether data is currently being loaded       |
| error      | Error \| null                     | Any error that occurred during data fetching |
| page       | number                            | Current page number                          |
| totalPages | number                            | Total number of pages                        |
| totalItems | number                            | Total number of items matching the query     |

## Methods

### Data Operations

#### `add(data: Partial<RecordType>): Promise<RecordType>`

Add a new record to the collection.

```typescript
const newTask = await tasks.add({
	title: 'Learn Svelte',
	completed: false,
	user: pb.authStore.model?.id
});
```

#### `update(id: string, data: Partial<RecordType>): Promise<RecordType>`

Update an existing record.

```typescript
await tasks.update(taskId, { completed: true });
```

#### `remove(id: string): Promise<boolean>`

Delete a record from the collection.

```typescript
await tasks.remove(taskId);
```

#### `getById(id: string): RecordType | undefined`

Get a record by its ID from the local state.

```typescript
const task = tasks.getById(taskId);
```

### Pagination

#### `nextPage(): Promise<void>`

Load the next page of results.

```typescript
await tasks.nextPage();
```

#### `prevPage(): Promise<void>`

Load the previous page of results.

```typescript
await tasks.prevPage();
```

#### `goToPage(page: number): Promise<void>`

Jump to a specific page.

```typescript
await tasks.goToPage(3);
```

### State Management

#### `refetch(): Promise<void>`

Manually refresh the data.

```typescript
await tasks.refetch();
```

## Real-time Updates

When `listen: true` is set, the CollectionState will automatically:

1. Subscribe to real-time changes on the collection
2. Update the reactive state when records are created, updated, or deleted
3. Clean up subscriptions when the component is destroyed

Real-time updates are handled through PocketBase's subscription API.

## Working with User Authentication

You can create dynamic filters using the current authenticated user:

```typescript
const myTasks = new CollectionState<Task>({
	pb,
	collection: 'tasks',
	filter: 'user = "{$pb.authStore.model?.id}"',
	listen: true
});
```

This ensures the collection only shows tasks belonging to the current user and updates when the user changes.

## Example: Task List Component

```svelte
<script>
	import { CollectionState } from 'svelte-pocketbase-state';
	import { pb } from './pocketbase';

	const tasks = new CollectionState({
		pb,
		collection: 'tasks',
		filter: 'user = "{$pb.authStore.model?.id}"',
		sort: '-created',
		listen: true
	});

	function addTask(title) {
		tasks.add({
			title,
			completed: false,
			user: pb.authStore.model?.id
		});
	}
</script>

{#if tasks.loading}
	<p>Loading...</p>
{:else if tasks.error}
	<p>Error: {tasks.error.message}</p>
{:else}
	<ul>
		{#each tasks.data || [] as task (task.id)}
			<li>
				<input
					type="checkbox"
					checked={task.completed}
					on:change={() => tasks.update(task.id, { completed: !task.completed })}
				/>
				{task.title}
				<button on:click={() => tasks.remove(task.id)}>Delete</button>
			</li>
		{/each}
	</ul>
{/if}
```
