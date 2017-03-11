var express=require("express");
var app=require("express")();
var http=require("http").Server(app);
var io=require("socket.io")(http);
var User=require("./model/User");
var userArr=[];

app.use('/', express.static(__dirname));

/**
 * 随机头像url
 * @constructor
 */
function  randomHeadImg() {
    var url=Math.ceil(Math.random()*10);

    return "asset/img/"+url+".jpg";
}

io.on('connection',function (socket) {
    console.log('a user connected');
   var user= new User({
        userId:socket.id,
        headUrl:randomHeadImg(),
        nickName:socket.id
    });
    userArr.push(user);

    //app数据初始化
    this.sockets[socket.id].emit('online', userArr);

    //通知有用户上线
    socket.broadcast.emit('noticeAll',user);
    // this.sockets[socket.id].emit('online', userArr);

    socket.on('disconnect',function () {
        console.log('user disconnected');
        var offUserId=this.id;//下线用户id
        for(var i=0;i<userArr.length;i++){
            if(userArr[i].userId==this.id){
                userArr.splice(i,1);
            }
        }
        //下线通知
        io.emit('offline',offUserId);
    });
    socket.on('chat',function (data) {
        console.log('message:'+data);

        // io.emit('chat',data);
        io.sockets.sockets[data.friendUserId].emit('chat', data);
    });
});


http.listen(3000,function () {
    console.log("listening on *:3000");
});