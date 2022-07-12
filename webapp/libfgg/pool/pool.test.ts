import { assert, describe, it } from 'vitest'

// Node.js need polyfill "File"
// https://www.npmjs.com/package/@web-std/file
import { File } from "@web-std/file"

import Pool from "./pool"

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length: number) {
  let result           = ''
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength))
  }
  return result
}

function helpCreateTmpFile(name: string, size: number): File {
  const chunkSize = 4096
  const count = size / chunkSize
  const remain = size % chunkSize

  const createFile = (): BlobPart[] => {
    let data = Array<BlobPart>()
    for (let i = 0; i < count; i++) {
      data.push(makeid(chunkSize))
    }

    data.push(makeid(remain))

    return data
  }

  return new File(createFile(), name, {
    type: "text/plain",
  })
}


describe('file pool test', async () => {
  const name = "filename"
  const size = 1024*1024
  const file = helpCreateTmpFile(name, size)

  const sender = new Pool
  sender.setSend(file)

  const meta = sender.sendMeta()

  it('meta file name', () => {
    assert.equal(name, meta.file)
  })

  it('meta file size', () => {
    assert.equal(size, meta.size)
  })

  const recver = new Pool

  // TODO: need a empty file
  recver.setRecv(file)
  recver.recvMeta(meta)

  const c = recver.next()

  it('recv next data chunk', () => {
    assert.notEqual(c, null)
  })

  if (c) {
    const data = await sender.sendData(c)
    await recver.recvData(c, data)
  }

  const run = async (): Promise<void> => {
    return new Promise((resolve) => {
      const timer = setInterval(async() => {
        const c = recver.next()
        if (c) {
          const data = await sender.sendData(c)
          await recver.recvData(c, data)
        }
      }, 100)

      recver.OnFinish = () => {
        clearInterval(timer)
        resolve()
      }
    })
  }

  await run()

  const hash = sender.sendHash()
  const ok = recver.recvHash(hash)

  it('check sum', () => {
    assert.equal(ok, true)
  })
})