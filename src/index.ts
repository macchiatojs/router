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

import { Context, Request, Response, MacchiatoMiddleware, ExpressStyleMiddleware } from '@macchiatojs/kernel'
import KoaifyMiddleware from '@macchiatojs/koaify-middleware'
import { IncomingMessage, ServerResponse } from 'http'
import Middleware from '@macchiatojs/middleware'
import Trouter, { Methods } from 'trouter'
import TrekRouter from 'trek-router'
import hashlruCache from 'hashlru'
import parse from 'parseurl'
import Koa from 'koa'

export type rawHandler = ExpressStyleMiddleware<IncomingMessage, ServerResponse>
export type Handler = MacchiatoMiddleware|rawHandler

/**
 * Isomorphic Router for Macchiato.js.
 *
 * @api public
 */

class Router<THandler = Handler> {
  // init attributes.
  #raw: boolean
  #expressify: boolean
  #router: TrekRouter|Trouter<THandler>
  #METHODS: Methods[]
  #routePrefix: string
  #routePath?: string
  #middlewaresStore: any
  #cache: any
  #allowHeaderStore: any
  
  // init Router.
  constructor (options: { raw?: boolean, expressify?: boolean, trek?: boolean, prefix?: string } = {}) {
    // init attributes.
    this.#raw = options.raw ?? false
    this.#expressify = options.expressify ?? true
    this.#router = options.trek ? new TrekRouter() : new Trouter<THandler>()
    this.#METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    this.#routePrefix = options.prefix || '/'
    this.#routePath = undefined
    this.#middlewaresStore = (
      this.#raw 
      ? new Middleware<IncomingMessage, ServerResponse>()
      : this.#expressify
        ? new Middleware<Request, Response>()
        : new KoaifyMiddleware<Context|Koa.Context>()
    )
    this.#cache = hashlruCache(1000)
    this.#allowHeaderStore = [] // [{ path: '', methods: [] }]
  }

  // normalize the path by remove all trailing slash.
  #normalizePath (path: string) {    
    path = path.replace(/\/\/+/g, '/')
    if (path !== '/' && path.slice(-1) === '/') {
      path = path.slice(0, -1)
    }
    return path
  }

  // get allow header for specific path.
  #getAllowHeaderTuple (path: string) {
    return this.#allowHeaderStore.find(allow => allow.path === path)
  }

  // register route with specific method.
  #on (method: Methods|Methods[]|'', path: string|THandler, ...middlewares: THandler[]) {
    // handle the path arg when passed as middleware.
    if (typeof path !== 'string') {
      middlewares = [path, ...middlewares]
      path = this.#routePath as any
    }

    // normalize the path.
    path = this.#normalizePath(this.#routePrefix + path)

    // register path with method(s) to re-use as allow header filed.
    // allow header.
    const allow = this.#getAllowHeaderTuple(path)

    // stock to allow header store with unique val array.
    this.#allowHeaderStore = [...new Map([
      ...this.#allowHeaderStore,
      { path, methods: !allow ? [method] : [...new Set([...allow.methods, method])] }
    ].map(item => [item.path, item])).values()]

    // register to route to the trouter stack.
    if (Array.isArray(method)) method = ''

    this.#router.add(method as any, path, ...middlewares)

    // give access to other method after use the current one.
    return this
  }

  // register route with get method.
  public get (path, ...middlewares) {
    return this.#on('GET', path, ...middlewares)
  }

  // register route with post method.
  public post (path, ...middlewares) {
    return this.#on('POST', path, ...middlewares)
  }

  // register route with put method.
  public put (path, ...middlewares) {
    return this.#on('PUT', path, ...middlewares)
  }

  // register route with patch method.
  public patch (path, ...middlewares) {
    return this.#on('PATCH', path, ...middlewares)
  }

  // register route with delete method.
  public delete (path, ...middlewares) {
    return this.#on('DELETE', path, ...middlewares)
  }

  // `router.all()` method >> register route with all methods.
  public all (path, ...middlewares) {
    return this.#on(this.#METHODS, path, ...middlewares)
  }

  // add prefix to route path.
  public prefix (prefix: string) {
    this.#routePrefix = prefix
    return this
  }

  // give access to write once the path of route.
  public route (path: string) {
    // update the route-path.
    this.#routePath = path

    // give access to other method after use the current one.
    return this
  }

  // use given middleware, if and only if, a route is matched.
  public use (...middlewares: Handler[]) {
    // check middlewares.
    if (middlewares.some(mw => typeof mw !== 'function')) {
      throw new TypeError('".use()" requires a middleware(s) function(s)')
    }

    // add the current middlewares to the store.
    this.#middlewaresStore.push(...middlewares)

    // give access to other method after use the current one.
    return this
  }

  // normalize route from trouter and trek-router.
  #routeFactory(route) {    
    if (Array.isArray(route)) {
      const [handler, routeParams] = route
      const params = {}

      // parse the params if exist.
      if (Array.isArray(routeParams) && routeParams.length > 0) {
        routeParams.forEach(({ name: key, value }) => { params[key] = value })
      }

      return [handler, params]
    }

    return [route.handlers[0], route.params]
  }

  // router middleware which handle a route matching the request.
  #handleRoutes (
    request: Request|Koa.Request|IncomingMessage,
    response: Response|Koa.Response|ServerResponse
  ) {
    return async (context: Context|Koa.Context|null = null) => {
      // orignal path.
      const originalPath = this.#raw 
        ? parse(request as IncomingMessage).pathname 
        : (request as Request).path

      // normalize the path.
      const path = this.#normalizePath(originalPath)

      // ignore favicon request.
      // src: https://github.com/3imed-jaberi/koa-no-favicon/blob/master/index.js
      // if (/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(originalPath)) { return }

      // have slashs ~ solve trailing slash.
      if (path !== originalPath) {
        if (this.#raw) {
          this.#sendResponse(301, path)(response as Response)
          return
        }

        (response as Response).status = 301
        ;(response as Response).redirect(`${path}${(request as Request).search}`)
        return
      }

      // init route matched var.
      let route

      // generate the cache key.
      const requestCacheKey = `${request.method}_${originalPath}`
      // get the route from the cache.
      route = this.#cache.get(requestCacheKey)

      // if the current request not cached.
      if (!route) {        
        // find route inside the routes stack.
        route = this.#router.find(request.method as Methods, originalPath)
        // put the matched route inside the cache.
        this.#cache.set(requestCacheKey, route)
      }

      // extract the handler func and the params array.
      const [handler, routeParams] = this.#routeFactory(route)

      // check the handler func isn't defined.
      if (!handler || handler.length === 0) {
        // get methods exist on allow header.
        const allowHeaderFiled = this.#getAllowHeaderTuple(path)

        if (allowHeaderFiled) {
          // if `OPTIONS` request responds with allowed methods.
          if (request.method === 'OPTIONS') {
            if (this.#raw) {
              this.#sendResponse(204, '', { 'Allow': allowHeaderFiled.methods.join(', ') })(response as ServerResponse)
              return
            }
  
            (response as Response).status = 204
            ;(response as Response).set('Allow', allowHeaderFiled.methods.join(', '))
            ;(response as Response).body = ''
            return
          }

          // support 405 method not allowed.
          if (this.#raw) {
            this.#sendResponse(
              405, 
              `"${request.method}" is not allowed in "${originalPath}".`,
              { 'Allow': allowHeaderFiled.methods.join(', ') }
            )(response as ServerResponse)
            return
          }

          (response as Response).status = 405
          ;(response as Response).set('Allow', allowHeaderFiled.methods.join(', '))
          ;(response as Response).body = `"${request.method}" is not allowed in "${originalPath}".`
          return
        }

        // suport 501 path not implemented.
        if (this.#raw) {
          this.#sendResponse(501, 
            `"${originalPath}" not implemented.`,
            { 'Allow': '' }
          )(response as ServerResponse)
          return
        }

        (response as Response).status = 501
        ;(response as Response).set('Allow', '')
        ;(response as Response).body= `"${originalPath}" not implemented.`
        return
      }

      // put the params object inside the request.
      request['params'] = routeParams

      // add the handler to middlewares stored by the `use` method.
      this.#middlewaresStore.push(handler)

      // run the middleware.
      await this.#middlewaresStore.compose(
        ...(!this.#expressify ? [context] : [request, response])
      )
    }
  }

  #expressifyRoutes (request: Request, response: Response) {
    this.#handleRoutes(request, response)()
  }

  #koaifyRoutes (context: Context|Koa.Context)  {
    return this.#handleRoutes(context.request, context.response)(context)
  }

  #sendResponse(status: number, content: string, headers?: { [key: string]: string }) {
    return (response: ServerResponse) => {
      response.statusCode = status
    
      if (headers) {
        for (const key in headers) {
          response.setHeader(key, headers[key])
        }
      }

      if (status === 301) {
        response.writeHead(301, { Location: `${content}` })
      } else { 
        response.write(content)
      }

      response.end()
      return
    }
  }

  rawRoutes ()  {
    if (!this.#raw) {
      throw new Error('`.rawRoutes` used only with raw Node.js server')
    }

    return (request: IncomingMessage, response: ServerResponse) => { this.#handleRoutes(request, response)() }
  }

  routes () {
    return this.#expressify 
      ? (request: Request, response: Response) => { this.#expressifyRoutes(request, response) } 
      : (ctx: Context|Koa.Context) => { this.#koaifyRoutes(ctx) }
  }
}

/**
 * Expose `Router`.
 */

export default Router

// Support CommonJS
module.exports = Router
