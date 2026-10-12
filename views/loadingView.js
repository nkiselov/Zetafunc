function makeLoadingView(str){
    let main = makevbox([makeh(str)])
    main.className += " loading"
    return {
        html: main,
        serverMessage: (msg) => console.log(msg)
    }
}