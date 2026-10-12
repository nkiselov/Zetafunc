function makeNameInputView(comm){
    let title = makeh("Enter name")
    let status = makeh("")
    let field = makeInput(()=>{
        status.innerHTML = ""
    })
    let submit = makeButton("Join",()=>{
        console.log(comm)
        comm.sendMessage({
            type: "name",
            name: field.getValue()
        })
    })
    
    let main = makevbox([
        title,
        makehbox([
            field.html,
            submit
        ]),
        status
    ])

    main.className+=" nameInput"

    return {
        html: main,
        serverMessage: (msg) => {
            switch(msg.reason){
                case 'bad':
                    status.innerHTML = "Name is not allowed"
                    break
                case 'used':
                    status.innerHTML = "Name already used"
                    break
            }
        }
    }
}