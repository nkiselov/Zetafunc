import express from 'express'
import path from 'path'
import { fileURLToPath } from 'node:url'
import ip from 'ip'
import WebSocket, { WebSocketServer } from 'ws'
import {setupGameManager} from './gameManager.js'
import {randomUUID} from 'crypto'
import * as COLOR from './colors.js'
import * as readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

rl.prompt();

function safeLog(message) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(message);
    rl.prompt(true);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = 8080

function getipv4(ip){
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7)
    }
    return ip
}

app.use(express.static(__dirname));

app.use((req, res, next) => {
    res.on('finish',()=>{
        // if(!res.ok) safeLog(`${req.method} ${req.url} from ${getipv4(req.ip)} with code ${res.statusCode}`)
    })
    next()
})

app.get('/board', (req, res) => {
    res.sendFile(path.join(__dirname, 'board.html'))
})

let server = app.listen(PORT, () => {
    safeLog(`HTTP server running at ${ip.address()}:${PORT}`)
})

const wss = new WebSocketServer({ server })

function serverMsg(str){
    safeLog(COLOR.BLUE+"SERVER: "+str+COLOR.RESET)
}

function serverError(str){
    safeLog(COLOR.RED+"SERVER: "+str+COLOR.RESET)
}

function clientError(str){
    safeLog(COLOR.RED+"CLIENT: "+str+COLOR.RESET)
}

function sumId(str){
    return str.substring(0,str.indexOf('-'))
}

let broadcastList = new Map()
let playerList = new Map()

function broadcastMessage(msg){
    for (const [_, value] of broadcastList){
        value.send(JSON.stringify(msg))
    }
}

function sendMessage(id,msg){
    if(!playerList.has(id)) return
    playerList.get(id).send(JSON.stringify(msg))
}

function removePlayer(id){
    playerList.get(id).close()
    playerList.delete(id)
    serverMsg(sumId(id)+" removed")
}

let gameManager = setupGameManager(sendMessage,removePlayer,broadcastMessage,safeLog)

wss.on('connection',(ws)=>{
    let connType = null
    let cookie = null
    let broadId = null
    ws.onmessage = e=>{
        try{
            let msg = JSON.parse(e.data)
            if(msg.type=="system"){
                if(msg.connType=="player"){
                    if(msg.cookie==null){
                        ws.send(JSON.stringify({
                            type: "system",
                            status: "cookie",
                            cookie: randomUUID()
                        }))
                    }else{
                        connType = "player"
                        cookie = msg.cookie
                        playerList.set(msg.cookie,ws)
                        ws.send(JSON.stringify({
                            type: "system",
                            status: "ok"
                        }))
                        gameManager.playerJoin(cookie)
                        serverMsg("Player "+sumId(cookie)+" connected")
                    }
                }else if(msg.connType=="broadcast"){
                    connType = "broadcast"
                    broadId = randomUUID()
                    broadcastList.set(broadId,ws)
                    ws.send(JSON.stringify({
                        type: "system",
                        status: "ok"
                    }))
                    ws.send(JSON.stringify(
                        gameManager.getBroadcastMessage()
                    ))
                    serverMsg("Broadcast "+sumId(broadId)+" joined")
                }else serverError("Unknown connection type")
            }else{
                if(connType==null){
                    serverError("Undefined connection type")
                    ws.close()
                    return
                }
                if(connType=="broadcast") serverError("Broadcast can't send message");
                else if(connType=="player"){
                    gameManager.playerMessage(cookie,msg)
                }
            }
        }catch(e){
            serverError(e.message)
        }
    }
    ws.onerror = e=> clientError(e.message)
    ws.onclose = e=> {
        if(connType=="broadcast"){
            broadcastList.delete(broadId)
            serverMsg("Broadcast "+sumId(broadId)+" left")
        }
        if(connType=="player"){
            playerList.delete(cookie)
            serverMsg("Player "+sumId(cookie)+" left")
        }
    }
})

rl.on('line', (input) => {
    gameManager.inputLine(input)
    rl.prompt(); 
});