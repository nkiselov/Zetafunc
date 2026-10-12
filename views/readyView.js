function makeReadyView(){
    let line1 = makeh("")
    let line2 = makeh("")
    
    let main = makevbox([
        line1,
        line2
    ])

    main.className+=" ready"

    return {
        html: main,
        serverMessage: (msg) => {
            let q = msg.question
            line1.innerHTML = "Round #"+msg.round+" for "+q.pts+ " pts"
            line2.innerHTML = Math.floor(q.time/60)+":"+String(q.time%60).padStart(2, '0')
        }
    }
}