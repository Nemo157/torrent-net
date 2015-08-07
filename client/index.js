import dragDrop from 'drag-drop/buffer'
import WebTorrent from 'webtorrent'
import debug from 'debug'

const tracker = 'ws://localhost:8000'
const client = new WebTorrent()

const result = document.getElementById('result')
const pages = document.getElementById('pages')

var myConsole = {
  log: debug('torrent-net:log'),
  error: debug('torrent-net:error')
}
myConsole.log.log = console.log.bind(console)
myConsole.error.log = console.error.bind(console)

global.Davis.logger = function () {
  this.logger = {
    error: debug('davis:error'),
    info: debug('davis:info'),
    warn: debug('davis:warn')
  }
  this.logger.error.log = console.error.bind(console)
  this.logger.info.log = console.info.bind(console)
  this.logger.warn.log = console.warn.bind(console)
}

debug.enable('torrent-net:*,davis:*,webtorrent,webtorrent-swarm,bittorrent-tracker,torrent-discovery')

dragDrop('#drop', files =>
  client.seed(files, { announceList: [[tracker]] }, torrent => {
    myConsole.log('Seeding as', torrent.infoHash)
    addKnownPage(torrent.infoHash, files[0].name)
  }))

function addKnownPage (hash, name) {
  let page = document.createElement('div')
  page.innerHTML = '<a href="/' + hash + '/' + name + '">' + hash + '/' + name + '</a>'
  pages.appendChild(page)
  davis.listen()
}

function show (id, filename) {
  myConsole.log('Loading', filename, 'from', id)
  var handle = torrent => {
    myConsole.log('Loaded', torrent.infoHash)
    var file = torrent.files.find(file => file.name === filename)
    if (file) {
      file.getBuffer((err, buffer) => {
        if (err) {
          myConsole.error(err)
        } else {
          addKnownPage(id, filename)
          myConsole.log('Loaded', filename, 'from', torrent.infoHash)
          result.innerHTML = buffer.toString()
        }
      })
    } else {
      myConsole.log(filename, 'not found in torrent', torrent.infoHash)
    }
  }
  var torrent = client.torrents.find(torrent => torrent.infoHash === id)
  if (torrent) {
    handle(torrent)
  } else {
    client.add({ tr: tracker, infoHash: id, announce: tracker }, handle)
  }
}

var davis = global.Davis(function () {
  this.get('/', req => {})
  this.get('/:id/:file', req => show(req.params.id, req.params.file))
})

davis.settings.handleRouteNotFound = true
davis.settings.generateRequestOnPageLoad = true

davis.start()

// vim:sw=2:ts=2:et
