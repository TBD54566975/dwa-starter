# DWA Starter React

Decentralized Web App: it's a Web5 Progressive Web App.

## Why PWA?

It's a perfect match with Web5 DWNs since a PWA can work offline and DWN has a synced local storage.

Aside from that, the advanced PWA capabilities such as modifying fetch requests allow us to extract the most such as displaying images with DRLs in the traditional `src` attribute.

## Running Instructions

### Running Development Environment Locally

```sh
pnpm i
docker compose up -d
pnpm dev
```

### Building App

```sh
pnpm build
```

Deploy the `dist` folder to the server. It's just a static PWA! Please make sure all the settings are optimized for production, including your application descriptions, icons, service workers, polyfills and configurations (ie. check vite-pwa eslint recommendations below).

## React + Vite-PWA

This repo was created with vite-pwa, check the default instructions below.

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Project Resources

| Resource                                   | Description                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| [CODEOWNERS](./CODEOWNERS)                 | Outlines the project lead(s)                                                  |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Expected behavior for project contributors, promoting a welcoming environment |
| [CONTRIBUTING.md](./CONTRIBUTING.md)       | Developer guide to build, test, run, access CI, chat, discuss, file issues    |
| [GOVERNANCE.md](./GOVERNANCE.md)           | Project governance                                                            |
| [LICENSE](./LICENSE)                       | Apache License, Version 2.0                                                   |
