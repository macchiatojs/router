import { Next } from '@macchiatojs/kernel';
import request from 'supertest'
import assert from 'assert'
import http, { IncomingMessage, ServerResponse } from 'http'
import Router from '../../src'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function handler(request, response) {
  return (content) => {
    response.statusCode = 200
    response.setHeader('content-type', 'application/json')
    response.write(JSON.stringify({ msg: `${content} data` }))
    response.end()
  }
}

describe('macchiatojs-router with express/connect style', () => {
  describe('self', () => {
    it('should return a object', () => {
      assert.strictEqual(typeof new Router({ raw: true }), 'object')
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
      const router = new Router({ raw: true })

      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
 
      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(200, /get data/, done)
    })

    it('post method', (done) => {
      const router = new Router({ raw: true })

      router.post('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('post') })

      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .post('/test')
        .expect('Content-Type', /json/)
        .expect(200, /post data/, done)
    })

    it('put method', (done) => {
      const router = new Router({ raw: true })

      router.put('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('put') })

      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .put('/test')
        .expect('Content-Type', /json/)
        .expect(200, /put data/, done)
    })

    it('patch method', (done) => {
      const router = new Router({ raw: true })

      router.patch('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('patch') })

      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .patch('/test')
        .expect('Content-Type', /json/)
        .expect(200, /patch data/, done)
    })

    it('delete method', (done) => {
      const router = new Router({ raw: true })

      router.delete('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('delete') })

      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .delete('/test')
        .expect('Content-Type', /json/)
        .expect(200, /delete data/, done)
    })

    describe('all method', () => {
      const router = new Router({ raw: true })

      router.all('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('all') })

      const server = http.createServer(router.rawRoutes())

      server.listen()

      METHODS.forEach((method) => {
        it(method.toLowerCase(), (done) => {
          request(server)[method.toLowerCase()]('/test').expect(200, done())
        })
      })
    })

    it('use route to handle methods (chain)', (done) => {
      (() => {
        const router = new Router({ raw: true })


        router
          .route('/test')
          .get((
            request: IncomingMessage,
            response: ServerResponse
          ) => { handler(request, response)('get') })
          .post((
            request: IncomingMessage,
            response: ServerResponse
          ) => { handler(request, response)('post') })
  
        const server = http.createServer(router.rawRoutes())
        server.listen()

        request(server)
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get data/)
        .expect(200)

        request(server)
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
      const router = new Router({ raw: true })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })

      ;(['post','put','delete'] as string[]).forEach(m => { router[m]('/test', () => void 0) })
  
      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .get('/test')
        .expect(200, done)
    })
  })

  describe('params', () => {
    it('should return a response with params', (done) => {
      const router = new Router({ raw: true })
      
      router.get('/test/:state', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { 
        handler(request, response)('get with ' + request['params'].state + ' as')
      })
  
      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .get('/test/work')
        .expect(/get with work as data/)
        .expect(200, done)
    })
  })

  describe('trailing slash and fixed path', () => {
    it('should normalize the path and redirect to correct one', (done) => {
      const router = new Router({ raw: true })
      
      router.get('//test/', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())
    
      request(server.listen())
        .get('//test')
        .expect(301)
        .expect('Location', '/test')
        .end(done)
    })
  })

  describe('options request', () => {
    it('should responds with allowed methods', (done) => {
      const router = new Router({ raw: true })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())
    
      request(server.listen())
        .options('/test')
        .expect('Allow', 'GET')
        .expect(204, done)
    })
  })

  describe('405 method not allowed', () => {
    it('should responds with method not allowed', (done) => {
      const router = new Router({ raw: true })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())
    
      request(server.listen())
        .post('/test')
        .expect(405, done)
    })
  })

  describe('501 path not implemented', () => {
    it('should responds with path not implemented', (done) => {
      const router = new Router({ raw: true })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .get('/not-imp-test')
        .expect(501, done)
    })
  })

  describe('cache', () => {
    it('should get request from the cache', (done) => {
      const router = new Router({ raw: true })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())
      
      server.listen()

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
      const router = new Router({ raw: true })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())

      request(server.listen())
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('prefix as instance arg and method', () => {
    // bad arg passed ==> don't use the prefix.
    it('should prefix instance arg work', (done) => {
      const router = new Router({ raw: true, prefix: '/preRoute' })
      
      router.get('/test', (
        request: IncomingMessage,
        response: ServerResponse
      ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())

      server.listen()

      request(server)
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(200, /get/, done)
    })

    it('should prefix method work', (done) => {
      const router = new Router({ raw: true })

      router
        .prefix('/preRoute')
        .get('/test', (
          request: IncomingMessage,
          response: ServerResponse
        ) => { handler(request, response)('get') })
      
  
      const server = http.createServer(router.rawRoutes())

      server.listen()

      request(server)
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('use method', () => {
    it('should use method work with good arg', (done) => {
      const router = new Router({ raw: true })

      router
        .use((
          request: IncomingMessage,
          response: ServerResponse,
          next: Next
        ) => {
          console.log('logger ---> ', request.url)
          next()
        })
        .get('/test', (
          request: IncomingMessage,
          response: ServerResponse
        ) => { handler(request, response)('get') })
  
      const server = http.createServer(router.rawRoutes())

      server.listen()

      request(server)
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should use method throw with bad arg', () => {
      assert.throws(() => { 
        const router = new Router({ raw: true })

  
        router
        .use('bad args' as any)
        .get('/test', (
          request: IncomingMessage,
          response: ServerResponse
        ) => { handler(request, response)('get') })
    
        const server = http.createServer(router.rawRoutes())

        server.listen()
      })
    })
  })

  describe('rawRoutes method', () => {
    it('should throw when don\'t set the raw option to true', () => {
      assert.throws(() => { 
        const router = new Router()

        router
        .get('/test', (
          request: IncomingMessage,
          response: ServerResponse
        ) => { handler(request, response)('get') })
    
        const server = http.createServer(router.rawRoutes())

        server.listen()
      })
    })
  })
})