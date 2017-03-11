
/**
 * 好友聊天
 * @constructor
 */
function Chat() {
    this.socket=io();
    this.text=document.querySelector(".content textarea");//发送内容
    this.JNoChat=document.querySelector(".J-no-chat");
    this.JheadImg=document.querySelector(".J-headImg");//自己头像
    this.JHeadName=document.querySelector(".J-headName");//自己的昵称
    this.friendUl=document.querySelector(".friendList ul");//好友列表ul
    this.messageUl=document.querySelector(".message ul");//聊天记录ul
    this.myInfo=null;//自己的信息
    this.friendArr=[];//好友信息
    this.initEvent();
}
Chat.prototype={
    initEvent:function () {
        this.friendUl.addEventListener('click',this.showChatWindow.bind(this));
        this.text.addEventListener('keydown',this.send.bind(this));//发送聊天内容
        this.socket.on('online',this.online.bind(this));//上线
        this.socket.on('offline',this.offline.bind(this));//下线
        this.socket.on('noticeAll',this.noticeAll.bind(this));//通知有用户上线
        this.socket.on('chat',this.chat.bind(this));//接收聊天内容
    },
    //显示聊天窗口
    showChatWindow:function (e) {
        if(e.currentTarget.querySelector(".active")){
            e.currentTarget.querySelector(".active").classList.remove("active");
        }
        var userId="";
        var nodename=e.target.nodeName.toLowerCase();
        if(nodename=="li"){
            e.target.classList.add('active');
            userId=e.target.getAttribute("data-userId");
            e.target.querySelector('.noRead').style.display="none";
        }else if(nodename=="p"||nodename=="img"){
            e.target.parentElement.classList.add("active");
            e.target.parentElement.querySelector('.noRead').style.display="none";
            userId=e.target.parentElement.getAttribute("data-userId");
        }
        this.messageUl.setAttribute("data-userId",userId);//给聊天窗口设置用户id
        this.messageUl.innerHTML="";
        this.JNoChat.style.display="none";
        //显示聊天记录
        if(sessionStorage.getItem(userId)){
            this.switchFriend(JSON.parse(sessionStorage.getItem(userId)));
        }

    },
    //上线
    online:function (data) {
        this.initData(data);
        sessionStorage.clear();//清除所有session
    },
    //下线
    offline:function (offUserId) {
        sessionStorage.removeItem(offUserId);//移除指定session
        this.offlineFriend(offUserId);
    },
    noticeAll:function (data) {
        this.onlineFriend(data);
    },
    initData:function (data) {
        for(var i=0;i<data.length;i++){
            if(data[i].userId==this.socket.id){
                this.myInfo=data[i];
                data.splice(i,1);
                this.friendArr=data;
                break;
            }
        }
        this.showMyInfo();
        this.showFriendList();
    },
    //发送聊天内容
    send:function (e) {
        var chatArr=[];
        var activeFriend=this.friendUl.querySelector('.active');
        var friendUserId=activeFriend.getAttribute("data-userId");
        var chatMsg={
            myHeadImgUrl:this.JheadImg.getAttribute("src"),//我的头像地址
            myUserId:this.socket.id,//用户id
            myMsg:e.target.value,//我发的信息
            friendHeadImgUrl:activeFriend.querySelector("img").getAttribute("src"),//朋友的用户id
            friendUserId:friendUserId,//朋友的用户id
            friendMsg:""//好友发的信息
        }
        if(!chatMsg.hasOwnProperty("chatDate")){
            var date=new Date();
            chatMsg.chatDate=date.getHours()+":"+date.getMinutes();//聊天时间
        }
        if(e.keyCode==13){
            if(sessionStorage.getItem(friendUserId)){
                chatArr=JSON.parse(sessionStorage.getItem(friendUserId));
            }
            chatArr.push(chatMsg);
            sessionStorage[friendUserId]=JSON.stringify(chatArr);
            this.showSendChatHistory(chatMsg);
            this.socket.emit('chat',chatMsg);
            e.target.value="";
        }
    },
    //聊天信息
    chat:function (data) {
        var chatArr=[];
        var chatMsg={}
        chatMsg.myHeadImgUrl=data.friendHeadImgUrl;//我的头像地址
        chatMsg.myUserId=data.friendUserId;//我的用户id
        chatMsg.myMsg=data.friendMsg;//我发的聊天信息
        chatMsg.friendHeadImgUrl=data.myHeadImgUrl;//朋友的用户id
        chatMsg.friendUserId=data.myUserId;//朋友的用户id
        chatMsg.friendMsg=data.myMsg;//好友发的聊天信息
        if(!chatMsg.hasOwnProperty("chatDate")){
            var date=new Date();
            chatMsg.chatDate=date.getHours()+":"+date.getMinutes();//聊天时间
        }
        if(sessionStorage.getItem(chatMsg.friendUserId)){
            chatArr=JSON.parse(sessionStorage.getItem(chatMsg.friendUserId))
        }
        chatArr.push(chatMsg);
        sessionStorage[chatMsg.friendUserId]=JSON.stringify(chatArr);

        var friendList=this.friendUl.querySelectorAll('li');
        for(var i=0;i<friendList.length;i++){
            if(friendList[i].getAttribute("data-userId")==chatMsg.friendUserId){
                if(friendList[i].classList.contains('active')){
                    this.showReciveChatHistory(chatMsg);
                }else{
                    friendList[i].querySelector(".noRead").style.display="block";
                }

            }

        }


    },
    //显示自己的信息
    showMyInfo:function () {
        this.JheadImg.setAttribute("src",this.myInfo.headUrl);
        this.JHeadName.textContent=this.myInfo.nickName;
    },
    //显示发送聊天记录
    showSendChatHistory:function (chatMsg) {
        var frament=document.createDocumentFragment();
        var li=document.createElement("li");
        var html="<div class='chatBox self' >"+
                       "<img class='avatar'   src="+chatMsg.myHeadImgUrl+">"+
                       "<div class='text'>"+chatMsg.myMsg+"</div>"+
                   "</div>";
        li.innerHTML=html;
        frament.appendChild(li);

        this.messageUl.appendChild(frament);

    },
    //显示接收聊天记录
    showReciveChatHistory:function (chatMsg) {
        var frament=document.createDocumentFragment();
        var li=document.createElement("li");
        var html="<div class='chatBox' >"+
                    "<img class='avatar'   src="+chatMsg.friendHeadImgUrl+">"+
                    "<div class='text'>"+chatMsg.friendMsg+"</div>"+
                "</div>";
        li.innerHTML=html;
        frament.appendChild(li);

        this.messageUl.appendChild(frament);
    },
    //切换好友窗口
    switchFriend:function (chatArr) {
        var frament=document.createDocumentFragment();
        for(var i=0;i<chatArr.length;i++){
            if(chatArr[i].myUserId&&chatArr[i].myMsg){
                this.showSendChatHistory(chatArr[i]);
            }else{
                this.showReciveChatHistory(chatArr[i]);
            }

        }
        this.messageUl.appendChild(frament);
    },
    //好友显示
    showFriendList:function () {
        var frament=document.createDocumentFragment();
        for(var i=0;i<this.friendArr.length;i++){
            var li=document.createElement("li");
            li.setAttribute("data-userId",this.friendArr[i].userId);
            var html="<img class='friendImg'  src="+this.friendArr[i].headUrl+">"+
                "<p class='name' >"+this.friendArr[i].nickName+"</p>"+
                "<i class='noRead'></i>";
            li.innerHTML=html;
            frament.appendChild(li);
        }
        this.friendUl.appendChild(frament);
    },
    //上线好友
    onlineFriend:function (data) {
        var frament=document.createDocumentFragment();
        var li=document.createElement("li");
        li.setAttribute("data-userId",data.userId);
        var html="<img class='friendImg'  src="+data.headUrl+">"+
            "<p class='name' >"+data.nickName+"</p>"+
            "<i class='noRead'></i>";
        li.innerHTML=html;
        frament.appendChild(li);
        this.friendUl.appendChild(frament);
    },
    //下线好友
    offlineFriend:function (offUserId) {
        var chatWindowUserId=this.messageUl.getAttribute("data-userId");
        if(chatWindowUserId==offUserId){
            this.messageUl.setAttribute("data-userId","");
            this.messageUl.innerHTML="";
            this.JNoChat.style.display="block";
        }
        var li=this.friendUl.getElementsByTagName("li");
        for(var i=0;i<li.length;i++){
            if(li[i].getAttribute("data-userId")==offUserId){
                li[i].parentElement.removeChild(li[i]);
                break;
            }
        }
    }
}

