-- Lencería CtS: catálogo público y panel privado.
-- Ejecuta este archivo completo en Supabase > SQL Editor después de crear un proyecto.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.products (
    id text primary key,
    nombre text not null,
    precio integer not null check (precio > 0),
    categoria text not null,
    img text not null,
    descripcion text not null default '',
    talles text[] not null default '{}',
    colores text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.products from anon, authenticated;
grant select on table public.admin_users to authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

drop policy if exists "Admins can see their own admin row" on public.admin_users;
create policy "Admins can see their own admin row"
    on public.admin_users for select to authenticated
    using (user_id = (select auth.uid()));

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.admin_users
        where user_id = (select auth.uid())
    );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
    on public.products for select to anon, authenticated using (true);
drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
    on public.products for insert to authenticated
    with check ((select private.is_admin()));
drop policy if exists "Admins can edit products" on public.products;
create policy "Admins can edit products"
    on public.products for update to authenticated
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
    on public.products for delete to authenticated
    using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view catalog photos" on storage.objects;
create policy "Public can view catalog photos"
    on storage.objects for select to anon, authenticated
    using (bucket_id = 'catalogo');
drop policy if exists "Admins can upload catalog photos" on storage.objects;
create policy "Admins can upload catalog photos"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'catalogo' and (select private.is_admin()));
drop policy if exists "Admins can update catalog photos" on storage.objects;
create policy "Admins can update catalog photos"
    on storage.objects for update to authenticated
    using (bucket_id = 'catalogo' and (select private.is_admin()))
    with check (bucket_id = 'catalogo' and (select private.is_admin()));
drop policy if exists "Admins can delete catalog photos" on storage.objects;
create policy "Admins can delete catalog photos"
    on storage.objects for delete to authenticated
    using (bucket_id = 'catalogo' and (select private.is_admin()));

insert into public.products (id, nombre, precio, categoria, img, descripcion, talles, colores)
values
    ('sonya', 'Sonya', 55000, 'Encaje', '../img/2.jpg', 'Conjunto de encaje rojo con ligas incluidas. Tela elástica con forro suave. Tallas S a XL.', array['S','M','L','XL'], array['Negro','Vinotinto','Rojo']),
    ('irelia', 'Irelia', 50000, 'Conjunto', '../img/3.jpg', 'Conjunto con tiras cruzadas y ligas. Encaje elástico que se adapta al cuerpo. Talla única.', array['Única'], array['Negro','Azul','Rojo','Verde','Rosa','Blanco']),
    ('riven', 'Riven', 50000, 'Conjunto', '../img/4.jpg', 'Conjunto de encaje con ligas y detalle de moño. Talla única con tiras regulables.', array['Única'], array['Negro','Rojo','Verde','Rosa','Blanco','Azul']),
    ('lilith', 'Lilith', 65000, 'Conjunto', '../img/5.jpg', 'Conjunto con short de encaje y transparencias. Copa con aro y tiras ajustables. Tallas S a XL.', array['S','M','L','XL'], array['Negro','Azul','Rojo','Blanco','Vinotinto']),
    ('xayah', 'Xayah', 65000, 'Pijama', '../img/6.jpg', 'Bata corta en tul con detalles de encaje. Ideal para estar en casa o para regalar. Tallas S a XL.', array['S','M','L','XL'], array['Negro','Rojo','Rosa','Blanco','Azul']),
    ('kayle', 'Kayle', 45000, 'Encaje', '../img/7.jpg', 'Conjunto de tiras cruzadas con encaje burgundy. Talla única adaptable.', array['Única'], array['Negro','Rosa','Rojo','Blanco','Vinotinto'])
on conflict (id) do nothing;

-- PASO FINAL: crea un usuario en Authentication > Users, copia su UUID y ejecuta,
-- sustituyendo UUID_DEL_ADMIN por ese UUID real:
-- insert into public.admin_users (user_id) values ('UUID_DEL_ADMIN') on conflict do nothing;
