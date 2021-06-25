<div align='center'>

# @macchiatojs/router

---

[![Build Status][travis-img]][travis-url]
[![Coverage Status][coverage-img]][coverage-url]
[![NPM version][npm-badge]][npm-url]
![Code Size][code-size-badge]
[![License][license-badge]][license-url]

</div>

<!-- ***************** -->

[travis-img]: https://travis-ci.com/macchiatojs/router.svg?branch=master
[travis-url]: https://travis-ci.com/macchiatojs/router
[coverage-img]: https://coveralls.io/repos/github/macchiatojs/router/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/macchiatojs/router?branch=master
[npm-badge]: https://img.shields.io/npm/v/@macchiatojs/router.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@macchiatojs/router
[license-badge]: https://img.shields.io/badge/license-MIT-green.svg?style=flat
[license-url]: https://github.com/macchiatojs/router/blob/master/LICENSE
[code-size-badge]: https://img.shields.io/github/languages/code-size/macchiatojs/router
[pr-welcoming-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat
[trouter]: https://github.com/lukeed/trouter

<!-- ***************** -->

### Expressive elegant modern amiable glamorous Macchiato.js Router ⚡.

## `Features`

- 🦄 Based on top of [Trouter][trouter].
- 🚀 Isomorphic to the moon.
- 💅🏻 Express-style routing (`app.get`, `app.post`, `app.put`, `app.delete`, etc.)
- 🔥 Blaze and lightweight router.
- ⚖️ Tiny Bundle.
- 🪁 Named URL parameters.
- 🎯 Route middleware.
- 🥞 Support router layer middlewares.
- 📋 Responds to `OPTIONS` requests with allowed methods.
- ⛔️ Support for `405 Method Not Allowed`.
- ❌ Support for `501 Path Not Implemented`.
- 🧼 Support `trailing slash` and `fixed path` by automatic redirection.
- ✨ Asynchronous support (`async/await`).
- 🐢 Raw Node.js (`http`) support.
- 🎉 TypeScript support.

## `Installation`

```bash
# npm
$ npm install @macchiatojs/router
# yarn
$ yarn add @macchiatojs/router
```

## `Usage`

This is a practical example of how to use.

```typescript
import Macchiato from "@macchiatojs/kernel";
import Router from "@macchiatojs/router";

const app = new Macchiato();
const router = new Router();

router.get("/hello", (request, response) => {
  response.body = "Hello World";
});

app.use(router.routes());

app.start(2222);
```

## `API`

### new Router(options?)

Create a new router.

| Param                | Type      | Description                                                                          |
| -------------------- | --------- | ------------------------------------------------------------------------------------ |
| [options]            | `Object`  |                                                                                      |
| [options.prefix]     | `String`  | prefix router paths                                                                  |
| [options.expressify] | `Boolean` | use express/connect style when is true and koa style when is false (default to true) |

### router.get|post|put|patch|delete|all(path, handler)

The http methods provide the routing functionality in `router`.

Method middleware and handlers follow usual raw Node.js and express middleware or koa middleware behavior, except they will only be called when the method and path match the request.

```js
// handle a GET / request.

// Express/Connect Style
router.get("/", (request, response) => {
  response.send(200, "Hello World !");
});

// Koa Style
router.get("/", (ctx) => {
  ctx.response.send(200, "Hello World !");
});
```

### router.prefix(prePath)

Route paths can be prefixed at the router level:

```js
// handle a GET /prePath/users request.

// Express/Connect Style
router.prefix("/prePath").get("/users", (request, response) => {
  response.send(200, "Hello World !");
});

// Koa Style
router.prefix("/prePath").get("/users", (ctx) => {
  ctx.response.send(200, "Hello World !");
});
```

### router.route(path)

Lookup route with given path.

```js
// handle a GET /users request.

// Express/Connect Style
router.route("/users").get((request, response) => {
  response.send(200, "Hello World !");
});

// Koa Style
router.route("/users").get((ctx) => {
  ctx.response.send(200, "Hello World !");
});
```

### router.use(...middlewares)

Use given middleware(s). Currently, use middleware(s) for all paths of router isntance.

### router.routes()

Returns router middleware which handle a route matching the request.

## `Support`

If you have any problem or suggestion please open an issue.

## `Related`

- [koa-ismorphic-router](https://github.com/3imed-jaberi/koa-isomorphic-router)

#### License

---

[MIT](LICENSE) &copy; [Imed Jaberi](https://github.com/3imed-jaberi)
