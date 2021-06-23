import http from 'http'
import request from 'supertest'
import assert from 'assert'
import Router from '../src'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

describe('macchiatojs-router', () => {
  function createApp (method, path, options?, custom?) {
    const prefix = custom?.prefix
    const useMethod = custom?.useMethod
    const handler = custom?.handler
    const chain = custom?.chain
    
    const router = new Router(!useMethod ? { ...options, prefix }: options)
 
    if (prefix) {
      router
      .prefix(
        useMethod 
          ? prefix
          : undefined
      )[method](path, (request, response) => {
        response.statusCode = 200
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({ msg: `${method} data` }))
        response.end()
      })
    } else if (handler) {
      router
        .use(handler)[method](path, (request, response) => {
          response.statusCode = 200
          response.setHeader('content-type', 'application/json')
          response.write(JSON.stringify({ msg: `${method} data` }))
          response.end()
        })
    } else if (chain) {
      router.route(path)['get']((request, response) => {
        response.statusCode = 200
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({ msg: `${method} data` }))
        response.end()
      })['post']((request, response) => {
        response.statusCode = 200
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({ msg: `${method} data` }))
        response.end()
      })
    } else {
      router[method](path, (request, response) => {
        response.statusCode = 200
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({ msg: `${method} data` }))
        response.end()
      })
    }

    const server = http.createServer((request, response) => {
      router.routes(request, response)
    })

    return server
  }

  describe('self', () => {
    it('should return a object', () => {
      assert.strictEqual(typeof new Router(), 'object')
    })

    // it('should not return private props/method', () => {
    //   assert.deepStrictEqual(
    //     Object.getOwnPropertyNames(Router.prototype),
    //     [
    //       'constructor', 'get', 'post', 'put', 'patch',
    //       'delete', 'all', 'prefix', 'route', 'use', 'routes'
    //     ]
    //   )
    // })
  })

  describe('http verbs/methods', () => {
    it('get method', (done) => {      
      request(createApp('get', '/test'))
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get data/)
        .expect(200, done)
    })

    it('post method', (done) => {
      request(createApp('post', '/test'))
        .post('/test')
        .expect('Content-Type', /json/)
        .expect(/post data/)
        .expect(200, done)
    })

    it('put method', (done) => {
      request(createApp('put', '/test'))
        .put('/test')
        .expect('Content-Type', /json/)
        .expect(/put data/)
        .expect(200, done)
    })

    it('patch method', (done) => {
      request(createApp('patch', '/test'))
        .patch('/test')
        .expect('Content-Type', /json/)
        .expect(/patch data/)
        .expect(200, done)
    })

    it('delete method', (done) => {
      request(createApp('delete', '/test'))
        .delete('/test')
        .expect('Content-Type', /json/)
        .expect(/delete data/)
        .expect(200, done)
    })

    describe('all method', () => {
      METHODS.forEach((method) => {
        it(method.toLowerCase(), (done) => {
          request(createApp('all', '/test'))[method.toLowerCase()]('/test').expect(200, done())
        })
      })
    })

    it('use route to handle methods (chain)', (done) => {
      (() => {
        request(createApp('', '/test', {}, { chain: true }))
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get data/)
        .expect(200)

        request(createApp('', '/test', {}, { chain: true }))
          .post('/test')
          .expect('Content-Type', /json/)
          .expect(/delete data/)
          .expect(200)

        done()
      })()
    })
  })

  describe('favicon request', () => {
    it('should ignore the favicon request', (done) => {
      request(createApp('get', '/test'))
        .get('/favicon.ico')
        .expect(404, done)
    })
  })

  describe('allow header field', () => {
    function createLocalApp (method, path, methods) {
      // init
      const router = new Router()
   
      router[method](path, (request, response) => {
        response.statusCode = 200
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({ msg: `${method} data` }))
        response.end()
      })
  
      methods.forEach(m => { router[m](path, () => void 0) })
  
      const server = http.createServer((request, response) => {
        router.routes(request, response)
      })
  
      return server
    }

    it('should allow header funcs work', (done) => {
      request(createLocalApp(
        'get',
        'test',
        ['post', 'put', 'delete']
      )).get('/test').expect(200, done)
    })
  })

  describe('params', () => {
    function createLocalApp (method, path) {
      // init
      const router = new Router()
   
      router[method](path, (request, response) => {
        response.statusCode = 200
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({ msg: `${method} data ${request.params ? request.params.state : ''}` }))
        response.end()
      })
    
      const server = http.createServer((request, response) => {
        router.routes(request, response)
      })
  
      return server
    }

    it('should return a response with params', (done) => {
      request(createLocalApp('get', '/test/:state').listen())
        .get('/test/work')
        .expect(/get data work/)
        .expect(200, done)
    })
  })

  describe('trailing slash and fixed path', () => {
    it('should normalize the path and redirect to correct one', (done) => {
      request(createApp('get', '//test/'))
        .get('//test')
        .expect(302)
        .expect('Location', '/test')
        .end(done)
    })
  })

  describe('options request', () => {
    it('should responds with allowed methods', (done) => {
      request(createApp('get', '/test'))
        .options('/test')
        .expect('Allow', 'GET')
        .expect(204, done)
    })
  })

  describe('405 method not allowed', () => {
    it('should responds with method not allowed', (done) => {
      request(createApp('get', '/test'))
        .post('/test')
        .expect(405, done)
    })

    it('should throw when passed throw eq true as instance arg', (done) => {
      request(createApp('get', '/test', { throw: true }))
        .post('/test')
        .expect(405, (err) => err ? done(err) : done())
    })

    // it('should throw with custom function when passed as instance arg', (done) => {
    //   function methodNotAllowed () {
    //     const methodNotAllowedErr = new Error('Custom Method Not Allowed Error')
    //     methodNotAllowedErr.type = 'custom'
    //     methodNotAllowedErr.statusCode = 405
    //     methodNotAllowedErr.body = {
    //       error: 'Custom Method Not Allowed Error',
    //       statusCode: 405,
    //       otherStuff: true
    //     }

    //     return methodNotAllowedErr
    //   }

    //   request(createApp('get', '/test', { throw: true, methodNotAllowed }).listen())
    //     .post('/test')
    //     .expect(405)
    //     .end((err) => err ? done(err) : done())
    // })
  })

  describe('501 path not implemented', () => {
    it('should responds with path not implemented', (done) => {
      request(createApp('get', '/test'))
        .get('/not-imp-test')
        .expect(501, done)
    })

    it('should throw when passed throw eq true as instance arg', (done) => {
      request(createApp('get', '/test', { throw: true }))
        .get('/not-imp-test')
        .expect(501)
        .end((err) => err ? done(err) : done())
    })

    // it('should throw with custom function when passed as instance arg', (done) => {
    //   function notImplemented () {
    //     const pathNotImplementedErr = new Error('Custom Path Not Implemented Error')
    //     pathNotImplementedErr.type = 'custom'
    //     pathNotImplementedErr.statusCode = 501
    //     pathNotImplementedErr.body = {
    //       error: 'Custom Path Not Implemented Error',
    //       statusCode: 501,
    //       otherStuff: true
    //     }

    //     return pathNotImplementedErr
    //   }

    //   request(createApp('get', '/test', { throw: true, notImplemented }).listen())
    //     .get('/not-imp-test')
    //     .expect(501)
    //     .end((err) => err ? done(err) : done())
    // })
  })

  describe('cache', () => {
    it('should get request from the cache', (done) => {
      // no cached request.
      request(createApp('get', '/test'))
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, () => {
          // cached request.
          request(createApp('get', '/test'))
            .get('/test')
            .expect('Content-Type', /json/)
            .expect(/get/)
            .expect(200, done)
        })
    })
  })

  describe('route method', () => {
    it('should route method work', (done) => {
      request(createApp('get', '/test'))
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('prefix as instance arg and method', () => {
    // bad arg passed ==> don't use the prefix.
    it('should prefix instance arg work', (done) => {
      request(createApp(
        'get',
        '/test',
        {},
        { prefix: '/preRoute', useMethod: false }
      ))
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should prefix method work', (done) => {
      request(createApp(
        'get',
        '/test',
        {},
        { prefix: '/preRoute', useMethod: true }
      ))
        .get('/preRoute/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })
  })

  describe('use method', () => {
    it('should use method work with good arg', (done) => {
      const handler = (request, response) => {
        console.log('logger', request.statusCode, request.url)
        return
      }

      request(createApp('get', 'test', {}, { handler }))
        .get('/test')
        .expect('Content-Type', /json/)
        .expect(/get/)
        .expect(200, done)
    })

    it('should use method throw with bad arg', () => {
      assert.throws(() => { createApp('get', 'test', {}, { handler: 'bad args' }) })
    })
  })
})