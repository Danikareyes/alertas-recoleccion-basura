create view public.barrios_mapa
with (security_invoker = true)  
as
select
  id,
  nombre,
  radio_aviso_m,
  extensions.st_asgeojson(geom)::json as geojson
from public.barrios;