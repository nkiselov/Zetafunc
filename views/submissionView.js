function makeSubmissionView(){
    let elt = makediv([])
    elt.className = "desmos"
    let line = makeh()

    let calculator = Desmos.GraphingCalculator(elt,{
        allowComplex: false,
        recursion: false
    })

    let topBar = makehbox([line])
    topBar.className += " submissionBar"

    let main = makevbox([
        topBar,
        elt
    ])

    return {
        html: main,
        serverMessage: (msg) => {
            calculator.setState(msg.calc)
            calculator.setMathBounds(msg.question.view)
            line.innerHTML = msg.name+ " for " + msg.score + " pts"
        }
    }
}