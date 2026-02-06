import { createJournalPlugin } from '../sdk/index.ts';

export const todoPlugin = createJournalPlugin({
  name: 'todo',
  plural: 'todos',
  description: 'Track things you need to do',
  addVerb: 'Add',
});
