import { createJournalPlugin } from '../sdk/index.ts';

export const thoughtPlugin = createJournalPlugin({
  name: 'thought',
  plural: 'thoughts',
  description: 'Capture fleeting thoughts',
  addVerb: 'Record',
});
