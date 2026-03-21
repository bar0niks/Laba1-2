create table if not exists users (
  id serial primary key,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  full_name varchar(255) not null,
  role varchar(32) not null default 'client'
);

create table if not exists client_profiles (
  user_id integer primary key references users(id) on delete cascade,
  phone varchar(32) not null,
  emergency_contact text not null,
  goals text not null
);

create table if not exists memberships (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  plan_name varchar(120) not null,
  valid_until date not null,
  visits_left integer not null default 0
);

create table if not exists visit_entries (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  visited_at timestamp not null,
  trainer varchar(255) not null,
  notes text not null
);

insert into users (id, email, password_hash, full_name, role)
values
  (1, 'demo@gym.local', '$2a$10$M4Qm1CO4u7Rk1/3LaWr8teZ6N9K4YfJOLLmObAun1vDLteA94ppWK', 'Демо Клиент', 'client')
on conflict (id) do nothing;

insert into client_profiles (user_id, phone, emergency_contact, goals)
values
  (1, '+7 (900) 000-00-00', 'Иван, +7 (901) 111-11-11', 'Снижение веса и работа на выносливость')
on conflict (user_id) do nothing;

insert into memberships (user_id, plan_name, valid_until, visits_left)
values
  (1, 'Безлимит на месяц', current_date + interval '20 day', 8)
on conflict do nothing;

insert into visit_entries (user_id, visited_at, trainer, notes)
values
  (1, now() - interval '1 day', 'Алексей Морозов', 'Функциональная тренировка'),
  (1, now() - interval '4 day', 'Елена Смирнова', 'Кардио + растяжка')
on conflict do nothing;

select setval('users_id_seq', coalesce((select max(id) from users), 1));
select setval('memberships_id_seq', coalesce((select max(id) from memberships), 1));
select setval('visit_entries_id_seq', coalesce((select max(id) from visit_entries), 1));
