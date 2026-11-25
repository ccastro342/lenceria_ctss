# Conectar el panel de Lencería CtS con Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard). No compartas la contraseña de la base de datos.
2. En **SQL Editor**, pega y ejecuta todo `supabase/setup.sql`. Esto crea el catálogo, las reglas de seguridad y el espacio de fotos; también importa los seis productos actuales.
3. En **Authentication → Users**, crea un usuario con el correo y contraseña que usarás en el panel. No habilites el registro público.
4. Copia el UUID de ese usuario. En **SQL Editor**, ejecuta la última instrucción comentada de `setup.sql`, sustituyendo `UUID_DEL_ADMIN` por el UUID real. Solo los usuarios registrados en `admin_users` podrán cambiar productos o subir fotos.
5. En **Project Settings → API**, copia la **Project URL** y la **publishable key** (o la `anon` key si el proyecto aún muestra las claves heredadas). En `supabase-config.js`, completa `url` y `publishableKey`.
6. Publica `supabase-config.js` en el repositorio. Esa URL y esa clave son públicas por diseño; la protección real está en las políticas RLS y en la lista `admin_users`. Nunca pongas una `service_role` o secret key en la página.
7. Abre el panel desde el enlace al final del carrito e inicia sesión con el correo y contraseña que creaste.

Si la cuenta necesita restablecer su contraseña, puedes hacerlo desde **Authentication → Users** en el panel de Supabase.
