import fs from 'fs'
import url from 'url'
import http from 'http'
import path from 'path'
import browserify from 'browserify'
import es6ify from 'es6ify'
import { Server } from 'bittorrent-tracker'

const port = 9231

http.createServer()
  .on('listening', () => console.log('Server listening on', port))
  .on('close', () => console.log('Shutting down'))
  .on('error', err => console.log('Server error:', err))
  .on('request', (req, res) => {
    switch (req.url) {
      case '/jquery.js':
        fs.readFile(path.resolve(__dirname, '../node_modules/jquery/dist/jquery.min.js'), (err, body) => {
          if (err) { console.log(err); return }
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Content-Length': body.length })
          res.write(body, () => res.end())
        })
        break

      case '/davis.js':
        fs.readFile(path.resolve(__dirname, '../node_modules/Davis/davis.min.js'), (err, body) => {
          if (err) { console.log(err); return }
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Content-Length': body.length })
          res.write(body, () => res.end())
        })
        break

      case '/client.js':
        res.setHeader('Content-Type', 'application/javascript')
        browserify({ debug: true })
          .add(es6ify.runtime)
          .transform(es6ify)
          .require(path.resolve(__dirname, '../client/index.js'), { entry: true })
          .bundle()
          .on('error', err => console.error(err))
          .pipe(res)
        break

      default:
        fs.readFile(path.resolve(__dirname, '../client/index.html'), (err, body) => {
          if (err) { console.log(err); return }
          res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': body.length })
          res.write(body, () => res.end())
        })
        break
    }
  })
  .listen(port)

var tracker = new Server({ http: true, ws: true, udp: false })

tracker.on('error', err => console.error('ERROR: ' + err.message))
tracker.on('warning', err => console.log('WARNING: ' + err.message))

tracker.listen(8000, () => console.log('tracker listening on ' + tracker.http.address().port))
