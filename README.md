# Legal Aid Agency - Express with TypeScript template (ETT)
<!-- Replace with your repo -->
[![MOJ Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/laa-express-typescript-template/badge)](https://github-community.service.justice.gov.uk/repository-standards/technical-standard/repositories/laa-express-typescript-template)

![govuk-frontend 6.6.0](https://img.shields.io/badge/govuk--frontend%20version-6.6.0-005EA5?logo=gov.uk&style=flat)

## Full technical documentation

View the [full technical documentation on the LAA Developer Portal](https://developer-portal.laa.service.justice.gov.uk/docs/typescript/)

## Get Started
### Prerequisites

- node stable version [26.9.0](https://nodejs.org/en/blog/release/v26.9.0/)
- [Yarn 4.9.2](https://yarnpkg.com/) package manager (see installation instructions below)
- TypeScript 6.0.3

#### Installing Yarn

This project pins Yarn 4.9.2 in the `packageManager` field of `package.json`. Corepack uses that pin to select the correct Yarn version. Node.js 26 does not bundle Corepack, so you may need to install Corepack separately before following these steps:

1. **Enable corepack (if not already enabled):**

   ```shell
   corepack enable
   ```

2. **Install dependencies:**

   ```shell
   yarn install
   ```

3. **Verify the installation:**

   ```shell
   yarn --version
   # Should output: 4.9.2
   ```

**To Note:** 
- Corepack automatically uses the Yarn version specified in the `packageManager` field of `package.json`. No additional setup is required once corepack is enabled
- Corepack is the preferred `yarn` way, to install the package manager, instead of `npm install -g yarn` in your ci/cd pipeline
- `yarn install --immutable` ensures that the lockfile (`yarn.lock`) is not modified during the installation process

### Start the application

#### Set local environment variables

Create your local config file `.env` from the template file:

```shell
cp .env.example .env
```

#### Align to the Node Version specified for this project

If using Node Version Manager (nvm), use the following command to switch to the correct version:

```shell
nvm use
nvm install
```

#### Install dependencies and run application for development

```shell
yarn install
yarn build
yarn dev
```

Then, load http://localhost:3000/ in your browser to access the app.

#### Install dependencies and run application for production
```shell
yarn install
yarn build
yarn start
```

##### Node Version Manager

You may have to tell your local machine to use the latest version of node already installed on your device, before installing and running the application. Use the following command.

```shell
nvm install node
```

##### Running locally with docker

Prerequisites, Docker Desktop

- To build the docker image

  ```shell
  docker build -t your-repo-name:latest .
  ```

- To run the docker image

  ```shell
  docker run -d -p 8888:3000 your-repo-name:latest
  ```
  (The application should be running at http://localhost:8888)

- To stop the container

  obtain the container id
  ```shell
  docker ps
  ```
  stop the container
  ```shell
  docker stop {container_id}
  ```

### GitHub Actions
- The `Publish documentation` workflow has been disabled in this GitHub template repo. Make sure you enable it and change config as required, when setting up your project. 

### Licence

[Licence](./LICENSE)