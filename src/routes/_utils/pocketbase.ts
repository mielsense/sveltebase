import PocketBase from 'pocketbase';

// Initialize PocketBase with your URL
export const pb = new PocketBase('http://127.0.0.1:8090');

// Export for use in other files
export default pb;
