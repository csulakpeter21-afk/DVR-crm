# The combined mock provider server (tools/mocks).
#
# It runs TypeScript straight through tsx: a mock that needs a build step is a
# mock people stop updating. The whole workspace is copied because pnpm needs
# the workspace manifests to resolve @devora/* links; .dockerignore keeps
# node_modules and build output out.
FROM node:22-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

COPY . .
RUN pnpm install --filter @devora/mocks... --frozen-lockfile

ENV MOCK_SERVER_PORT=4010
EXPOSE 4010
CMD ["pnpm", "--filter", "@devora/mocks", "run", "start"]
