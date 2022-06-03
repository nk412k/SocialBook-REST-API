let io;

module.exports={
    init:(httpserver)=>{
        io = require("socket.io")(httpserver, { cors: { origin: "*" } });
        return io;
    },
    getIo:()=>{
        if(!io){
            throw new Error('Socket.io is not initialized');
        }
        return io;
    }
}
