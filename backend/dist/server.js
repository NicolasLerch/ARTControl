import { createApp } from './app/create-app.js';
import { env } from './config/env.js';
const app = createApp();
app.listen(env.PORT, () => {
    console.log(`Backend escuchando en ${env.APP_URL}`);
});
