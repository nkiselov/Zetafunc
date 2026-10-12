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

addView("loading",()=>makeLoadingView("Loading ... "))
addView("play",()=>makeFunctionView(comm,false))
addView("wait",()=>makeLobbyView())
addView("show_submission",()=>makeSubmissionView())
addView("show_board",()=>makeBoardView("Standings"))
addView("final",()=>makeBoardView("Final Results"))
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

comm.sendMessage = initConnection("broadcast",onmessage,onopen).sendMessage