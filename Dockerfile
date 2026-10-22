FROM node:26.12.1-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS base
# The pinned base image predates the Alpine zlib security fix.
# Check https://hub.docker.com/_/node for refreshed images, then verify with:
# docker run --rm --entrypoint sh <candidate-image> -c 'apk list --installed zlib'
# Remove this workaround once the pinned image includes zlib >= 1.3.2-r1.
RUN apk add --no-cache 'zlib>=1.3.2-r1'
WORKDIR /app

# Install dependencies and build the application in a stage that isn't shipped.
FROM base AS build
# Node 26 no longer bundles Corepack.
RUN npm install --global corepack@0.36.0 && corepack enable
COPY package.json yarn.lock .yarnrc.yml ./

# Copy manifests before source so source changes can reuse the dependency layer.
RUN yarn install --immutable
COPY . .
RUN NODE_ENV=production yarn build

# Keep only runtime dependencies in the tree copied into the final image.
FROM build AS production-dependencies
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=true yarn workspaces focus --production

# Assemble the runtime image from only the files the app needs.
FROM base AS runtime
ENV NODE_ENV=production
# The application starts with Node directly; npm and its dependencies are build-only.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public/app.js ./public/app.js
COPY --from=build /app/public/assets ./public/assets
COPY --from=build /app/public/css ./public/css
COPY --from=build /app/public/js ./public/js
COPY --from=build /app/views ./views
COPY --from=build /app/locales ./locales
USER 1000:1000
EXPOSE 3000
CMD ["node", "public/app.js"]
