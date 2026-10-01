-- Migración 2: reglas de seguridad (RLS) y perfiles automáticos

-- Devuelve el rol del usuario conectado (admin, conductor, etc.) con eso evitamos confusiones
create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.perfiles where id = (select auth.uid());
$$;

-- Crea el perfil automáticamente cuando alguien se registra asi vamos a tener un mejor control

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1), 'Usuario')
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();


create policy "Cada usuario ve su perfil"
  on public.perfiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Admin gestiona perfiles"
  on public.perfiles for all to authenticated
  using ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');


create policy "Todos ven barrios activos"
  on public.barrios for select to anon, authenticated
  using (activo);

create policy "Admin gestiona barrios"
  on public.barrios for all to authenticated
  using ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');


create policy "Personal ve camiones"
  on public.camiones for select to authenticated
  using ((select public.rol_actual()) in ('admin', 'supervisor', 'conductor'));

create policy "Admin gestiona camiones"
  on public.camiones for all to authenticated
  using ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');


create policy "Todos ven rutas activas"
  on public.rutas for select to anon, authenticated
  using (activa);

create policy "Admin gestiona rutas"
  on public.rutas for all to authenticated
  using ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');


create policy "Todos ven barrios de cada ruta"
  on public.rutas_barrios for select to anon, authenticated
  using (true);

create policy "Admin gestiona barrios de rutas"
  on public.rutas_barrios for all to authenticated
  using ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');


create policy "Todos ven sesiones"
  on public.sesiones_ruta for select to anon, authenticated
  using (true);

create policy "Conductor inicia su sesion"
  on public.sesiones_ruta for insert to authenticated
  with check (
    conductor_id = (select auth.uid())
    and (select public.rol_actual()) = 'conductor'
  );

create policy "Conductor actualiza su sesion"
  on public.sesiones_ruta for update to authenticated
  using (conductor_id = (select auth.uid()))
  with check (conductor_id = (select auth.uid()));

create policy "Admin gestiona sesiones"
  on public.sesiones_ruta for all to authenticated
  using ((select public.rol_actual()) = 'admin')
  with check ((select public.rol_actual()) = 'admin');


create policy "Todos ven posiciones de rutas en curso"
  on public.posiciones for select to anon, authenticated
  using (
    exists (
      select 1 from public.sesiones_ruta s
      where s.id = sesion_id and s.estado <> 'finalizada'
    )
  );

create policy "Personal ve todas las posiciones"
  on public.posiciones for select to authenticated
  using ((select public.rol_actual()) in ('admin', 'supervisor'));

create policy "Conductor envia posiciones de su sesion abierta"
  on public.posiciones for insert to authenticated
  with check (
    exists (
      select 1 from public.sesiones_ruta s
      where s.id = sesion_id
        and s.conductor_id = (select auth.uid())
        and s.estado <> 'finalizada'
    )
  );