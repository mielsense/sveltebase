<script lang="ts">
	import { CollectionState } from '$lib/index.js';
	import pb from './_utils/pocketbase.js';

	// Define your task type
	interface Task {
		id: string;
		title: string;
		completed: boolean;
		created: string;
		updated: string;
		collectionId: string;
		collectionName: string;
	}

	// Create a task collection using our library
	const tasks = new CollectionState<Task>({
		pb, // PocketBase instance
		collection: 'tasks', // Collection name
		sort: '-created', // Optional: sort order
		listen: true // Enable real-time updates
	});

	// For the input field
	let newTaskTitle = $state('');

	// Add a new task
	async function handleAddTask() {
		if (!newTaskTitle.trim()) return;

		try {
			await tasks.add({
				title: newTaskTitle,
				completed: false
			});
			newTaskTitle = '';
		} catch (error) {
			console.error('Failed to add task:', error);
		}
	}

	// Toggle task completion status
	async function handleToggleTask(id: string, completed: boolean) {
		try {
			await tasks.update(id, {
				completed: !completed
			});
		} catch (error) {
			console.error('Failed to update task:', error);
		}
	}

	// Delete a task
	async function handleDeleteTask(id: string) {
		try {
			await tasks.remove(id);
		} catch (error) {
			console.error('Failed to delete task:', error);
		}
	}
</script>

<div class="task-container">
	<h1>My Tasks</h1>

	<form onsubmit={handleAddTask} class="add-form">
		<input type="text" placeholder="Add a new task..." bind:value={newTaskTitle} />
		<button type="submit">Add</button>
	</form>

	{#if tasks.loading && !tasks.data}
		<p class="status-message">Loading tasks...</p>
	{:else if tasks.error}
		<p class="error-message">Error: {tasks.error.message}</p>
	{:else if !tasks.data || tasks.data.length === 0}
		<p class="status-message">No tasks yet. Add your first task above!</p>
	{:else}
		<ul class="task-list">
			{#each tasks.data as task (task.id)}
				<li class="task-item">
					<input
						type="checkbox"
						checked={task.completed}
						onchange={() => handleToggleTask(task.id, task.completed)}
						id={`task-${task.id}`}
					/>
					<label for={`task-${task.id}`} class:completed={task.completed}>
						{task.title}
					</label>
					<button class="delete-btn" onclick={() => handleDeleteTask(task.id)}> Delete </button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.task-container {
		max-width: 500px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		margin-bottom: 20px;
	}

	.add-form {
		display: flex;
		margin-bottom: 20px;
		gap: 10px;
	}

	input[type='text'] {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	button {
		padding: 8px 16px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.task-list {
		list-style: none;
		padding: 0;
	}

	.task-item {
		display: flex;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #eee;
	}

	.task-item label {
		flex: 1;
		margin-left: 10px;
		cursor: pointer;
	}

	.completed {
		text-decoration: line-through;
		color: #888;
	}

	.delete-btn {
		background-color: #f44336;
	}

	.status-message {
		text-align: center;
		color: #666;
		padding: 20px 0;
	}

	.error-message {
		color: #f44336;
		text-align: center;
		padding: 20px 0;
	}
</style>
