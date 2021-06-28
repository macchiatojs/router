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
[trek-router]: https://github.com/trekjs/router

<!-- ***************** -->

### Expressive elegant modern amiable glamorous Macchiato.js Router ⚡ <small> (support also raw Node.js and Koa.js) </small>.

## `Features`

- 🦄 Based on top of [Trouter][trouter] and/or [Trek Router][trek-router].
- 🚀 Isomorphic to the moon.
- 💅🏻 Express-style routing (`_.get`, `_.post`, `_.put`, `_.patch`, `_.delete`, etc.)
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
- 🐱‍👤 Support `Koa.js` and all framework which have the same behave.
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
import Macchiato, { Request, Response } from "@macchiatojs/kernel";
import Router from "@macchiatojs/router";

const app = new Macchiato();
const router = new Router(); // use trouter
// >>> some benchs say that trek-router have better perf than trouter. <<< //
// const router = new Router({ trek: true }); // use trek-router

router.get("/hello", (request: Request, response: Response) => {
  response.body = "Hello World";
});

app.use(router.routes());

app.start(2222);
```

with raw Node.js

```typescript
import http, { IncomingMessage, ServerResponse } from "http";
import Router from "@macchiatojs/router";

const router = new Router({ raw: true });

router.get("/hello", (request: IncomingMessage, response: ServerResponse) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});

const server = http.createServer(router.rawRoutes());

app.listen(2222);
```

with Koa.js

```typescript
import Koa from "koa";
import Router from "@macchiatojs/router";

const app = new Koa();
const router = new Router<Koa.Middleware>({ expressify: false });

router.get("/hello", (ctx: Koa.BaseContext) => {
  ctx.body = "Hello World !";
});

app.use(router.routes());

app.listen(2222);
```

## `API`

### Note:

> We use `@macchiatojs/kernel` (needed only when use TypeScript and/or Macchiato.js), `parseurl` (needed only when use raw Node.js), `@types/koa` (needed only when use TypeScript) and `koa` (needed only when use Koa.js) as peerDependencies.

### new Router(options?)

Create a new router.

| Param                | Type      | Description                                                                                    |
| -------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| [options]            | `Object`  |                                                                                                |
| [options.prefix]     | `String`  | prefix router paths                                                                            |
| [options.expressify] | `Boolean` | use `express/connect style` when is `true` and `koa style` when is `false` (default to `true`) |
| [options.raw]        | `Boolean` | use `raw Node.js server` when is `true` (default to `false`)                                   |
| [options.trek]       | `Boolean` | use `trek-router` when is `true` and `trouter` when is `false` (default to `false`)            |

### router.get|post|put|patch|delete|all(path, handler)

The http methods provide the routing functionality in `router`.

Method middleware and handlers follow usual raw Node.js and express middleware or koa middleware behavior, except they will only be called when the method and path match the request.

```js
// handle a GET / request.

// raw Node Style
router.get("/", (request, response) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});

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

// raw Node Style
router.prefix("/prePath").get("/", (request, response) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});

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

// raw Node Style
router.prefix("/users").get((request, response) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});

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

Returns router middleware which handle a route matching the request for `Macchiato.js` and `Koa.js`.

### router.rawRoutes()

Returns router middleware which handle a route matching the request for `raw Node.js`.

## `Support`

If you have any problem or suggestion please open an issue.

## `Related`

- [koa-ismorphic-router](https://github.com/3imed-jaberi/koa-isomorphic-router)

#### License

---

[MIT](LICENSE) &copy; [Imed Jaberi](https://github.com/3imed-jaberi)
