import { useEffect, useRef, useState } from 'react'

import { ProtoHttpToWs } from '../lib/util'
import { getServer, getConfig, shareGetRoom } from '../lib/api'
import LibFgg from '../libfgg/libfgg'
import log  from 'loglevel'
import { Meta } from '../libfgg/pool/data'

import Address from './Address'
import File from './File'
import Qrcode from './QRCode'
import Card from './card'

import { DomSendFile, DomRecvFile } from '../libfgg/pool/file/dom'

const fgg = new LibFgg()
let enabled = true

function Index(props: { address: string }) {
  const address = props.address

  const [meta, setMeta] = useState<Meta | null>(null)

  const [progress, setProgress] = useState<number>(0)
  const [total, setTotal] = useState<number>(10)
  const [recver, setRecver] = useState<boolean>(false)

  const refIce = useRef<RTCIceServer[]>([])

  fgg.onPreTran = (meta: Meta) => {
    setTotal(meta.size)
    setMeta(meta)
  }

  fgg.onRecvFile = () => {
    fgg.setRecv(new DomRecvFile())
    setRecver(true)
  }

  fgg.setOnProgress((c: number): void => {
    setProgress(c)
    log.debug(progress)
  })

  const getfile = async () => {
    await fgg.run()
  }
  const handleFile = function(files: FileList) {
    fgg.setSend(new DomSendFile(files[0]))
  }

  useEffect(() => {
    const init = async function() {
      refIce.current = await getConfig()
    }

    init()
    return () => {
      //fgg.close()
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      enabled = false

      const init = async() => {
        const addr = getServer() + shareGetRoom(address)
        await fgg.useWebsocket(ProtoHttpToWs(addr))

        fgg.useWebRTC({
          iceServers: refIce.current,
        })

        fgg.clientMeta()
      }

      init()
    }
  }, [props.address])

  return (
    <>
      { recver && meta
        ? <Card name={ meta.name } type={ meta.type } size={ meta.size }></Card>
        : <>
            <Qrcode address={ address }></Qrcode>
            <Address address={ address }></Address>
          </>
      }
      <File
        recver={ recver }
        percent={ progress / total * 100 }
        handleFile={ (files: any) => { handleFile(files) } }
        getFile={ getfile }
      ></File>
    </>
  )
}

export default Index
