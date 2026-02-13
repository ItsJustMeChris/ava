import { createDashboardPlugin } from '../sdk/index.ts';

export const thoughtPlugin = createDashboardPlugin({
  name: 'thought',
  plural: 'thoughts',
  description: 'Capture fleeting thoughts',
  addVerb: 'Record',
});
