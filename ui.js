function makeButton(label, onclick){
    let button = document.createElement("button")
    button.onclick = onclick
    button.innerHTML = label
    return button
}

function makediv(elems){
    let div = document.createElement("div")
    elems.forEach((e)=>div.appendChild(e))
    return div
}

function makeCont(elems){
    let cont = makediv(elems)
    cont.className = "container"
    return cont
}

function makehbox(elems){
    let hbox = makediv(elems)
    hbox.className = "hbox"
    return hbox
}

function makevbox(elems){
    let vbox = makediv(elems)
    vbox.className = "vbox"
    return vbox
}

function makeh(text){
    let h = document.createElement("h")
    h.innerHTML = text
    return h
}

function makeInput(onkeydown){
    let cont = document.createElement("div")
    let inp = document.createElement("input")
    inp.pattern = "[a-zA-Z0-9]+"
    inp.onkeydown = onkeydown
    cont.appendChild(inp)
    return {
        html: cont,
        getValue: ()=>{
            return inp.value
        }
    }
}
