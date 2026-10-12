function makeBoardView(title){
    let main = makevbox([])
    main.className+=" boardMain"
    return {
        html: main,
        serverMessage: msg=>{
            main.innerHTML = ""
            let elems = msg.list.map((x,i)=>{
                let dv = makediv([makeh(i+1),makeh(x[1]),makeh(x[2])])
                dv.className+=" boardBox"
                return dv
            })
            main.appendChild(makeh(title))
            for(const el of elems) main.appendChild(el)
        }
    }
}