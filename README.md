<div align='center'>

# @grandjs/router

---

[![Build Status][travis-img]][travis-url]
[![Coverage Status][coverage-img]][coverage-url]
[![NPM version][npm-badge]][npm-url]
![Code Size][code-size-badge]
[![License][license-badge]][license-url]
[![PR's Welcome][pr-welcoming-badge]][pr-welcoming-url]

</div>

<!-- ***************** -->

[travis-img]: https://travis-ci.org/grandjs/router.svg?branch=master
[travis-url]: https://travis-ci.org/grandjs/router
[coverage-img]: https://coveralls.io/repos/github/grandjs/router/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grandjs/router?branch=master
[npm-badge]: https://img.shields.io/npm/v/@grandjs/router.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@grandjs/router
[license-badge]: https://img.shields.io/badge/license-MIT-green.svg?style=flat
[license-url]: https://github.com/grandjs/router/blob/master/LICENSE
[code-size-badge]: https://img.shields.io/github/languages/code-size/grandjs/router
[pr-welcoming-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat
[pr-welcoming-url]: https://github.com/koajs/koa/pull/new
[trouter]: https://github.com/lukeed/trouter

<!-- ***************** -->

### Expressive elegant modern amiable glamorous Grand.js Router ⚡.

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
$ npm install @grandjs/router
# yarn
$ yarn add @grandjs/router
```

## `Usage`

This is a practical example of how to use.

```typescript
import http from "http";
import Router from "@grandjs/router";

const router = new Router();

router.get("/hello", (request, response) => {
  response.statusCode = 200;
  response.setHeader("content-type", "application/json");
  response.write(JSON.stringify({ msg: "Hello World !" }));
  response.end();
});

const server = http.createServer((request, response) => {
  router.routes(request, response);
});

return server.listen;
```

## `API`

### new Router(options?)

Create a new router.

| Param            | Type      | Description                                      |
| ---------------- | --------- | ------------------------------------------------ |
| [options]        | `Object`  |                                                  |
| [options.prefix] | `String`  | prefix router paths                              |
| [options.throw]  | `Boolean` | throw error instead of setting status and header |

### router.get|post|put|patch|delete|all(path, handler)

The http methods provide the routing functionality in `router`.

Method middleware and handlers follow usual raw Node.js and express middleware behavior, except they will only be called when the method and path match the request.

```js
// handle a GET / request.
router.get("/", (request, response) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});
```

### router.prefix(prePath)

Route paths can be prefixed at the router level:

```js
// handle a GET /prePath/users request.
router.prefix("/prePath").get("/users", (request, response) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});
```

### router.route(path)

Lookup route with given path.

```js
// handle a GET /users request.
router.route("/users").get((request, response) => {
  response.statusCode = 200;
  response.write("Hello World !");
  response.end();
});
```

### router.use(...middlewares)

Use given middleware(s). Currently, use middleware(s) for all paths of router isntance.

### router.routes(request, response)

Returns router middleware which handle a route matching the request.

## `Support`

If you have any problem or suggestion please open an issue.

## `Related`

- [koa-ismorphic-router](https://github.com/3imed-jaberi/koa-isomorphic-router)

#### License

---

[MIT](LICENSE) &copy; [Imed Jaberi](https://github.com/3imed-jaberi)
