# IXC Chat Realtime

Aplicação de chat em tempo real com Node.js, Express, Passport, MongoDB, Socket.IO, React e Next.js.

## Stack

- Backend: Node.js, Express, Passport, Mongoose, Socket.IO
- Frontend: Next.js, React
- Banco: MongoDB
- Docker: Docker Compose
- Cluster: `node:cluster` no backend

## Estrutura

```text
apps/
  server/
  web/
scripts/
  docker/
docker-compose.yml
```

## Requisitos

- Node.js 20+
- npm 10+
- Docker e Docker Compose

## Ambiente

Copie o arquivo de exemplo para `.env`:

```bash
cp .env.example .env
```

Valores padrão:

```env
NODE_ENV=production
CLUSTER_ENABLED=true
CLUSTER_WORKERS=2
JWT_SECRET=7e4d8c8f5a0c4d0e9c4c6f4a2f9e1b6c3d8a7f5b9e2c1d4a6f8b0c3d5e7f9a1
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Executar com Docker

Fluxo principal do projeto:

```bash
docker compose up --build -d
```

Esse comando:
- cria ou recria as imagens necessárias
- sobe os containers em segundo plano
- libera o terminal para uso normal

Serviços:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- MongoDB: mongodb://127.0.0.1:27017

O `docker-compose.yml` sobe:
- frontend em desenvolvimento
- backend em desenvolvimento
- MongoDB em container

## Logs

Para acompanhar os logs do backend:

```bash
docker compose logs -f server
```

Outros serviços:

```bash
docker compose logs -f web
docker compose logs -f mongo
```

## Parar e retomar

Parar os containers sem remover volumes:

```bash
docker compose stop
```

Subir novamente os containers já criados:

```bash
docker compose start
```

Derrubar containers e network do projeto:

```bash
docker compose down
```

Derrubar containers, network e volumes do projeto:

```bash
docker compose down --volumes --remove-orphans
```

## Alterações no projeto

### 1. Alterações de frontend visual
Exemplos:
- texto
- layout
- CSS
- responsividade
- componentes React

Na maior parte dos casos, como o projeto sobe em desenvolvimento, basta salvar e validar no navegador.

Se o serviço não refletir a alteração corretamente, reinicie apenas o frontend:

```bash
docker compose restart web
```

### 2. Alterações no backend
Exemplos:
- rotas
- controllers
- services
- validações
- sockets

Na maior parte dos casos, o backend recompila/reinicia no fluxo de desenvolvimento.

Se precisar reiniciar manualmente:

```bash
docker compose restart server
```

### 3. Alterações em dependências
Exemplos:
- `package.json`
- `package-lock.json`

Depois da alteração, recrie as imagens:

```bash
docker compose up --build -d
```

### 4. Alterações em Docker
Exemplos:
- `docker-compose.yml`
- `Dockerfile`
- scripts de entrypoint
- variáveis de ambiente relevantes

Depois da alteração, recrie o ambiente:

```bash
docker compose up --build -d
```

Se houver conflito de estado antigo, derrube antes:

```bash
docker compose down
docker compose up --build -d
```

### 5. Alterações no `.env`
Se você mudar variáveis de ambiente, recrie os containers para o processo subir com os novos valores:

```bash
docker compose up -d --force-recreate
```

Se quiser recriar só o backend:

```bash
docker compose up -d --force-recreate server
```

## Instalação local opcional

Para usar o editor com autocomplete, tipos e validações no host:

```bash
npm install
```

## Validar cluster no backend

O cluster fica no backend e é controlado por `.env`.

Ajuste:

```env
NODE_ENV=production
CLUSTER_ENABLED=true
CLUSTER_WORKERS=2
```

Depois recrie o backend:

```bash
docker compose up -d --force-recreate server
```

Para acompanhar o log do backend:

```bash
docker compose logs -f server
```

Sinal esperado no log:

```text
[cluster] 2 workers na porta 4000
```

## Banco de dados

Conexão no MongoDB Compass:

```text
mongodb://127.0.0.1:27017
```

Banco principal:
- `ixc-chat`

Collections principais:
- `users`
- `messages`

## Uploads

Os uploads ficam fora do Git e são persistidos em volume Docker do backend.

URLs servidas pela aplicação:
- `/uploads/avatars/...`

## Seed

Para popular o banco com usuários e mensagens de exemplo:

```bash
npm run seed
```

Usuários de exemplo:
- `claudia` / `Demo123!`
- `brenda` / `Demo123!`
- `fulano` / `Demo123!`

## Scripts úteis

```bash
npm run dev
npm run build
npm run seed
npm run docker:up
npm run docker:up:detached
npm run docker:down
npm run docker:reset
npm run cluster:server
```

## Rotas principais

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users`
- `GET /api/v1/messages/:userId`
- `POST /api/v1/users/profile/avatar`
- `GET /api/v1/health`

## Notificações

As notificações de novas mensagens acontecem em três níveis:
- badge de não lidas na lista de conversas
- toast na interface
- notificação nativa do navegador quando a permissão estiver liberada
