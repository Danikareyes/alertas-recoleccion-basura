alter table public.posiciones
  add column lat double precision,
  add column lng double precision;


create or replace function public.posicion_desde_lat_lng()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.geom is null then
    new.geom := extensions.st_setsrid(extensions.st_makepoint(new.lng, new.lat), 4326);
  end if;


  new.lat := extensions.st_y(new.geom);
  new.lng := extensions.st_x(new.geom);
  return new;
end;
$$;

create trigger posiciones_lat_lng
  before insert or update on public.posiciones
  for each row execute function public.posicion_desde_lat_lng();


alter publication supabase_realtime add table public.posiciones, public.sesiones_ruta;