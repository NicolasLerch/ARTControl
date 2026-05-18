import { createApp } from './app/create-app.js';
import { env } from './config/env.js';
const app = createApp();
const port = Number(process.env.PORT ?? env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`Backend escuchando en puerto ${port}`);
});
