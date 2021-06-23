/*!
 * @macchiatojs/router
 *
 *
 * Copyright(c) 2021 Imed Jaberi
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

import { IncomingMessage, ServerResponse } from 'http'
import Trouter, { Methods } from 'trouter'
import parse from 'parseurl'
import hashlruCache from 'hashlru'

interface Handler {
  (request: IncomingMessage, response: ServerResponse): any;
}

/**
 * Isomorphic Router for Macchiato.js.
 *
 * @api public
 */

class Router {
  // init attributes.
  private router: Trouter
  private METHODS: Methods[]
  private throws: boolean
  private routePrefix: string
  private routePath?: string
  private middlewaresStore: any
  private cache: any
  private allowHeaderStore: any
  
  // init Router.
  constructor (options: { throw?: boolean, prefix?: string } = {}) {
    // init attributes.
    this.router = new Trouter<Handler>()
    this.METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    this.throws = options.throw || false
    this.routePrefix = options.prefix || '/'
    this.routePath = undefined
    this.middlewaresStore = []
    this.cache = hashlruCache(1000)
    this.allowHeaderStore = [] // [{ path: '', methods: [] }]
  }

  // normalize the path by remove all trailing slash.
  private _normalizePath (path: string) {    
    path = path.replace(/\/\/+/g, '/')
    if (path !== '/' && path.slice(-1) === '/') {
      path = path.slice(0, -1)
    }
    return path
  }

  // get allow header for specific path.
  private _getAllowHeaderTuple (path: string) {
    return this.allowHeaderStore.find(allow => allow.path === path)
  }

  // register route with specific method.
  private _on (method: Methods|Methods[]|'', path: string|Handler, ...middlewares: Handler[]) {
    // handle the path arg when passed as middleware.
    if (typeof path !== 'string') {
      middlewares = [path, ...middlewares]
      path = this.routePath as any
    }

    // normalize the path.
    path = this._normalizePath(this.routePrefix + path)

    // register path with method(s) to re-use as allow header filed.
    // allow header.
    const allow = this._getAllowHeaderTuple(path)

    // stock to allow header store with unique val array.
    this.allowHeaderStore = [...new Map([
      ...this.allowHeaderStore,
      { path, methods: !allow ? [method] : [...new Set([...allow.methods, method])] }
    ].map(item => [item.path, item])).values()]

    // register to route to the trouter stack.
    if (Array.isArray(method)) method = ''

    this.router.add(method as Methods, path, ...middlewares)

    // give access to other method after use the current one.
    return this
  }

  // register route with get method.
  public get (path, ...middlewares) {
    return this._on('GET', path, ...middlewares)
  }

  // register route with post method.
  public post (path, ...middlewares) {
    return this._on('POST', path, ...middlewares)
  }

  // register route with put method.
  public put (path, ...middlewares) {
    return this._on('PUT', path, ...middlewares)
  }

  // register route with patch method.
  public patch (path, ...middlewares) {
    return this._on('PATCH', path, ...middlewares)
  }

  // register route with delete method.
  public delete (path, ...middlewares) {
    return this._on('DELETE', path, ...middlewares)
  }

  // `router.all()` method >> register route with all methods.
  public all (path, ...middlewares) {
    return this._on(this.METHODS, path, ...middlewares)
  }

  // add prefix to route path.
  public prefix (prefix?: string) {
    this.routePrefix = prefix || this.routePrefix
    return this
  }

  // give access to write once the path of route.
  public route (path: string) {
    // update the route-path.
    this.routePath = path

    // give access to other method after use the current one.
    return this
  }

  // use given middleware, if and only if, a route is matched.
  public use (...middlewares) {
    // check middlewares.
    if (middlewares.some(mw => typeof mw !== 'function')) {
      throw new TypeError('".use()" requires a middleware(s) function(s)')
    }

    // add the current middlewares to the store.
    this.middlewaresStore = [...this.middlewaresStore, ...middlewares]

    // give access to other method after use the current one.
    return this
  }

  // router middleware which handle a route matching the request.
  public async routes (request: IncomingMessage, response: ServerResponse) {
    // normalize the path.
    const originalPath = parse(request).pathname

    const path = this._normalizePath(originalPath)

    // ignore favicon request.
    // src: https://github.com/3imed-jaberi/koa-no-favicon/blob/master/index.js
    if (/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(originalPath)) {
      response.statusCode = 404
      response.end()
      return
    }

    // init route matched var.
    let route

    // have slashs ~ solve trailing slash.
    if (path !== originalPath) {
      response.statusCode = 301
      response.writeHead(302, {
        // TODO: querystring support
        Location: `${path}`
      })
      response.end()
      return
    }

    // generate the cache key.
    const requestCacheKey = `${request.method}_${originalPath}`
    // get the route from the cache.
    route = this.cache.get(requestCacheKey)

    // if the current request not cached.
    if (!route) {        
      // find route inside the routes stack.
      route = this.router.find(request.method as Methods, originalPath)
      // put the matched route inside the cache.
      this.cache.set(requestCacheKey, route)
    }

    // extract the handler func and the params array.
    const { handlers: [handler], params: routeParams } = route

    // check the handler func isn't defined.
    if (!handler || handler.length === 0) {
      // get methods exist on allow header.
      const allowHeaderFiled = this._getAllowHeaderTuple(path)

      if (allowHeaderFiled) {
        // if `OPTIONS` request responds with allowed methods.
        if (request.method === 'OPTIONS') {
          response.statusCode = 204
          response.setHeader('Allow', allowHeaderFiled.methods.join(', '))
          response.write('')
          response.end()
          return
        }

        // support 405 method not allowed.
        if (this.throws) {
          response.statusCode = 405
          response.end()
          throw new Error(`"${request.method}" is not allowed in "${originalPath}".`)
        }

        response.statusCode = 405
        response.setHeader('Allow', allowHeaderFiled.methods.join(', '))
        response.write (`"${request.method}" is not allowed in "${originalPath}".`)
        response.end()

        return
      }

      // suport 501 path not implemented.
      if (this.throws) {
        response.statusCode = 501
        response.end()
        throw new Error(`"${originalPath}" not implemented.`)
      }

      response.statusCode = 501
      response.setHeader('Allow', '')
      response.write (`"${originalPath}" not implemented.`)
      response.end()
      return
    }
    
    // check if the route params isn't empty array.
    request['params'] = routeParams

    // wait to all middlewares stored by the `use` method.
    await Promise.all(this.middlewaresStore)
    await handler(request, response)
  }
}

/**
 * Expose `Router`.
 */

export default Router
