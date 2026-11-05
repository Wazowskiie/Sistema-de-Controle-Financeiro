-- =====================================================================
-- Segurança: liga o RLS e corrige perfis/funções
-- Ainda NÃO aplicado. Conferir os papéis na seção 1 antes de rodar.
-- =====================================================================

-- 1) Papéis de quem já tem conta (sem isso ninguém é admin e o RLS
--    esconderia vendas e despesas de todo mundo)
insert into public.perfis_usuario (auth_user_id, papel)
select id, case email
    when 'isabelandrade965@gmail.com'   then 'admin'
    -- AJUSTAR conforme a resposta da dona do sistema:
    when 'denilsonandrade947@gmail.com' then 'admin'
    when 'vendas.rebraut@gmail.com'     then 'vendedor'
    when 'maysoncunha085@gmail.com'     then 'vendedor'
    else 'visualizador'
  end
from auth.users
on conflict (auth_user_id) do update set papel = excluded.papel;

-- 2) Funções auxiliares: search_path fixo e fora do alcance de quem não está logado
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis_usuario where auth_user_id = auth.uid() and papel = 'admin');
$$;

create or replace function public.meu_vendedor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from vendedores where auth_user_id = auth.uid() limit 1;
$$;

-- admin ou vendedor (visualizador só lê)
create or replace function public.pode_editar()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis_usuario where auth_user_id = auth.uid() and papel in ('admin','vendedor'));
$$;

-- conta nova entra como visualizador (antes entrava como admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis_usuario (auth_user_id, papel)
  values (new.id, 'visualizador')
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter function public.set_atualizado_em() set search_path = public;
alter function public.marcar_veiculo_vendido() set search_path = public;

revoke execute on function public.is_admin(), public.meu_vendedor_id(), public.pode_editar(), public.handle_new_user() from anon, public;
grant execute on function public.is_admin(), public.meu_vendedor_id(), public.pode_editar() to authenticated;

-- 3) Remove as regras "liberado para todos" (valiam até para quem não está logado)
drop policy if exists allow_all on public.interacoes_leads;
drop policy if exists allow_all on public.veiculo_extras;
drop policy if exists veiculo_extras_full on public.veiculo_extras;
drop policy if exists perfil_authenticated_select on public.perfis_usuario; -- duplicada de perfil_proprio_select

create policy veiculo_extras_select on public.veiculo_extras for select to authenticated using (true);
create policy veiculo_extras_escrita on public.veiculo_extras for all to authenticated
  using (public.pode_editar()) with check (public.pode_editar());

-- 4) Visualizador e vendedor não podem gravar nas tabelas que hoje aceitam qualquer usuário logado
drop policy if exists clientes_insert on public.clientes;
drop policy if exists clientes_update on public.clientes;
create policy clientes_insert on public.clientes for insert to authenticated with check (public.pode_editar());
create policy clientes_update on public.clientes for update to authenticated using (public.pode_editar()) with check (public.pode_editar());

drop policy if exists veiculos_insert on public.veiculos;
drop policy if exists veiculos_update on public.veiculos;
create policy veiculos_insert on public.veiculos for insert to authenticated with check (public.pode_editar());
create policy veiculos_update on public.veiculos for update to authenticated using (public.pode_editar()) with check (public.pode_editar());

drop policy if exists transportes_all on public.transportes;
create policy transportes_select on public.transportes for select to authenticated using (true);
create policy transportes_escrita on public.transportes for all to authenticated
  using (public.pode_editar()) with check (public.pode_editar());

drop policy if exists interacoes_insert on public.interacoes_leads;
create policy interacoes_insert on public.interacoes_leads for insert to authenticated with check (public.pode_editar());

-- 5) Liga o RLS
alter table public.clientes          enable row level security;
alter table public.despesas          enable row level security;
alter table public.interacoes_leads  enable row level security;
alter table public.leads             enable row level security;
alter table public.perfis_usuario    enable row level security;
alter table public.transportes       enable row level security;
alter table public.veiculo_extras    enable row level security;
alter table public.veiculos          enable row level security;
alter table public.vendas            enable row level security;
alter table public.vendedores        enable row level security;

-- 6) Índices que faltavam nas chaves estrangeiras (avisos de performance)
create index if not exists idx_despesas_veiculo_id     on public.despesas (veiculo_id);
create index if not exists idx_interacoes_vendedor_id  on public.interacoes_leads (vendedor_id);
create index if not exists idx_leads_veiculo_id        on public.leads (veiculo_id);
create index if not exists idx_transportes_veiculo_id  on public.transportes (veiculo_id);
create index if not exists idx_vendas_cliente_id       on public.vendas (cliente_id);
create index if not exists idx_vendedores_auth_user_id on public.vendedores (auth_user_id);
create index if not exists idx_veiculo_extras_veiculo_tipo on public.veiculo_extras (veiculo_id, tipo);
