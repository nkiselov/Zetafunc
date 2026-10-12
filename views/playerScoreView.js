function makePlayerScoreView(msg){
    let place = makeh("")
    
    let main = makevbox(msg!=""?[
        makeh(msg),
        place
    ]:[
        place
    ])

    main.className+=" scoreView"

    return {
        html: main,
        serverMessage: (msg) => {
            place.innerHTML = "#" + msg.place+" with score "+msg.score
        }
    }
}