function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function initConnection(type, onmessage, onopen){
    let socket = new WebSocket('ws://' + location.host)
    function send(msg){
        if(type=="player") msg.cookie = getCookie("playerCookie")
        socket.send(JSON.stringify(msg))
    }
    socket.onerror = e=>console.error(e)
    socket.onmessage = e=>{
        let msg = JSON.parse(e.data)
        if(msg.type=="system"){
            switch(msg.status){
                case "ok":
                    onopen()
                    break;
                case "cookie":
                    if(type!="player"){
                        console.error("Only player can get cookie")
                        return
                    }
                    setCookie("playerCookie",msg.cookie,1)
                    send({
                        type: "system",
                        connType: type
                    })
                    break;
            }
        }else onmessage(msg)
    }
    socket.onopen = ()=>{
        send({
            type: "system",
            connType: type
        })
    }
    return {
        sendMessage: send
    }
}