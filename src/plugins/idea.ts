import { createJournalPlugin } from '../sdk/index.ts';

export const ideaPlugin = createJournalPlugin({
  name: 'idea',
  plural: 'ideas',
  description: 'Save ideas for later',
  addVerb: 'Save',
});
