const net = require('net')

const ProtoDef = require('protodef').ProtoDef
const FullPacketParser = require('protodef').Parser
const protocol = require('../../data/d2gs')
const EventEmitter = require('events').EventEmitter
const { decompress } = require('../utils/compression')
const d2gsReader = require('../utils/d2gsSpecialReader')

const { createSplitter, createFramer } = require('../utils/splitter')

const protoToServer = new ProtoDef()
protoToServer.addTypes(d2gsReader)
protoToServer.addProtocol(protocol, ['toServer'])

const protoToClient = new ProtoDef()
protoToClient.addTypes(d2gsReader)
protoToClient.addProtocol(protocol, ['toClient'])

const toClientParser = new FullPacketParser(protoToClient, 'packet')

class Client extends EventEmitter {
  constructor (isServer = false) {
    super()
    this.compression = false
    this.isServer = isServer
  }

  connect (host, port) {
    this.host = host
    this.port = port
    this.setSocket(net.createConnection({ port: this.port, host: this.host }, () => {
      this.emit('connect')
    }))
  }

  setSocket (socket) {
    this.socket = socket

    this.splitter = createSplitter()
    this.framer = createFramer()
    this.framer.on('data', data => {
      // console.log('sending buffer d2gs ' + data.toString('hex'))
      this.socket.write(data)
    })
    this.splitter.on('data', data => {
      const uncompressedData = decompress(data)

      // console.log('uncompressed d2gs received hex : ' + uncompressedData.toString('hex'))
      toClientParser.write(uncompressedData)
    })

    toClientParser.on('data', ({ data }) => {
      const { name, params } = data
      console.info('received compressed packet', name, JSON.stringify(params))

      this.emit(name, params)
      this.emit('packet', { name, params })
    })
    toClientParser.on('error', err => console.log('d2gsToClient error : ', err.message))

    const proto = this.isServer ? protoToServer : protoToClient
    this.socket.on('data', (data) => {
      // data = decompress(data);
      // console.log('received that d2gs hex', data.toString('hex'))

      if (!this.compression) {
        if (data[0] !== 0xaf) { data = data.slice(1) }

        const parsed = proto.parsePacketBuffer('packet', data).data

        const { name, params } = parsed
        // console.info('received uncompressed packet', name, JSON.stringify(params))

        this.emit(name, params)
        this.emit('packet', { name, params })
      } else {
        this.splitter.write(data)
      }
    })

    this.socket.on('end', () => {
      console.log('disconnected from server')
    })
  }

  enableCompression () {
    this.compression = true
  }

  write (packetName, params) {
    const proto = this.isServer ? protoToClient : protoToServer
    try {
      const buffer = proto.createPacketBuffer('packet', {
        name: packetName,
        params
      })

      console.info('sending uncompressed packet', packetName, params)
      this.socket.write(buffer)
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = Client