function makeLobbyView(){
    let main = makevbox([])
    main.className += " lobbyMain"
    return {
        html: main,
        serverMessage: (msg) => {
            main.innerHTML = ""
            main.appendChild(makeh("Players: "+msg.players.length))
            main.appendChild(makehbox(msg.players.map((pl)=>{
                let dv = makediv([makeh(pl)])
                dv.className+=" lobbyBox"
                return dv
            })))
        }
    }
}