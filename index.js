const createClientDiablo = require('./lib/client/createClientDiablo')
const mcpProtocol = require('./data/mcp')
const sidProtocol = require('./data/sid')
const bnftpProtocol = require('./data/bnftp')
const { createSplitter } = require('./lib/utils/splitter')
const { decompress, compress, getPacketSize } = require('./lib/utils/compression')
const d2gsProtocol = require('./data/d2gs')
const d2gsReader = require('./lib/utils/d2gsSpecialReader')
const getHash = require('./lib/utils/getHash')
const createServerDiablo = require('./lib/server/createServerDiablo')

module.exports = {
  createClientDiablo,
  mcpProtocol,
  sidProtocol,
  bnftpProtocol,
  createSplitter,
  decompress,
  compress,
  getPacketSize,
  d2gsProtocol,
  d2gsReader,
  getHash,
  createServerDiablo
}