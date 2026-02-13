import { createDashboardPlugin } from '../sdk/index.ts';

export const todoPlugin = createDashboardPlugin({
  name: 'todo',
  plural: 'todos',
  description: 'Track things you need to do',
  addVerb: 'Add',
});
