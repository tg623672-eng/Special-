# Developing with SKA Host

SKA Host is a customized theme for Pterodactyl, built as a Blueprint extension.
This document helps you modify the theme to your liking.

## Blueprint development tools

SKA Host uses Blueprint's developer tools.

Unarchive the extension folder into your `.blueprint/dev` directory, then use the
`blueprint -build` command every time you'd like to save a change.

> **SKA Host does not play well with `blueprint -watch`, you may run into issues!!**

[Learn more about developing Blueprint extensions on the Blueprint website](https://blueprint.zip/guides/dev/quickstart)

### Exporting the extension

When you are done making changes, make sure to export it back to a `.blueprint` file
so you don't lose your changes. You can do so using the `blueprint -export` command.

[Learn more about exporting extensions on the Blueprint website](https://blueprint.zip/guides/dev/packaging)

## Prepare your development environment

SKA Host uses some additional node modules to make exporting easier, and to
automatically minify files.

```bash
# Navigate to your Pterodactyl directory.
cd /var/www/pterodactyl

# Install SKA Host's development environment dependencies.
yarn add less @node-minify/uglify-js @node-minify/clean-css @node-minify/html-minifier @node-minify/cli
```

### Unminified files

SKA Host uses minified js/css/html files in production. The unminified versions are
bundled with the theme under `precompress/`.

For development purposes, you may want to work with the unminified versions only.
You can replace the minified versions with the following few commands:

```bash
# Navigate to your extension development directory.
cd .blueprint/dev

# Copy all uncompressed library files to the library directory.
cp precompress/libraries/* public/libraries/
```

### Developing on your local machine

We recommend [Blueprint Docker](https://github.com/blueprintframework/docker), a Docker
image you can run on your local machine with Pterodactyl, Wings and Blueprint.

[Learn more about Blueprint Docker for development-purposes on the Blueprint website](https://blueprint.zip/guides/dev/docker)

## Useful links

- Blueprint Docker
  - [The Blueprint Docker repository](https://github.com/blueprintframework/docker)
  - [Guide to installing Blueprint Docker for development purposes](https://blueprint.zip/guides/dev/docker)
- Blueprint Documentation/Guides
  - [Guide to extension development](https://blueprint.zip/guides/dev/quickstart)
  - [Guide to exporting extensions](https://blueprint.zip/guides/dev/packaging)
