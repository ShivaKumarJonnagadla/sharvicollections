import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`\n🚀 Sharvi Collections API`);
  console.log(`   → http://localhost:${env.PORT}/api/${env.API_VERSION}`);
  console.log(`   → Docs: http://localhost:${env.PORT}/api/docs`);
  console.log(`   → Env:  ${env.NODE_ENV}\n`);
});
