import request from 'supertest'
import assert from 'assert'
import Kernel, { Request, Response, Next } from '@macchiatojs/kernel'
import Router from '../../src'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

describe('macchiatojs-router with express/connect style', () => {
  let app: Kernel

  beforeEach(() => {
    app = new Kernel()
  })

  describe('self', () => {
    it('should return a object', () => {
      assert.strictEqual(typeof new Router(), 'object')
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
      const router = new Router()

      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })

      app.use(router.routes())

      request(app.start())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(200, /get data/, done)
    })

    it('post method', (done) => {
      const router = new Router()

      router.post('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'post data' })
      })

      app.use(router.routes())

      request(app.start())
        .post('/test')
        .expect('Content-Type', /json/)
        .expect(200, /post data/, done)
    })

    it('put method', (done) => {
      const router = new Router()

      router.put('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'put data' })
      })

      app.use(router.routes())

      request(app.start())
        .put('/test')
        .expect('Content-Type', /json/)
        .expect(200, /put data/, done)
    })

    it('patch method', (done) => {
      const router = new Router()

      router.patch('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'patch data' })
      })

      app.use(router.routes())

      request(app.start())
        .patch('/test')
        .expect('Content-Type', /json/)
        .expect(200, /patch data/, done)
    })

    it('delete method', (done) => {
      const router = new Router()

      router.delete('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'delete data' })
      })

      app.use(router.routes())

      request(app.start())
        .delete('/test')
        .expect('Content-Type', /json/)
        .expect(200, /delete data/, done)
    })

    describe('all method', () => {
      const app = new Kernel()
      const router = new Router()

      router.all('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'delete data' })
      })

      app.use(router.routes())

      METHODS.forEach((method) => {
        it(method.toLowerCase(), (done) => {
          request(app.reload())[method.toLowerCase()]('/test').expect(200, done())
        })
      })
    })

    it('use route to handle methods (chain)', (done) => {
      (() => {
        const router = new Router()
        const app = new Kernel()

        router
          .route('/test')
          .get((request: Request, response: Response) => { response.send(200, { msg: 'get data' }) })
          .post((request: Request, response: Response) => { response.send(200, { msg: 'post data' }) })
  
        app.use(router.routes())

        request(app.start())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get data/)
        .expect(200)

        request(app.reload())
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
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })

      ;(['post','put','delete'] as string[]).forEach(m => { router[m]('/test', () => void 0) })
  
      app.use(router.routes())

      request(app.start())
        .get('/test')
        .expect(200, done)
    })
  })

  describe('params', () => {
    it('should return a response with params', (done) => {
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test/:state', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data with ' + request['params'].state + ' as params' })
      })
  
      app.use(router.routes())

      request(app.start())
        .get('/test/work')
        .expect(/get data with work as params/)
        .expect(200, done)
    })
  })

  describe('trailing slash and fixed path', () => {
    it('should normalize the path and redirect to correct one', (done) => {
      const router = new Router()
      const app = new Kernel()
      
      router.get('//test/', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())
    
      request(app.start())
        .get('//test')
        .expect(301)
        .expect('Location', '/test')
        .end(done)
    })
  })

  describe('options request', () => {
    it('should responds with allowed methods', (done) => {
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())
    
      request(app.start())
        .options('/test')
        .expect('Allow', 'GET')
        .expect(204, done)
    })
  })

  describe('405 method not allowed', () => {
    it('should responds with method not allowed', (done) => {
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())
    
      request(app.start())
        .post('/test')
        .expect(405, done)
    })
  })

  describe('501 path not implemented', () => {
    it('should responds with path not implemented', (done) => {
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())

      request(app.start())
        .get('/not-imp-test')
        .expect(501, done)
    })
  })

  describe('cache', () => {
    it('should get request from the cache', (done) => {
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())
      const server = app.start()
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
      const router = new Router()
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())

      request(app.start())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('prefix as instance arg and method', () => {
    // bad arg passed ==> don't use the prefix.
    it('should prefix instance arg work', (done) => {
      const router = new Router({ prefix: '/preRoute' })
      const app = new Kernel()
      
      router.get('/test', (request: Request, response: Response) => {
        response.send(200, { msg: 'get data' })
      })
  
      app.use(router.routes())

      request(app.start())
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should prefix method work', (done) => {
      const router = new Router()
      const app = new Kernel()

      router
        .prefix('/preRoute')
        .get('/test', (request: Request, response: Response) => {
          response.send(200, { msg: 'get data' })
        })
  
      app.use(router.routes())

      request(app.start())
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('use method', () => {
    it('should use method work with good arg', (done) => {
      const router = new Router()
      const app = new Kernel()

      router
        .use((request: Request, response: Response, next: Next) => {
          console.log('logger', response.status, request.url)
          next()
        })
        .get('/test', async (request: Request, response: Response) => {
          response.send(200, { msg: 'get data' })
          return
        })
  
      app.use(router.routes())

      request(app.reload())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should use method throw with bad arg', () => {
      assert.throws(() => { 
        const router = new Router()
        const app = new Kernel()
  
        router
        .use('bad args' as any)
        .get('/test', (request: Request, response: Response) => {
          response.send(200, { msg: 'get data' })
        })
    
        app.use(router.routes())
      })
    })
  })
})