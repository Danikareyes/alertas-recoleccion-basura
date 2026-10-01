create extension if not exists postgis with schema extensions;


create type public.rol_usuario as enum ('admin', 'supervisor', 'conductor', 'ciudadano');
create type public.estado_sesion as enum ('en_ruta', 'pausada', 'senal_perdida', 'detenido', 'finalizada');


create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'ciudadano',
  creado_en timestamptz not null default now()
);


create table public.barrios (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  geom extensions.geometry (Polygon, 4326) not null,
  radio_aviso_m integer not null default 900 check (radio_aviso_m between 100 and 3000),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create index barrios_geom_idx on public.barrios using gist (geom);


create table public.camiones (
  id bigint generated always as identity primary key,
  placa text not null unique,
  descripcion text,
  activo boolean not null default true
);


create table public.rutas (
  id bigint generated always as identity primary key,
  nombre text not null,
  camion_id bigint references public.camiones (id),
  dias smallint[] not null default '{1,3,5}',
  hora_inicio time,
  hora_fin time,
  activa boolean not null default true
);


create table public.rutas_barrios (
  ruta_id bigint not null references public.rutas (id) on delete cascade,
  barrio_id bigint not null references public.barrios (id) on delete cascade,
  orden smallint not null default 1,
  primary key (ruta_id, barrio_id)
);


create table public.sesiones_ruta (
  id bigint generated always as identity primary key,
  ruta_id bigint not null references public.rutas (id),
  conductor_id uuid not null references public.perfiles (id),
  estado public.estado_sesion not null default 'en_ruta',
  motivo_pausa text,
  inicio timestamptz not null default now(),
  fin timestamptz,
  ultima_senal timestamptz
);


create table public.posiciones (
  id bigint generated always as identity primary key,
  sesion_id bigint not null references public.sesiones_ruta (id) on delete cascade,
  geom extensions.geometry (Point, 4326) not null,
  velocidad_kmh real,
  precision_m real,
  registrado_en timestamptz not null,
  recibido_en timestamptz not null default now()
);
create index posiciones_geom_idx on public.posiciones using gist (geom);
create index posiciones_sesion_tiempo_idx on public.posiciones (sesion_id, registrado_en);


alter table public.perfiles       enable row level security;
alter table public.barrios        enable row level security;
alter table public.camiones       enable row level security;
alter table public.rutas          enable row level security;
alter table public.rutas_barrios  enable row level security;
alter table public.sesiones_ruta  enable row level security;
alter table public.posiciones     enable row level security;