import request from 'supertest'
import assert from 'assert'
import Koa from 'koa'
import { Next } from '@macchiatojs/kernel'
import Router from '../../src'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

describe('macchiatojs-router with koa.js', () => {
  let app: Koa

  beforeEach(() => {
    app = new Koa()
  })

  describe('self', () => {
    it('should return a object', () => {
      assert.strictEqual(typeof new Router<Koa.Middleware>({ expressify: false }), 'object')
    })

    it('should not return private props/method', () => {
      assert.deepStrictEqual(
        Object.getOwnPropertyNames(Router.prototype),
        [
          'constructor', 'get', 'post', 'put', 'patch',
          'delete', 'all', 'prefix', 'route', 'use', 'rawRoutes', 'routes'
        ]
      )
    })
  })

  describe('http verbs/methods', () => {
    it('get method', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })

      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })

      app.use(router.routes() as any)

      request(app.listen())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(200, /get data/, done)
    })

    it('post method', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })

      router.post('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'post data' }
      })

      app.use(router.routes() as any)

      request(app.listen())
        .post('/test')
        .expect('Content-Type', /json/)
        .expect(200, /post data/, done)
    })

    it('put method', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })

      router.put('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'put data' }
      })

      app.use(router.routes() as any)

      request(app.listen())
        .put('/test')
        .expect('Content-Type', /json/)
        .expect(200, /put data/, done)
    })

    it('patch method', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })

      router.patch('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'patch data' }
      })

      app.use(router.routes() as any)

      request(app.listen())
        .patch('/test')
        .expect('Content-Type', /json/)
        .expect(200, /patch data/, done)
    })

    it('delete method', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })

      router.delete('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'delete data' }
      })

      app.use(router.routes() as any)

      request(app.listen())
        .delete('/test')
        .expect('Content-Type', /json/)
        .expect(200, /delete data/, done)
    })

    describe('all method', () => {
      const app = new Koa()
      const router = new Router<Koa.Middleware>({ expressify: false })

      router.all('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'delete data' }
      })

      app.use(router.routes() as any)

      METHODS.forEach((method) => {
        it(method.toLowerCase(), (done) => {
          request(app.listen())[method.toLowerCase()]('/test').expect(200, done())
        })
      })
    })

    it('use route to handle methods (chain)', (done) => {
      (() => {
        const router = new Router<Koa.Middleware>({ expressify: false })
        const app = new Koa()

        router
          .route('/test')
          .get((ctx: Koa.BaseContext) => { ctx.body = { msg: 'get data' } })
          .post((ctx: Koa.BaseContext) => { ctx.body = { msg: 'post data' } })
  
        app.use(router.routes() as any)

        request(app.listen())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get data/)
        .expect(200)

        request(app.listen())
          .post('/test')
          .expect('Content-Type', /json/)
          .expect(/delete data/)
          .expect(200)

        done()
      })()
    })
  })

  describe('allow header field', () => {
    it('should allow header functions work', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })

      ;(['post','put','delete'] as string[]).forEach(m => { router[m]('/test', () => void 0) })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/test')
        .expect(200, done)
    })
  })

  describe('params', () => {
    it('should return a response with params', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test/:state', (ctx: Koa.Context) => {        
        ctx.body = { msg: 'get data with ' + ctx.request['params'].state + ' as params' }
      })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/test/work')
        .expect(/get data with work as params/)
        .expect(200, done)
    })
  })

  describe('trailing slash and fixed path', () => {
    it('should normalize the path and redirect to correct one', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('//test/', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)
    
      request(app.listen())
        .get('//test')
        .expect(301)
        .expect('Location', '/test')
        .end(done)
    })
  })

  describe('options request', () => {
    it('should responds with allowed methods', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)
    
      request(app.listen())
        .options('/test')
        .expect('Allow', 'GET')
        .expect(204, done)
    })
  })

  describe('405 method not allowed', () => {
    it('should responds with method not allowed', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)
    
      request(app.listen())
        .post('/test')
        .expect(405, done)
    })
  })

  describe('501 path not implemented', () => {
    it('should responds with path not implemented', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/not-imp-test')
        .expect(501, done)
    })
  })

  describe('cache', () => {
    it('should get request from the cache', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)
      const server = app.listen()
      // no cached request.
      request(server)
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, () => {
          // cached request.
          request(server)
            .get('/test')
            .expect('Content-Type', /json/)
            .expect(/get/)
            .expect(200, done)
        })
    })
  })

  describe('route method', () => {
    it('should route method work', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('prefix as instance arg and method', () => {
    // bad arg passed ==> don't use the prefix.
    it('should prefix instance arg work', (done) => {
      const router = new Router({ expressify: false, prefix: '/preRoute' })
      const app = new Koa()
      
      router.get('/test', (ctx: Koa.BaseContext) => {
        ctx.body = { msg: 'get data' }
      })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should prefix method work', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()

      router
        .prefix('/preRoute')
        .get('/test', (ctx: Koa.BaseContext) => {
          ctx.body = { msg: 'get data' }
        })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('use method', () => {
    it('should use method work with good arg', (done) => {
      const router = new Router<Koa.Middleware>({ expressify: false })
      const app = new Koa()

      router
        .use((ctx: any, next: Next) => {
          console.log('logger', ctx.status, ctx.url)
          next()
        })
        .get('/test', async (ctx: Koa.BaseContext) => {
          ctx.body = { msg: 'get data' }
          return
        })
  
      app.use(router.routes() as any)

      request(app.listen())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should use method throw with bad arg', () => {
      assert.throws(() => { 
        const router = new Router<Koa.Middleware>({ expressify: false })
        const app = new Koa()
  
        router
        .use('bad args' as any)
        .get('/test', (ctx: Koa.BaseContext) => {
          ctx.body = { msg: 'get data' }
        })
    
        app.use(router.routes() as any)
      })
    })
  })
})