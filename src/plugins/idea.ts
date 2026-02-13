import { createDashboardPlugin } from '../sdk/index.ts';

export const ideaPlugin = createDashboardPlugin({
  name: 'idea',
  plural: 'ideas',
  description: 'Save ideas for later',
  addVerb: 'Save',
});
