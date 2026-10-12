import * as COLOR from './colors.js'
import * as fs from 'fs'

export function setupGameManager(sendMessage, removePlayer, broadcastMessage, safeLog){
    const DEFAULT_QUESTIONS = "qs/good.json"

    const WAIT_STATE = "wait"
    const PLAY_STATE = "play"
    const SHOW_SUBMISSION_STATE = "show_submission"
    const SHOW_BOARD_STATE = "show_board"
    const READY_STATE = "ready"
    const FINAL_STATE = "final"
    
    let showSubmissionsMax = 3
    let showSubmissionTime = 7000
    let showBoardTime = 5000
    let showReadyTime = 4000

    let knownPlayers = new Set()
    let existingNames = new Set()
    let playerNames = new Map()
    let serverState = WAIT_STATE

    let totalScores = new Map()
    let places = new Map()

    let curQuestion = 0
    let curScores = new Map()
    let curSubmissions = new Map()
    let deadline = 0
    let curTimeout = null
    let showingSubmission

    let questions = []

    function banName(target){
        for(const [id,name] of playerNames){
            if(name==target){
                removePlayer(id)
                knownPlayers.delete(id)
                existingNames.delete(target)
                playerNames.delete(id)
                totalScores.delete(id)
                places.delete(id)
                gameLog(target+" banned")
                updateBroadcast()
            }
        }
    }

    function loadServer(file){
        const content = fs.readFileSync(file, 'utf8');
        let obj = JSON.parse(content)
        totalScores = new Map(obj.totalScores)
        places = new Map(obj.places)
        questions = obj.questions
        curQuestion = obj.curQuestion
        knownPlayers = new Set(obj.knownPlayers)
        existingNames = new Set(obj.existingNames)
        playerNames = new Map(obj.playerNames)
        serverState = WAIT_STATE
    }

    function saveServer(){
        let obj = {
            totalScores: [...totalScores.entries()],
            places: [...places.entries()],
            questions: questions,
            curQuestion: curQuestion,
            knownPlayers: [...knownPlayers],
            existingNames: [...existingNames],
            playerNames: [...playerNames.entries()]
        }
        fs.writeFileSync('servSave.json',JSON.stringify(obj))
    }

    function sumId(str){
        return str.substring(0,str.indexOf('-'))
    }

    function gameError(str){
        safeLog(COLOR.RED+"GAME: "+str+COLOR.RESET)
    }

    function gameLog(str){
        safeLog(COLOR.GREEN+"GAME: "+str+COLOR.RESET)
    }

    function verifyName(str){
        if(str.length==0) return false;
        if(str.length>12) return false;
        const regex = /^[a-z0-9]+$/i
        return regex.test(str)
    }

    function getTotalScore(id){
        return totalScores.get(id)
    }

    function getPlace(id){
        return places.get(id)
    }

    function updatePlayer(id){
        switch(serverState){
            case WAIT_STATE:
                sendMessage(id,{
                    type: WAIT_STATE
                })
                break
            case PLAY_STATE:
                sendMessage(id,{
                    type: PLAY_STATE,
                    subtype: "question",
                    best: curScores.has(id)?curScores.get(id):null,
                    question: questions[curQuestion],
                    deadline: deadline
                })
                break
            case SHOW_SUBMISSION_STATE:
                sendMessage(id,{
                    type: SHOW_SUBMISSION_STATE
                })
                break
            case SHOW_BOARD_STATE:
                sendMessage(id,{
                    type: SHOW_BOARD_STATE,
                    score: getTotalScore(id),
                    place: getPlace(id)
                })
                break
            case READY_STATE:
                sendMessage(id,{
                    type: READY_STATE,
                    round: curQuestion+1,
                    question: questions[curQuestion]
                })
                break
            case FINAL_STATE:
                sendMessage(id,{
                    type: FINAL_STATE,
                    score: getTotalScore(id),
                    place: getPlace(id)
                })
                break
        }
    }

    function updateAllPlayers(){
        for (const id of knownPlayers){
            updatePlayer(id)
        }
    }

    function getPlacedList(){
        let list = Array(knownPlayers.length).fill(0)
        for(const id of knownPlayers){
            list[places.get(id)-1] = [id,playerNames.get(id),totalScores.get(id)]
        }
        return list
    }

    function getBroadcastMessage(){
        switch(serverState){
            case WAIT_STATE:
                return {
                    type: WAIT_STATE,
                    players: Array.from(knownPlayers).map(id=>playerNames.get(id))
                }
            case PLAY_STATE:
                return {
                    type: PLAY_STATE,
                    subtype: "question",
                    question: questions[curQuestion],
                    deadline: deadline
                }
            case SHOW_SUBMISSION_STATE:
                return {
                    type: SHOW_SUBMISSION_STATE,
                    question: questions[curQuestion],
                    score: curScores.get(showingSubmission),
                    calc: curSubmissions.get(showingSubmission),
                    name: playerNames.get(showingSubmission)
                }
            case SHOW_BOARD_STATE:
                return {
                    type: SHOW_BOARD_STATE,
                    list: getPlacedList()
                }
            case READY_STATE:
                return {
                    type: READY_STATE,
                    round: curQuestion+1,
                    question: questions[curQuestion]
                }
            case FINAL_STATE:
                return {
                    type: FINAL_STATE,
                    list: getPlacedList()
                }
        }
    }

    function updateBroadcast(){
        broadcastMessage(getBroadcastMessage())
    }

    let promptQuestion

    function endGame(){
        serverState = FINAL_STATE
        let scoreId = Array.from(totalScores)
        scoreId.sort((a, b) => b[1] - a[1])
        gameLog("game ended")
        for(let i=0; i<scoreId.length; i++){
            safeLog(i+1+": "+playerNames.get(scoreId[i][0])+" - "+scoreId[i][1])
        }
        updateAllPlayers()
        updateBroadcast()
    }

    function showReady(){
        gameLog("question "+curQuestion)
        serverState = READY_STATE
        curTimeout = setTimeout(()=>{
            curTimeout = null
            promptQuestion()
        },showReadyTime)
        updateAllPlayers()
        updateBroadcast()
    }

    function showBoard(){
        curQuestion+=1
        if(curQuestion==questions.length){
            endGame()
            return
        }
        serverState = SHOW_BOARD_STATE
        curTimeout = setTimeout(()=>{
            curTimeout = null
            showReady()
        },showBoardTime)
        updateAllPlayers()
        updateBroadcast()
    }

    function shuffle(array) {
        let currentIndex = array.length

        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex--

            [array[currentIndex], array[randomIndex]] = 
            [array[randomIndex], array[currentIndex]]
        }
    }

    function showSubmissions(){
        let subs = Array.from(curScores).filter(u=>u[1]>0).map(u=>u[0])
        let shows = []
        shuffle(subs)
        for(let i=0; i<subs.length && i<showSubmissionsMax; i++){
            shows.push(subs[i])
        }
        let curInd = 0
        function advance(){
            if(curInd==shows.length){
                showBoard()
            }else{
                serverState = SHOW_SUBMISSION_STATE
                showingSubmission = shows[curInd]
                curInd+=1
                updateAllPlayers()
                updateBroadcast()
                curTimeout = setTimeout(()=>{
                    curTimeout = null
                    advance()
                },showSubmissionTime)
            }
        }
        advance()
    }

    promptQuestion = ()=>{
        if(curQuestion>=questions.length){
            endGame()
            return
        }
        curScores = new Map()
        curSubmissions = new Map()
        serverState = PLAY_STATE
        let qtime = questions[curQuestion].time*1000
        deadline = new Date().getTime() + qtime
        curTimeout = setTimeout(()=>{
            curTimeout = null
            let scoreList = Array.from(curScores).map(u=>[u[1],playerNames.get(u[0])])
            scoreList.sort((a, b) => b[0] - a[0])
            for (const [id, score] of curScores){
                totalScores.set(id,totalScores.get(id)+score)
            }
            safeLog(scoreList)
            let scoreId = Array.from(totalScores)
            scoreId.sort((a, b) => b[1] - a[1])
            for(let i=0; i<scoreId.length; i++){
                places.set(scoreId[i][0],i+1)
            }
            saveServer()
            showSubmissions()
        },qtime)
        updateAllPlayers()
        updateBroadcast()
    }

    function startGame(){
        if(curTimeout!=null) clearTimeout(curTimeout)
        curTimeout = null
        curQuestion = 0
        let plc = 1
        for (const id of knownPlayers){
            totalScores.set(id,0)
            places.set(id,plc)
            plc+=1
        }
        showReady()
    }

    function continueGame(){
        if(curTimeout!=null) clearTimeout(curTimeout)
        curTimeout = null
        showReady()
    }

    function loadQuestions(file){
        const content = fs.readFileSync(file, 'utf8');
        questions = JSON.parse(content)
    }

    function playerMessage(id,msg){
        switch(msg.type){
            case "name":
                if(knownPlayers.has(id)){
                    gameError(sumId(id)+" gave a new name")
                    return;
                }
                if(!verifyName(msg.name)){
                    sendMessage(id,{
                        type: "name",
                        reason: "bad"
                    })
                }else if(existingNames.has(msg.name)){
                    sendMessage(id,{
                        type: "name",
                        reason: "used"
                    })
                }else{
                    gameLog("new player "+sumId(id)+" "+msg.name)
                    knownPlayers.add(id)
                    existingNames.add(msg.name)
                    playerNames.set(id,msg.name)
                    totalScores.set(id,0)
                    places.set(id,totalScores.size)
                    updatePlayer(id)
                    updateBroadcast()
                }
                break
            case PLAY_STATE:
                if(serverState!=PLAY_STATE){
                    sendMessage(id,{
                        type: PLAY_STATE,
                        subtype: "alert",
                        msg: "Round ended"
                    })
                    break
                }
                if(!Number.isInteger(msg.score)){
                    sendMessage(id,{
                        type: PLAY_STATE,
                        subtype: "alert",
                        msg: "Invalid score"
                    })
                    break
                }
                if(!curScores.has(id) || curScores.get(id)<msg.score){
                    curSubmissions.set(id,msg.calc)
                    curScores.set(id,msg.score)
                    gameLog("submit "+playerNames.get(id)+" - "+msg.score)
                }
                sendMessage(id,{
                    type: PLAY_STATE,
                    subtype: "confirm",
                    best: curScores.get(id)
                })
                break
        }
    }
        
    function playerJoin(id){
        if(knownPlayers.has(id)){
            updatePlayer(id)
            return
        }
        sendMessage(id,{
            type: "name",
            reason: "new"
        })
    }

    function inputLine(input){
        try{
            let cmd = input.split(" ")
            switch(cmd[0]){
                case "start":
                    startGame()
                    break
                case "loadq":
                    loadQuestions(cmd[1])
                    break
                case "loads":
                    loadServer(cmd[1])
                    break
                case "jmp":
                    curQuestion = parseInt(cmd[1])
                    continueGame()
                    break
                case "cont":
                    continueGame()
                    break
                case "ban":
                    banName(cmd[1])
                    break
            }
        } catch(e){
            gameError("Bad command: "+e.message)
        }
    }

    loadQuestions(DEFAULT_QUESTIONS)
    
    return {
        playerMessage: playerMessage,
        playerJoin: playerJoin,
        inputLine: inputLine,
        getBroadcastMessage: getBroadcastMessage
    }
}