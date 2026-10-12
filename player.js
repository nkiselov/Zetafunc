let views = new Map()

function addView(key,view){
    views.set(key,view)
}

let curView = null

function setView(key){
    curViewType = key
    document.body.innerHTML = ""
    curView = views.get(key)()
    document.body.appendChild(curView.html)
}

let comm = {}

addView("name",()=>makeNameInputView(comm))
addView("loading",()=>makeLoadingView("Loading ... "))
addView("play",()=>makeFunctionView(comm,true))
addView("wait",()=>makeLoadingView("Waiting for game to start"))
addView("show_submission",()=>makeLoadingView("Showing submissions"))
addView("show_board",()=>makePlayerScoreView(""))
addView("final",()=>makePlayerScoreView("Thanks for playing"))
addView("ready",()=>makeReadyView())

setView("loading")

function onopen(){
    console.log("open")
}

function onmessage(msg){
    if(views.has(msg.type)){
        if(msg.type!=curViewType){
            setView(msg.type)
        }
        curView.serverMessage(msg)
    }else console.error("Unrecognized type "+msg.type)
}

comm.sendMessage = initConnection("player",onmessage,onopen).sendMessage