function makeFunctionView(comm,player){

    let elt = makediv([])
    elt.className = "desmos"
    let score = makeh()
    let time = makeh()

    let endTime = new Date().getTime()

    let curQuestion = {
        func: "0",
        left: -1,
        right: 1,
        pts: 100,
        time: 0,
        view: {
            xmin: -1.1,
            xmax: 1.1,
            ymin: -1.1,
            ymax: 1.1
        }
    }

    let calculator = Desmos.GraphingCalculator(elt,{
        allowComplex: false,
        recursion: false,
        expressions: player
    })

    calculator.setExpression({ id: 'score_raw', latex: 'S_r(u)=\\frac{\\int_{D_L(0)}^{D_R(0)}\\left(g\\left(t\\right)-f\\left(t\\right)\\right)^{2}dt}{\\int_{D_L(0)}^{D_R(0)}f\\left(t\\right)^{2}dt}', hidden:true, secret:true})
    calculator.setExpression({ id: 'score', latex: 'S_f(u)=\\max\\left(0,-\\frac{1}{6}\\log\\left(\\max\\left(10^{-6},S_r(0)\\right)\\right)\\right)',hidden:true, secret:true})
    calculator.setExpression({ id: 'user_domain_left', latex: 'L=D_L(0)', hidden:true, secret:true})
    calculator.setExpression({ id: 'user_domain_right', latex: 'R=D_R(0)', hidden:true, secret:true})
    calculator.setExpression({ id: 'user_score', latex: 'S=S_f(0)', hidden:true, secret:true})

    if(player) calculator.setExpression({ id: 'guess', latex: 'g(x)=0'})

    let scoreFunc = calculator.HelperExpression({ latex: 'S_f(0)'});

    function setQuestion(){
        calculator.setExpression({ id: 'domain_left', latex: 'D_L(u)='+curQuestion.left, hidden:true, secret:true})
        calculator.setExpression({ id: 'domain_right', latex: 'D_R(u)='+curQuestion.right, hidden:true, secret:true})
        calculator.setExpression({ id: 'secret_func', latex: 'f(x)='+curQuestion.func+'+0g(x)\\left\\{x>D_L(0)\\right\\}\\left\\{x<D_R(0)\\right\\}', hidden:true, secret:true})
        calculator.setExpression({ id: 'secret_func_graph', latex: curQuestion.func+'\\left\\{x>D_L(0)\\right\\}\\left\\{x<D_R(0)\\right\\}', secret:true})

        calculator.setMathBounds(curQuestion.view)
    }

    scoreFunc.observe('numericValue', function () {
        if(isNaN(scoreFunc.numericValue)){
            score.innerHTML = "INVALID";
        }else score.innerHTML =  Math.round(curQuestion.pts*scoreFunc.numericValue)+" pts / "+curQuestion.pts + " pts";
    });

    setQuestion()

    setInterval(()=>{
        let msLeft = Math.max(endTime-new Date().getTime(),0)
        let sl = Math.floor(msLeft/1000)
        time.innerHTML = Math.floor(sl/60)+":"+String(sl%60).padStart(2, '0')+"."+(Math.floor(msLeft/100)%10);
    },100)

    let submit = makeButton("Submit",()=>{
        let score = 0
        if(!isNaN(scoreFunc.numericValue)){
            score = Math.round(curQuestion.pts*scoreFunc.numericValue)
        }
        let calcState = calculator.getState()
        comm.sendMessage({
            type: "play",
            score: score,
            calc: JSON.stringify(calcState)
        })
        status.innerHTML = "Submitting ..."
    })

    let topBarLeft = makehbox(player?[score,time,submit]:[time])
    topBarLeft.className += player?" topBarLeft":" topBarLeftTime"

    let status = makeh("")
    let topBar = makehbox([topBarLeft,status])
    topBar.className += " topBar"

    let main = makevbox([
        topBar,
        elt
    ])

    return {
        html: main,
        serverMessage: (msg) => {
            switch(msg.subtype){
                case 'confirm':
                    status.innerHTML = "Best: "+msg.best + " pts"
                    break
                case 'question':
                    if(msg.best!=null) status.innerHTML = "Best: "+msg.best + " pts"
                    curQuestion = msg.question
                    endTime = msg.deadline
                    setQuestion()
                    break
                case 'alert':
                    status.innerHTML = msg.msg
                    break
            }
        }
    }
}